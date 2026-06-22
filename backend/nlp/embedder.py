from sentence_transformers import SentenceTransformer
import numpy as np

_model = None
# Smaller alternatives (in order of quality vs size):
# - "intfloat/multilingual-e5-small"     (~120MB, FAST, good quality)
# - "intfloat/multilingual-e5-base"      (~280MB, better quality)
# - "BAAI/bge-m3"                        (~2.3GB, BEST but huge)
MODEL_NAME = "BAAI/bge-m3"


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"Loading {MODEL_NAME} (~2.3GB first time, be patient)...")
        _model = SentenceTransformer(MODEL_NAME)
        print("Model loaded.")
    return _model


def embed(text: str) -> np.ndarray:
    return get_model().encode(text, convert_to_numpy=True, normalize_embeddings=True)


def embed_batch(texts: list[str]) -> np.ndarray:
    return get_model().encode(texts, convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    # Already normalized so dot product = cosine similarity
    return float(np.dot(a, b))


def top_k(query_vec: np.ndarray, program_vecs: np.ndarray, k: int = 5) -> list[int]:
    # Already normalized so no need to divide by norms
    sims = program_vecs @ query_vec
    return np.argsort(sims)[::-1][:k].tolist()