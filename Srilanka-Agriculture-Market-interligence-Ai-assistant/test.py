import os

file_path = "data/processed/weekly_01_2025_Eng.txt"

with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

idx = text.find("Table 14")

print(idx)

print(text[idx:idx+3000])