import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import pickle
from pathlib import Path


def detect_trend(text):
    text = str(text).lower()

    if any(word in text for word in [
        "increased",
        "increase",
        "higher",
        "upward",
        "rise",
        "rising"
    ]):
        return "Increase"

    elif any(word in text for word in [
        "decreased",
        "decrease",
        "lower",
        "downward",
        "fall",
        "decline"
    ]):
        return "Decrease"

    return "Stable"


def main():
    root = Path.cwd()
    csv_paths = [root / "market_summary_refined.csv", root / "market_summary_dataset.csv", root / "output" / "market_summary_dataset.csv"]
    dataset_path = None

    for p in csv_paths:
        if p.exists():
            dataset_path = p
            break

    if dataset_path is None:
        raise FileNotFoundError("market_summary_dataset.csv not found in project root or output/")

    df = pd.read_csv(dataset_path)

    # Prefer RefinedTrend column if present, otherwise derive Trend from Text (override or fill existing labels)
    if "RefinedTrend" in df.columns:
        df["Trend"] = df["RefinedTrend"]
    else:
        df["Trend"] = df["Text"].apply(detect_trend)

    # Save intermediate CSV
    df.to_csv("market_summary_with_trends.csv", index=False)

    # TF-IDF features
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(df["Text"].fillna("").astype(str))
    y = df["Trend"]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluation
    y_pred = model.predict(X_test)
    print("Classification report:\n")
    print(classification_report(y_test, y_pred))

    # Save artifacts
    out_dir = Path("output") / "models"
    out_dir.mkdir(parents=True, exist_ok=True)

    with open(out_dir / "vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)

    with open(out_dir / "rf_model.pkl", "wb") as f:
        pickle.dump(model, f)

    print(f"Saved vectorizer and model to {out_dir}")


if __name__ == "__main__":
    main()
