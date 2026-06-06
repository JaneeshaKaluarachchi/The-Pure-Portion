import argparse
import pickle
from pathlib import Path
import pandas as pd
import sys


def load_artifacts(models_dir: Path):
    v_path = models_dir / "vectorizer.pkl"
    m_path = models_dir / "rf_model.pkl"

    if not v_path.exists() or not m_path.exists():
        raise FileNotFoundError(f"Model artifacts not found in {models_dir}")

    with open(v_path, "rb") as f:
        vectorizer = pickle.load(f)

    with open(m_path, "rb") as f:
        model = pickle.load(f)

    return vectorizer, model


def predict_text(text, vectorizer, model):
    X = vectorizer.transform([str(text)])
    return model.predict(X)[0]


def main():
    parser = argparse.ArgumentParser(description="Predict trend from text using trained model")
    parser.add_argument("--text", help="Single text string to predict")
    parser.add_argument("--input_csv", help="CSV file with a `Text` column to predict")
    parser.add_argument("--models_dir", default="output/models", help="Directory containing vectorizer.pkl and rf_model.pkl")

    args = parser.parse_args()

    models_dir = Path(args.models_dir)
    try:
        vectorizer, model = load_artifacts(models_dir)
    except Exception as e:
        print("Error loading model artifacts:", e)
        sys.exit(1)

    if args.text:
        pred = predict_text(args.text, vectorizer, model)
        print(pred)
        return

    if args.input_csv:
        df = pd.read_csv(args.input_csv)
        if "Text" not in df.columns:
            print("Input CSV must contain a `Text` column")
            sys.exit(1)

        df["PredictedTrend"] = df["Text"].fillna("").astype(str).apply(lambda t: predict_text(t, vectorizer, model))
        out_path = Path("output") / "predictions.csv"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out_path, index=False)
        print(f"Saved predictions to {out_path}")
        print(df[["Week","Commodity","PredictedTrend"]].head())
        return

    parser.print_help()


if __name__ == "__main__":
    main()
