"""
build_index.py
Embed all majors with BGE-M3.
Enriched text — same style as user profile for better cosine similarity.
"""
import os
import sys
import numpy as np
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

sys.path.insert(0, os.path.dirname(__file__))
from embedder import embed_batch

DB_URL = os.getenv("DATABASE_URL")
INDEX_DIR = os.path.join(os.path.dirname(__file__), "..", "nlp_index")
os.makedirs(INDEX_DIR, exist_ok=True)


def build():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT m.id, m.name_kh, d.name_kh, i.name_kh
        FROM majors m
        JOIN departments d ON d.id = m.department_id
        JOIN institutions i ON i.id = m.institution_id
        ORDER BY m.id
    """)
    rows = cur.fetchall()

    if not rows:
        print("No majors found in DB.")
        return

    print(f"Building vectors for {len(rows)} majors...")

    texts = []
    ids = []

    for r in rows:
        major_id, major, dept, school = r

        text = " ".join([
            f"{major}",
            f"ផ្នែក{major}",
            f"សិក្សាផ្នែក{major}",
            f"អ្នកជំនាញផ្នែក{major}",
            f"គ្រឹះស្ថាន{school}",
            f"នាយកដ្ឋាន{dept}",
            f"ចង់រៀន{major}",
            f"ចាប់អារម្មណ៍លើ{major}",
            f"អាជីព{major}",
        ])
        texts.append(text)
        ids.append(major_id)

    print("\nFirst 3 embedding texts (sample):")
    for i in range(min(3, len(texts))):
        print(f"  {i+1}. {texts[i]}")

    print("\nEmbedding... (may take a few minutes with BGE-M3)")
    vectors = embed_batch(texts)

    np.save(os.path.join(INDEX_DIR, "vectors.npy"), vectors)
    np.save(os.path.join(INDEX_DIR, "ids.npy"), np.array(ids))

    print(f"\n[OK] Saved {len(rows)} vectors to {INDEX_DIR}/")
    print(f"     Vector shape: {vectors.shape}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    build()