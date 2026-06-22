"""
train_my_model.py

Trains a simple Word2Vec model from scratch using Cambodian
higher education data. This is intentionally simple to 
demonstrate model training and show why pre-trained models 
work better with limited data.

Usage:
    python train_my_model.py
"""

import os
import json
from pathlib import Path
from gensim.models import Word2Vec


# Find the data folder (assumes data/ is at project root, next to backend/)
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUTPUT_DIR = Path(__file__).resolve().parent / "my_trained_model"
OUTPUT_DIR.mkdir(exist_ok=True)


def load_all_text():
    """Load all text from JSON files in the data folder."""
    sentences = []
    file_count = 0
    
    if not DATA_DIR.exists():
        print(f"ERROR: Data folder not found at {DATA_DIR}")
        return []
    
    # Loop through all JSON files in data/
    for json_file in DATA_DIR.glob("*.json"):
        file_count += 1
        print(f"Loading: {json_file.name}")
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"  Failed to load {json_file.name}: {e}")
            continue
        
        # Extract all string values recursively
        extracted = extract_strings(data)
        for text in extracted:
            words = text.split()
            if len(words) > 0:
                sentences.append(words)
    
    print(f"\nLoaded {file_count} JSON files")
    print(f"Total sentences extracted: {len(sentences)}")
    
    return sentences


def extract_strings(obj, results=None):
    """Recursively extract all string values from nested JSON."""
    if results is None:
        results = []
    
    if isinstance(obj, str):
        if len(obj.strip()) > 0:
            results.append(obj.strip())
    elif isinstance(obj, dict):
        for value in obj.values():
            extract_strings(value, results)
    elif isinstance(obj, list):
        for item in obj:
            extract_strings(item, results)
    
    return results


def train_model(sentences):
    """Train the Word2Vec model."""
    print("\n" + "=" * 60)
    print("Starting training...")
    print("=" * 60)
    
    model = Word2Vec(
        sentences,
        vector_size=100,
        window=5,
        min_count=1,
        workers=4,
        epochs=50,
        seed=42,
    )
    
    print(f"\nTraining complete!")
    print(f"Vocabulary size: {len(model.wv.key_to_index)} unique words")
    
    return model


def test_model(model):
    """Test the trained model with some sample queries."""
    print("\n" + "=" * 60)
    print("Testing the trained model:")
    print("=" * 60)
    
    # Khmer test words
    test_words_kh = [
        "ព័ត៌មាន",
        "វិទ្យាសាស្ត្រ",
        "គណិតវិទ្យា",
        "គណនេយ្យ",
        "ភាសា",
    ]
    
    # English test words (if any English in your data)
    test_words_en = [
        "Computer",
        "Science",
        "Business",
    ]
    
    all_tests = test_words_kh + test_words_en
    
    for word in all_tests:
        if word in model.wv.key_to_index:
            print(f"\nWords similar to '{word}':")
            try:
                similar = model.wv.most_similar(word, topn=5)
                for similar_word, score in similar:
                    print(f"  {similar_word}: {score:.3f}")
            except Exception as e:
                print(f"  Error: {e}")
        else:
            print(f"\n'{word}' not in vocabulary (skipped)")


def save_model(model):
    """Save the trained model to disk."""
    model_path = OUTPUT_DIR / "my_word2vec.model"
    model.save(str(model_path))
    print(f"\n" + "=" * 60)
    print(f"Model saved to: {model_path}")
    print(f"File size: {os.path.getsize(model_path) / 1024:.1f} KB")
    print("=" * 60)


def main():
    print("=" * 60)
    print("Custom Word2Vec Training for EduMatch")
    print("=" * 60)
    print(f"Data folder: {DATA_DIR}")
    print(f"Output folder: {OUTPUT_DIR}\n")
    
    # Step 1: Load data
    sentences = load_all_text()
    
    if len(sentences) == 0:
        print("\nERROR: No data loaded. Check your data folder.")
        return
    
    # Step 2: Train
    model = train_model(sentences)
    
    # Step 3: Save
    save_model(model)
    
    # Step 4: Test
    test_model(model)
    
    print("\n" + "=" * 60)
    print("All done!")
    print("=" * 60)


if __name__ == "__main__":
    main()