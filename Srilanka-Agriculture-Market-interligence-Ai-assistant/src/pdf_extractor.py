from pypdf import PdfReader
import os


def extract_pdf_text(pdf_path):
    """
    Extract all text from a PDF
    """

    reader = PdfReader(pdf_path)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


if __name__ == "__main__":

    pdf_folder = "data/reports/weekly"

    pdf_files = [
        f for f in os.listdir(pdf_folder)
        if f.endswith(".pdf")
    ]

    print(f"Found {len(pdf_files)} PDFs")

    for pdf_file in pdf_files:

        pdf_path = os.path.join(
            pdf_folder,
            pdf_file
        )

        text = extract_pdf_text(pdf_path)

        txt_name = pdf_file.replace(
            ".pdf",
            ".txt"
        )

        output_path = os.path.join(
            "data/processed",
            txt_name
        )

        with open(
            output_path,
            "w",
            encoding="utf-8"
        ) as f:

            f.write(text)

        print(
            f"Saved {txt_name}"
        )

    print("\nAll PDFs processed successfully!")