"""
Test what engineering query matches.
Run: python test_recommend.py
"""
import numpy as np
import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=ENV_PATH)

from nlp.embedder import embed
from sklearn.metrics.pairwise import cosine_similarity

print("=" * 70)
print("Testing engineering query")
print("=" * 70)

# Check vectors file
vec_path = 'nlp_index/vectors.npy'
import datetime
print(f"\nVector file: {vec_path}")
print(f"Last modified: {datetime.datetime.fromtimestamp(os.path.getmtime(vec_path))}")

# Load vectors
vectors = np.load(vec_path)
ids = np.load('nlp_index/ids.npy')
print(f"Shape: {vectors.shape}")

# Embed query
query_text = "ខ្ញុំចង់សិក្សាផ្នែកវិស្វកម្ម"
print(f"\nQuery: {query_text}")
query = embed(query_text)

# Get all scores
scores = cosine_similarity([query], vectors)[0]

# Top 10
top_10_idx = np.argsort(scores)[::-1][:10]
top_ids = [int(ids[i]) for i in top_10_idx]

# Lookup in DB
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("""
    SELECT m.id, m.name_kh, i.name_kh as school, i.region
    FROM majors m
    JOIN institutions i ON i.id = m.institution_id
    WHERE m.id = ANY(%s)
""", (top_ids,))

rows = {r[0]: (r[1], r[2], r[3]) for r in cur.fetchall()}

print(f"\nTop 10 matches for 'engineering':")
print("-" * 70)
for rank, idx in enumerate(top_10_idx, 1):
    mid = int(ids[idx])
    info = rows.get(mid, ("?", "?", "?"))
    major, school, region = info
    print(f"{rank}. {major[:40]:<40} | {school[:30]:<30} | {region}")
    print(f"   ID={mid}, score={scores[idx]:.4f}")
    print()

cur.close()
conn.close()