"""
SignBridge Universal — ISL Gesture Model Trainer & Serializer
Member 1: Random Forest Classifier Trainer with Realistic Prototypes
"""
import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

from app.ml.vocabulary import SIGNS_LIST, SIGN_TO_INDEX
from app.ml.landmarks import normalize_landmarks


def generate_hand_prototype(finger_states: dict, base_orientation: str = "up") -> np.ndarray:
    """
    Generates a realistic canonical 21-point hand landmark skeleton (21, 3).
    finger_states: {'thumb': 0..1, 'index': 0..1, 'middle': 0..1, 'ring': 0..1, 'pinky': 0..1}
    0 = fully curled / fist, 1 = fully extended upright.
    """
    pts = np.zeros((21, 3), dtype=np.float32)

    # Wrist at (0, 0, 0)
    pts[0] = [0.0, 0.0, 0.0]

    # Palm base offsets
    pts[1] = [-0.15, 0.15, 0.0]   # Thumb CMC
    pts[5] = [-0.10, 0.35, 0.0]   # Index MCP
    pts[9] = [0.0, 0.38, 0.0]     # Middle MCP
    pts[13] = [0.10, 0.35, 0.0]   # Ring MCP
    pts[17] = [0.18, 0.30, 0.0]   # Pinky MCP

    # Finger configurations: [base_mcp_idx, pip_idx, dip_idx, tip_idx, x_dir, y_len]
    fingers = [
        ("thumb", 1, 2, 3, 4, -0.25, 0.28),
        ("index", 5, 6, 7, 8, -0.08, 0.40),
        ("middle", 9, 10, 11, 12, 0.0, 0.44),
        ("ring", 13, 14, 15, 16, 0.08, 0.40),
        ("pinky", 17, 18, 19, 20, 0.15, 0.34),
    ]

    for name, mcp_idx, pip_idx, dip_idx, tip_idx, x_dir, length in fingers:
        ext = finger_states.get(name, 1.0)
        base = pts[mcp_idx]

        if name == "thumb":
            # Thumb moves obliquely
            pts[pip_idx] = base + np.array([x_dir * 0.4, 0.10, 0.05 * (1.0 - ext)], dtype=np.float32)
            pts[dip_idx] = pts[pip_idx] + np.array([x_dir * 0.35, 0.10 * ext, 0.08 * (1.0 - ext)], dtype=np.float32)
            pts[tip_idx] = pts[dip_idx] + np.array([x_dir * 0.25, 0.10 * ext, 0.10 * (1.0 - ext)], dtype=np.float32)
        else:
            # Main fingers
            # If extended: points upward (+y); if curled: bends inward towards palm (+z, -y)
            y_ext = length * ext
            z_curl = length * (1.0 - ext) * 0.65

            pts[pip_idx] = base + np.array([x_dir * 0.2, y_ext * 0.4, z_curl * 0.3], dtype=np.float32)
            pts[dip_idx] = pts[pip_idx] + np.array([x_dir * 0.1, y_ext * 0.35, z_curl * 0.6], dtype=np.float32)
            pts[tip_idx] = pts[dip_idx] + np.array([0.0, y_ext * 0.25, z_curl * 0.9], dtype=np.float32)

    return pts


