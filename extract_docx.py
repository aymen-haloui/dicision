import docx
import os

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

# Extract text from both files
files = [
    'patient-parameteres/Données du patient 1 AM.docx',
    'patient-parameteres/Données du patient 2 AM 2.docx'
]

for file_path in files:
    if os.path.exists(file_path):
        print(f"\n=== {file_path} ===")
        text = extract_text_from_docx(file_path)
        print(text)
    else:
        print(f"File not found: {file_path}")