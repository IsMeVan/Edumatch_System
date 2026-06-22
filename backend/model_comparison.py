import matplotlib.pyplot as plt
import numpy as np

# Data extracted from the HTML comparison chart
queries = [
    'Query 1: "កុំព្យូទ័រ"\n(Computer)',
    'Query 2: "ព័ត៌មាន technology"\n(Info Technology)',
    'Query 3: "គណនេយ្យ"\n(Accounting)'
]

# Custom Word2Vec results (top 3 matches, scores, correctness)
custom_data = [
    [("ម៉ាស៊ីនភ្លើង (Generator)", 0.991, "WRONG"),
     ("រោងចក្រភេសជ្ជៈ (Beverage Factory)", 0.990, "WRONG"),
     ("ការបរទេស (Foreign Ministry)", 0.990, "WRONG")],

    [("គិលានុបដ្ឋាក (Nursing)", 0.983, "WRONG"),
     ("ច្បាប់ (Law)", 0.982, "WRONG"),
     ("វិទ្យាសាស្ត្រសង្គម (Social Science)", 0.981, "WRONG")],

    [("សាកលវិទ្យាល័យសេដ្ឋកិច្ច (Econ Univ)", 0.990, "WRONG"),
     ("ធនាគារ (Banking)", 0.977, "OK"),
     ("គណនីយ្យ (Alt. Spelling)", 0.971, "OK")],
]

# Pre-trained e5-small results
pretrained_data = [
    [("វិទ្យាសាស្ត្រកុំព្យូទ័រ (CS)", 0.956, "CORRECT"),
     ("បច្ចេកវិទ្យាព័ត៌មាន (IT)", 0.909, "CORRECT"),
     ("គណនេយ្យ (Accounting)", 0.898, "CORRECT")],

    [("បច្ចេកវិទ្យាព័ត៌មាន (IT)", 0.969, "CORRECT"),
     ("វិទ្យាសាស្ត្រកុំព្យូទ័រ (CS)", 0.921, "CORRECT"),
     ("គណិតវិទ្យា (Mathematics)", 0.898, "CORRECT")],

    [("គណនេយ្យ (Accounting)", 1.000, "PERFECT"),
     ("គណិតវិទ្យា (Mathematics)", 0.933, "CORRECT"),
     ("វិទ្យាសាស្ត្រកុំព្យូទ័រ (CS)", 0.900, "CORRECT")],
]

color_correct = "#16a34a"
color_wrong = "#dc2626"

fig, axes = plt.subplots(3, 1, figsize=(11, 12))
fig.suptitle("Custom Word2Vec vs Pre-trained e5-small\nSemantic Similarity Test (Cambodian Education Queries)",
              fontsize=14, fontweight="bold")

for i, ax in enumerate(axes):
    labels = []
    scores = []
    colors = []

    # Custom model (top), pretrained model (bottom) for this query
    for label, score, status in custom_data[i]:
        labels.append(f"[Custom] {label}")
        scores.append(score)
        colors.append(color_wrong if status == "WRONG" else "#f59e0b")  # orange for OK

    for label, score, status in pretrained_data[i]:
        labels.append(f"[e5-small] {label}")
        scores.append(score)
        colors.append(color_correct)

    y_pos = np.arange(len(labels))
    ax.barh(y_pos, scores, color=colors)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=9)
    ax.invert_yaxis()
    ax.set_xlim(0, 1.05)
    ax.set_title(queries[i], fontsize=11, fontweight="bold", loc="left")
    ax.axhline(2.5, color="gray", linestyle="--", linewidth=0.8)

    for j, score in enumerate(scores):
        ax.text(score + 0.01, j, f"{score:.3f}", va="center", fontsize=8)

# Legend
from matplotlib.patches import Patch
legend_elems = [
    Patch(facecolor=color_wrong, label="Custom Word2Vec - Wrong"),
    Patch(facecolor="#f59e0b", label="Custom Word2Vec - OK"),
    Patch(facecolor=color_correct, label="Pre-trained e5-small - Correct"),
]
fig.legend(handles=legend_elems, loc="lower center", ncol=3, fontsize=10, frameon=False)

plt.tight_layout(rect=[0, 0.03, 1, 0.95])
plt.savefig("/mnt/user-data/outputs/model_comparison.png", dpi=150, bbox_inches="tight")
plt.show()
print("Saved chart to model_comparison.png")