# Canonical finger extension configurations for all 25 ISL core signs
SIGN_PROTOTYPE_MAP = {
    # 1 = extended, 0 = curled
    "I": {"thumb": 0.2, "index": 0.9, "middle": 0.0, "ring": 0.0, "pinky": 0.0},
    "PAIN": {"thumb": 0.8, "index": 0.6, "middle": 0.5, "ring": 0.5, "pinky": 0.6},
    "STOMACH": {"thumb": 0.5, "index": 0.7, "middle": 0.7, "ring": 0.6, "pinky": 0.5},
    "CHEST": {"thumb": 0.9, "index": 1.0, "middle": 1.0, "ring": 1.0, "pinky": 1.0},
    "HEAD": {"thumb": 0.1, "index": 1.0, "middle": 0.1, "ring": 0.0, "pinky": 0.0},
    "FEVER": {"thumb": 0.8, "index": 0.9, "middle": 0.9, "ring": 0.9, "pinky": 0.9},
    "BREATHING_DIFFICULTY": {"thumb": 0.4, "index": 0.4, "middle": 0.4, "ring": 0.4, "pinky": 0.4},
    "DIZZY": {"thumb": 0.2, "index": 1.0, "middle": 0.2, "ring": 0.0, "pinky": 0.0},
    "BLOOD": {"thumb": 0.3, "index": 0.8, "middle": 0.0, "ring": 0.0, "pinky": 0.0},
    "MEDICINE": {"thumb": 0.3, "index": 0.3, "middle": 0.9, "ring": 0.8, "pinky": 0.8},
    "DOCTOR": {"thumb": 0.2, "index": 1.0, "middle": 1.0, "ring": 0.0, "pinky": 0.0},
    "HELP": {"thumb": 0.9, "index": 0.0, "middle": 0.0, "ring": 0.0, "pinky": 0.0},
    "EMERGENCY": {"thumb": 0.6, "index": 0.2, "middle": 0.2, "ring": 0.2, "pinky": 0.2},
    "ALLERGY": {"thumb": 0.7, "index": 0.5, "middle": 0.5, "ring": 0.0, "pinky": 0.0},
    "DIABETES": {"thumb": 0.0, "index": 0.7, "middle": 0.0, "ring": 0.0, "pinky": 0.0},
    "WATER": {"thumb": 0.0, "index": 1.0, "middle": 1.0, "ring": 1.0, "pinky": 0.0},
    "TOILET": {"thumb": 0.0, "index": 0.0, "middle": 0.0, "ring": 0.0, "pinky": 1.0},
    "YES": {"thumb": 0.1, "index": 0.0, "middle": 0.0, "ring": 0.0, "pinky": 0.0},
    "NO": {"thumb": 0.5, "index": 0.4, "middle": 0.4, "ring": 0.0, "pinky": 0.0},
    "WAIT": {"thumb": 0.9, "index": 0.9, "middle": 0.9, "ring": 0.9, "pinky": 0.9},
    "THANK_YOU": {"thumb": 0.8, "index": 1.0, "middle": 1.0, "ring": 1.0, "pinky": 1.0},
    "HOSPITAL": {"thumb": 0.0, "index": 0.9, "middle": 0.9, "ring": 0.0, "pinky": 0.0},
    "INJECTION": {"thumb": 0.5, "index": 0.8, "middle": 0.8, "ring": 0.1, "pinky": 0.0},
    "COLD": {"thumb": 0.0, "index": 0.1, "middle": 0.1, "ring": 0.1, "pinky": 0.1},
    "VOMIT": {"thumb": 0.7, "index": 0.7, "middle": 0.7, "ring": 0.7, "pinky": 0.7},
}


def generate_synthetic_dataset(samples_per_sign: int = 80, random_seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """Generates a high-quality, normalized synthetic dataset for the 25 core ISL signs."""
    rng = np.random.RandomState(random_seed)
    X_list = []
    y_list = []

    for sign_idx, sign_name in enumerate(SIGNS_LIST):
        states = SIGN_PROTOTYPE_MAP.get(sign_name, {"thumb": 0.5, "index": 0.5, "middle": 0.5, "ring": 0.5, "pinky": 0.5})
        base_prototype = generate_hand_prototype(states)

        for _ in range(samples_per_sign):
            # Apply subtle variations in finger curl
            perturbed_states = {
                k: np.clip(v + rng.normal(0.0, 0.04), 0.0, 1.0)
                for k, v in states.items()
            }
            sample_pts = generate_hand_prototype(perturbed_states)

            # Add 3D Gaussian spatial jitter to each landmark
            noise = rng.normal(0.0, 0.015, sample_pts.shape).astype(np.float32)
            sample_pts += noise

            # Normalize using wrist-relative 63-D normalizer
            normalized_vec = normalize_landmarks(sample_pts)

            X_list.append(normalized_vec)
            y_list.append(sign_idx)

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.int32)
    return X, y


def train_and_save_gesture_model(output_path: str = "backend/app/ml/gesture_model.pkl") -> None:
    """Trains a Random Forest classifier on the 25 ISL signs and serializes with joblib."""
    print("Generating synthetic prototype dataset for 25 core ISL medical signs...")
    X, y = generate_synthetic_dataset(samples_per_sign=100, random_seed=42)

    # Shuffle dataset
    indices = np.arange(len(X))
    np.random.RandomState(42).shuffle(indices)
    X = X[indices]
    y = y[indices]

    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    print(f"Training RandomForestClassifier(n_estimators=100, random_state=42) on {len(X_train)} samples...")
    clf = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        n_jobs=1,
        max_depth=20,
        min_samples_split=2,
    )
    clf.fit(X_train, y_train)

    train_score = clf.score(X_train, y_train)
    test_score = clf.score(X_test, y_test)
    print(f"Model Accuracy -> Train: {train_score * 100:.2f}%, Test: {test_score * 100:.2f}%")

    # Serialize bundle using joblib
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    model_bundle = {
        "model": clf,
        "classes": SIGNS_LIST,
        "sign_to_index": SIGN_TO_INDEX,
        "feature_dim": 63,
        "accuracy": round(float(test_score), 4),
    }

    joblib.dump(model_bundle, output_path, compress=3)
    print(f"Successfully serialized gesture model bundle to: {output_path}")


if __name__ == "__main__":
    train_and_save_gesture_model()
