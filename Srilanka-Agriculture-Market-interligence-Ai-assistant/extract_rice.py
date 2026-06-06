import re
import pandas as pd
from pathlib import Path

rows = []

for file in Path("data/processed").glob("*.txt"):

    text = open(file, encoding="utf-8").read()

    week = file.stem

    patterns = {
        "Samba1": r"Samba\s*1.*?(-?\d+\.\d+)",
        "Nadu1": r"Nadu\s*1.*?(-?\d+\.\d+)",
        "RawRed": r"Raw\s*\(Red\).*?(-?\d+\.\d+)"
    }

    for rice_type, pattern in patterns.items():

        match = re.search(pattern, text, re.S)

        if match:
            rows.append([
                week,
                rice_type,
                float(match.group(1))
            ])

df = pd.DataFrame(
    rows,
    columns=[
        "week",
        "rice_type",
        "price_change_pct"
    ]
)

df.to_csv("output/rice_price_changes.csv", index=False)

print(df.head())