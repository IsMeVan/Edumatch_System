"""
cosine_matcher.py
Compute cosine similarity between a user profile vector and many major vectors.
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


def rank_by_similarity(user_vector: np.ndarray, candidate_vectors: np.ndarray) -> np.ndarray:
    """
    user_vector:       shape (384,)
    candidate_vectors: shape (N, 384)
    Returns: array of N similarity scores (between -1 and 1)
    """
    user_vector = user_vector.reshape(1, -1)
    scores = cosine_similarity(user_vector, candidate_vectors)[0]
    return scores