import re
import pandas as pd
from pathlib import Path


INCREASE_WORDS = [
    "increase",
    "increased",
    "increases",
    "higher",
    "higher",
    "upward",
    "rise",
    "rising",
    "up by",
    "up",
    "gain",
    "gained",
]

DECREASE_WORDS = [
    "decrease",
    "decreased",
    "decreases",
    "lower",
    "downward",
    "fall",
    "falling",
    "down by",
    "down",
    "decline",
    "declined",
]

NEGATIONS = ["not", "no", "without", "did not", "didn't", "was not", "weren't", "no significant"]


def has_negation_near(text: str, word: str, window=6) -> bool:
    """Return True if any negation appears within `window` words before `word` in text."""
    words = text.split()
    word = word.lower()
    for i, w in enumerate(words):
        if word in w:
            start = max(0, i - window)
            context = " ".join(words[start:i]).lower()
            for neg in NEGATIONS:
                if neg in context:
                    return True
    return False


def refined_detect_trend(text: str) -> str:
    if not isinstance(text, str):
        return "Stable"

    t = text.lower()

    # explicit percent changes
    if re.search(r"[-+]?[0-9]+\.?[0-9]*%", t) or re.search(r"\bincrease[s]? by \d", t) or re.search(r"\bdecrease[d]? by \d", t):
        # check sign words
        if any(w in t for w in INCREASE_WORDS) and not any(neg in t for neg in NEGATIONS):
            return "Increase"
        if any(w in t for w in DECREASE_WORDS) and not any(neg in t for neg in NEGATIONS):
            return "Decrease"

    # check for increase while avoiding negation context
    for w in INCREASE_WORDS:
        if w in t and not has_negation_near(t, w):
            return "Increase"

    for w in DECREASE_WORDS:
        if w in t and not has_negation_near(t, w):
            return "Decrease"

    return "Stable"


def main():
    root = Path.cwd()
    candidates = [root / "market_summary_dataset.csv", root / "output" / "market_summary_dataset.csv"]
    src = None
    for p in candidates:
        if p.exists():
            src = p
            break

    if src is None:
        raise FileNotFoundError("market_summary_dataset.csv not found")

    df = pd.read_csv(src)
    df["RefinedTrend"] = df["Text"].fillna("").astype(str).apply(refined_detect_trend)

    out = root / "market_summary_refined.csv"
    df.to_csv(out, index=False)
    print(f"Wrote refined dataset to {out}")
    print(df["RefinedTrend"].value_counts())


if __name__ == "__main__":
    main()
