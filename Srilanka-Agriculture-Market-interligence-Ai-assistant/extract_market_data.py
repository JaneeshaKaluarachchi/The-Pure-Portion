import os
import pandas as pd
import re

data_folder = "data/processed"

records = []

keywords = [
    "rice",
    "vegetable",
    "onion",
    "potato",
    "fish",
    "egg",
    "coconut",
    "fruit",
    "dhal",
    "sugar",
    "chicken"
]

for filename in os.listdir(data_folder):

    if filename.endswith(".txt"):

        filepath = os.path.join(data_folder, filename)

        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()

        paragraphs = text.split("\n")

        for para in paragraphs:

            para_lower = para.lower()

            commodity = None

            for key in keywords:
                if key in para_lower:
                    commodity = key
                    break

            if commodity:

                trend = "Unknown"

                if any(word in para_lower for word in [
                    "increase",
                    "increased",
                    "higher",
                    "rise",
                    "rising"
                ]):
                    trend = "Increase"

                elif any(word in para_lower for word in [
                    "decrease",
                    "decreased",
                    "lower",
                    "fall",
                    "decline"
                ]):
                    trend = "Decrease"

                records.append({
                    "Week": filename,
                    "Commodity": commodity,
                    "Trend": trend,
                    "Text": para.strip()
                })

df = pd.DataFrame(records)

df.to_csv(
    "output/market_summary_dataset.csv",
    index=False
)

print("Dataset Created Successfully!")
print(df.head())