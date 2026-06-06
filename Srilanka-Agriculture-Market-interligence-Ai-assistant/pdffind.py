import os

pdf_files = [
    f for f in os.listdir("data/reports/weekly")
    if f.endswith(".pdf")
]