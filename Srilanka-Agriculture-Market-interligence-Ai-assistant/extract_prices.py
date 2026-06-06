import os

folder = "data/processed"

files = sorted([f for f in os.listdir(folder) if f.endswith(".txt")])

print(f"Found {len(files)} files")

for f in files:
    print(f)