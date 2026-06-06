from flask import Flask, request, jsonify
from pathlib import Path
import pickle
import traceback


def load_artifacts(models_dir: Path):
    v_path = models_dir / "vectorizer.pkl"
    m_path = models_dir / "rf_model.pkl"
    if not v_path.exists() or not m_path.exists():
        raise FileNotFoundError("Model artifacts not found in " + str(models_dir))

    with open(v_path, "rb") as f:
        vectorizer = pickle.load(f)

    with open(m_path, "rb") as f:
        model = pickle.load(f)

    return vectorizer, model


app = Flask(__name__)

MODELS_DIR = Path("output") / "models"
VECTOR, MODEL = None, None

# Load artifacts at import time so the app is ready to serve requests
try:
    VECTOR, MODEL = load_artifacts(MODELS_DIR)
except Exception as e:
    print("Warning: could not load model artifacts:", e)


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        text = data.get("text")
        if text is None:
            return jsonify({"error": "Provide 'text' in JSON body"}), 400

        X = VECTOR.transform([str(text)])
        pred = MODEL.predict(X)[0]
        return jsonify({"prediction": str(pred)})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
