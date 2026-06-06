**Project**: AI-Powered Sri Lankan Agricultural Market Intelligence

**Quick Start**

- Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

- Train model (reads `market_summary_dataset.csv` or `output/market_summary_dataset.csv`):

```bash
python3 train_trend_model.py
```

- Predict single text:

```bash
python3 predict_trend.py --text "Rice prices increased due to limited stocks."
```

- Batch predict a CSV (must contain `Text` column):

```bash
python3 predict_trend.py --input_csv market_summary_dataset.csv
```

Predictions will be saved to `output/predictions.csv`.

API Server
-
Start the Flask API to serve predictions:

```bash
python3 app.py
```

POST a JSON payload with a `text` field to `/predict`:

```bash
curl -X POST -H "Content-Type: application/json" \\
	-d '{"text":"Rice prices increased due to limited stocks."}' \\
	http://127.0.0.1:5000/predict
```

Response example:

```json
{"prediction": "Increase"}
```

Notes: Ensure `output/models/vectorizer.pkl` and `output/models/rf_model.pkl` exist (created by `train_trend_model.py`).

Docker
-----
Build the image and run with Docker:

```bash
docker build -t market-intel:latest .
docker run -p 5000:5000 market-intel:latest
```

Or with docker-compose (bind-mounts the project folder):

```bash
docker-compose up --build
```

The API will be available at `http://127.0.0.1:5000/predict`.
