"""
test_compare_models.py

Compare my trained Word2Vec model with the pre-trained
e5-small model. Shows why pre-trained is better.
Generates a bar chart comparing the results.
"""

from gensim.models import Word2Vec
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path


# English translations for display in the chart (Khmer text still used for actual model queries)
TRANSLATIONS = {
    "ព័ត៌មាន": "Information",
    "កុំព្យូទ័រ": "Computer",
    "វិទ្យាសាស្ត្រ": "Science",
    "គណនេយ្យ": "Accounting",
    "ព័ត៌មាន technology": "Information Technology",
    "បច្ចេកវិទ្យាព័ត៌មាន": "Information Technology",
    "វិទ្យាសាស្ត្រកុំព្យូទ័រ": "Computer Science",
    "គណិតវិទ្យា": "Mathematics",
    "ភាសាអង់គ្លេស": "English Language",
    "សិល្បៈ": "Art",
    "សង្កាត់ព្រែកឯង": "Prek Eng Commune (address)",
    "៥៥": "55 (number)",
}


def en(label):
    """Return English translation for a Khmer label, or the label itself if unknown."""
    return TRANSLATIONS.get(label, label)


# Paths
MY_MODEL_PATH = Path(__file__).resolve().parent / "my_trained_model" / "my_word2vec.model"


def test_my_model():
    """Test my trained Word2Vec model. Returns results for graphing."""
    print("=" * 60)
    print("MY TRAINED MODEL (Word2Vec, trained on 5,522 sentences)")
    print("=" * 60)

    model = Word2Vec.load(str(MY_MODEL_PATH))

    test_words = ["ព័ត៌មាន", "កុំព្យូទ័រ", "វិទ្យាសាស្ត្រ", "គណនេយ្យ"]

    results = {}
    for word in test_words:
        if word in model.wv.key_to_index:
            print(f"\n'{word}' similar to:")
            similar = model.wv.most_similar(word, topn=3)
            for w, s in similar:
                print(f"  {w}: {s:.3f}")
            results[word] = similar
        else:
            print(f"\n'{word}' NOT in my vocabulary")
            results[word] = []

    return results


def test_e5_model():
    """Test the pre-trained e5-small model. Returns results for graphing."""
    print("\n" + "=" * 60)
    print("PRE-TRAINED MODEL (e5-small, trained on billions of texts)")
    print("=" * 60)

    print("Loading e5-small model...")
    model = SentenceTransformer('intfloat/multilingual-e5-small')

    # Test sentences instead of single words (e5 needs context)
    queries = [
        "ព័ត៌មាន technology",
        "កុំព្យូទ័រ",
        "វិទ្យាសាស្ត្រ",
        "គណនេយ្យ",
    ]

    # Candidate majors to compare against
    candidates = [
        "បច្ចេកវិទ្យាព័ត៌មាន",
        "វិទ្យាសាស្ត្រកុំព្យូទ័រ",
        "គណិតវិទ្យា",
        "គណនេយ្យ",
        "ភាសាអង់គ្លេស",
        "សិល្បៈ",
        "សង្កាត់ព្រែកឯង",  # Address - should be LOW match!
        "៥៥",  # Number - should be LOW match!
    ]

    candidate_vecs = model.encode(candidates)

    results = {}
    for query in queries:
        query_vec = model.encode([query])
        scores = cosine_similarity(query_vec, candidate_vecs)[0]

        # Top 3
        top_indices = np.argsort(scores)[::-1][:3]

        print(f"\n'{query}' similar to:")
        top3 = []
        for idx in top_indices:
            print(f"  {candidates[idx]}: {scores[idx]:.3f}")
            top3.append((candidates[idx], float(scores[idx])))
        results[query] = top3

    return results


def plot_comparison(my_results, e5_results):
    """Create a bar chart comparing top-3 similarity scores per query."""

    # Pair up queries from the two models (by order, since wording differs slightly)
    my_keys = list(my_results.keys())
    e5_keys = list(e5_results.keys())
    n_queries = max(len(my_keys), len(e5_keys))

    fig, axes = plt.subplots(n_queries, 1, figsize=(10, 4 * n_queries))
    if n_queries == 1:
        axes = [axes]

    fig.suptitle(
        "My Word2Vec vs Pre-trained e5-small\nTop-3 Similarity Scores per Query",
        fontsize=14, fontweight="bold"
    )

    for i in range(n_queries):
        ax = axes[i]
        labels, scores, colors = [], [], []

        # My model results
        if i < len(my_keys):
            key = my_keys[i]
            for w, s in my_results.get(key, []):
                labels.append(f"[MyModel] {en(w)}")
                scores.append(s)
                colors.append("#dc2626")  # red

        # e5 results
        if i < len(e5_keys):
            key = e5_keys[i]
            for w, s in e5_results.get(key, []):
                labels.append(f"[e5-small] {en(w)}")
                scores.append(s)
                colors.append("#16a34a")  # green

        y_pos = np.arange(len(labels))
        ax.barh(y_pos, scores, color=colors)
        ax.set_yticks(y_pos)
        ax.set_yticklabels(labels, fontsize=9)
        ax.invert_yaxis()
        ax.set_xlim(0, 1.05)

        title_query = my_keys[i] if i < len(my_keys) else e5_keys[i]
        ax.set_title(f"Query {i+1}: \"{en(title_query)}\"", fontsize=11, fontweight="bold", loc="left")

        for j, score in enumerate(scores):
            ax.text(score + 0.01, j, f"{score:.3f}", va="center", fontsize=8)

        if len(my_keys) > 0 and len(e5_keys) > 0:
            ax.axhline(2.5, color="gray", linestyle="--", linewidth=0.8)

    from matplotlib.patches import Patch
    legend_elems = [
        Patch(facecolor="#dc2626", label="My Word2Vec"),
        Patch(facecolor="#16a34a", label="Pre-trained e5-small"),
    ]
    fig.legend(handles=legend_elems, loc="lower center", ncol=2, fontsize=10, frameon=False)

    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    out_path = Path(__file__).resolve().parent / "model_comparison_results.png"
    plt.savefig(out_path, dpi=150, bbox_inches="tight")
    print(f"\nSaved comparison chart to: {out_path}")
    plt.show()


def main():
    my_results = test_my_model()
    e5_results = test_e5_model()

    print("\n" + "=" * 60)
    print("CONCLUSION")
    print("=" * 60)
    print("""
My trained model only learned from 5,522 sentences in
the Cambodian education dataset. It memorized patterns
like which words appear together in addresses and
school names, but it did not learn real semantic meaning.

The pre-trained e5-small model was trained on billions
of multilingual texts, giving it true understanding of
word relationships. This is why pre-trained models are
the better choice for EduMatch.
    """)

    plot_comparison(my_results, e5_results)


if __name__ == "__main__":
    main()