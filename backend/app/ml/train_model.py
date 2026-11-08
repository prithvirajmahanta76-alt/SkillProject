"""
Offline trainer script for ISL Random Forest Classifier.
Trains on synthetic / collected 63-dim normalized landmark datasets.
"""
import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from app.ml.vocabulary import GLOSS_LIST


def train_baseline_model(output_path: str = "app/ml/gesture_model.pkl"):
    """Trains a quick baseline Random Forest model for the 25 ISL signs."""
    np.random.seed(42)
    n_samples_per_class = 20
    n_classes = len(GLOSS_LIST)

    # Generate synthetic baseline coordinates for scaffolding
    X = np.random.randn(n_classes * n_samples_per_class, 63).astype(np.float32)
    y = np.repeat(np.arange(n_classes), n_samples_per_class)

    clf = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=10)
    clf.fit(X, y)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        pickle.dump({"model": clf, "classes": GLOSS_LIST}, f)

    print(f"Model saved successfully to {output_path}")


if __name__ == "__main__":
    train_baseline_model()

