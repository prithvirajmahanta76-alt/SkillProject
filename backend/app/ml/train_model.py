"""
Offline trainer script for ISL Random Forest Classifier.
Trains on deterministic 21-point geometric hand prototypes for 25 ISL medical signs.
Each prototype encodes anatomically meaningful landmark positions, then augmented
with Gaussian jitter to produce 100 samples per class (2,500 total).
"""
import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from app.ml.vocabulary import GLOSS_LIST


# ---------------------------------------------------------------------------
# 21 MediaPipe Hands landmark indices:
#  0=WRIST, 1-4=THUMB(CMC,MCP,IP,TIP), 5-8=INDEX, 9-12=MIDDLE,
#  13-16=RING, 17-20=PINKY (MCP,PIP,DIP,TIP)
# Each landmark: (x, y, z)  → 21*3 = 63 floats
# Convention: wrist at origin, hand roughly fits in unit sphere.
# ---------------------------------------------------------------------------

def _build_prototype(finger_ext: dict) -> np.ndarray:
    """
    Build a 21-landmark (63-float) prototype from a compact finger-state dict.
    finger_ext keys: 'thumb', 'index', 'middle', 'ring', 'pinky'
    value: 0.0 = fully curled, 1.0 = fully extended.
    z values simulate slight depth (irrelevant for RF, but keeps shape realistic).
    """
    pts = np.zeros((21, 3), dtype=np.float32)

    # --- Wrist (landmark 0) ---
    pts[0] = [0.0, 0.0, 0.0]

    # ----- Thumb (1-4) -----
    te = finger_ext.get('thumb', 0.0)
    pts[1] = [-0.15, 0.05, 0.0]            # CMC
    pts[2] = [-0.25 - te * 0.05, 0.10 + te * 0.08, 0.0]  # MCP
    pts[3] = [-0.30 - te * 0.10, 0.18 + te * 0.10, 0.0]  # IP
    pts[4] = [-0.33 - te * 0.14, 0.26 + te * 0.12, te * 0.02]  # TIP

    # ----- Finger helper -----
    # finger_x_base: lateral offset for each finger column
    finger_configs = [
        # (x_base, MCP_y, curl_direction, label)
        (0.05,  0.20, 'index'),
        (0.00,  0.22, 'middle'),
        (-0.05, 0.20, 'ring'),
        (-0.10, 0.17, 'pinky'),
    ]
    lm_offset = 5  # landmark 5 = index MCP
    for x_base, mcp_y, key in finger_configs:
        ext = finger_ext.get(key, 0.0)
        # MCP stays near palm
        pts[lm_offset + 0] = [x_base, mcp_y, 0.0]
        # PIP: curls toward palm when ext=0
        pts[lm_offset + 1] = [x_base + ext * 0.00, mcp_y + 0.08 + ext * 0.06, -ext * 0.02]
        # DIP
        pts[lm_offset + 2] = [x_base + ext * 0.00, mcp_y + 0.15 + ext * 0.10, -ext * 0.03]
        # TIP: fully curled → near MCP; extended → above DIP
        if ext > 0.5:
            pts[lm_offset + 3] = [x_base, mcp_y + 0.22 + ext * 0.10, -ext * 0.03]
        else:
            # curled: tip returns toward palm
            pts[lm_offset + 3] = [x_base + (1 - ext) * 0.05, mcp_y + 0.08 - (1 - ext) * 0.06, (1 - ext) * 0.04]
        lm_offset += 4

    # Normalize: center at wrist (pt 0 already 0,0,0), scale by max Euclidean distance
    max_dist = np.max(np.linalg.norm(pts, axis=1)) + 1e-7
    pts /= max_dist
    return pts.flatten()


# ---------------------------------------------------------------------------
# 25 ISL sign prototypes — compact hand-shape descriptions
# ---------------------------------------------------------------------------
ISL_PROTOTYPES = {
    # GLOSS: {'thumb': ext, 'index': ext, 'middle': ext, 'ring': ext, 'pinky': ext}
    "PAIN":        {'thumb': 0.0, 'index': 1.0, 'middle': 0.3, 'ring': 0.1, 'pinky': 0.0},
    "DOCTOR":      {'thumb': 0.5, 'index': 1.0, 'middle': 1.0, 'ring': 0.0, 'pinky': 0.0},
    "MEDICINE":    {'thumb': 0.8, 'index': 0.5, 'middle': 0.5, 'ring': 0.3, 'pinky': 0.3},
    "HOSPITAL":    {'thumb': 0.6, 'index': 1.0, 'middle': 1.0, 'ring': 1.0, 'pinky': 1.0},
    "EMERGENCY":   {'thumb': 1.0, 'index': 1.0, 'middle': 0.0, 'ring': 0.0, 'pinky': 0.0},
    "HELP":        {'thumb': 1.0, 'index': 0.0, 'middle': 0.0, 'ring': 0.0, 'pinky': 0.0},
    "WATER":       {'thumb': 0.0, 'index': 0.3, 'middle': 0.3, 'ring': 0.3, 'pinky': 0.3},
    "FOOD":        {'thumb': 0.5, 'index': 0.5, 'middle': 0.5, 'ring': 0.5, 'pinky': 0.5},
    "FEVER":       {'thumb': 0.2, 'index': 0.9, 'middle': 0.9, 'ring': 0.1, 'pinky': 0.1},
    "HEADACHE":    {'thumb': 0.0, 'index': 0.0, 'middle': 0.0, 'ring': 0.0, 'pinky': 0.0},
    "STOMACH":     {'thumb': 0.3, 'index': 0.0, 'middle': 0.0, 'ring': 0.0, 'pinky': 0.0},
    "CHEST":       {'thumb': 1.0, 'index': 0.9, 'middle': 0.9, 'ring': 0.9, 'pinky': 0.9},
    "BREATHE":     {'thumb': 0.6, 'index': 0.6, 'middle': 0.6, 'ring': 0.6, 'pinky': 0.6},
    "DIZZY":       {'thumb': 0.4, 'index': 1.0, 'middle': 0.0, 'ring': 1.0, 'pinky': 0.0},
    "YES":         {'thumb': 0.0, 'index': 1.0, 'middle': 0.0, 'ring': 0.0, 'pinky': 0.0},
    "NO":          {'thumb': 0.9, 'index': 1.0, 'middle': 1.0, 'ring': 0.0, 'pinky': 0.0},
    "PLEASE":      {'thumb': 1.0, 'index': 0.0, 'middle': 0.0, 'ring': 0.0, 'pinky': 1.0},
    "THANK_YOU":   {'thumb': 0.5, 'index': 1.0, 'middle': 0.5, 'ring': 0.0, 'pinky': 0.0},
    "STOP":        {'thumb': 0.9, 'index': 0.9, 'middle': 0.9, 'ring': 0.9, 'pinky': 0.9},
    "WAIT":        {'thumb': 0.3, 'index': 0.9, 'middle': 0.9, 'ring': 0.9, 'pinky': 0.9},
    "INJECTION":   {'thumb': 0.0, 'index': 1.0, 'middle': 0.0, 'ring': 0.0, 'pinky': 0.0},
    "BLOOD":       {'thumb': 1.0, 'index': 0.0, 'middle': 0.0, 'ring': 0.0, 'pinky': 0.0},
    "URINE":       {'thumb': 0.7, 'index': 0.3, 'middle': 0.3, 'ring': 0.7, 'pinky': 0.7},
    "WHEELCHAIR":  {'thumb': 0.4, 'index': 0.4, 'middle': 0.4, 'ring': 0.4, 'pinky': 0.4},
    "FAMILY":      {'thumb': 1.0, 'index': 1.0, 'middle': 1.0, 'ring': 1.0, 'pinky': 1.0},
}

# Verify all 25 vocabulary signs have prototypes
for gloss in GLOSS_LIST:
    assert gloss in ISL_PROTOTYPES, f"Missing prototype for gloss: {gloss}"


def train_baseline_model(output_path: str = "app/ml/gesture_model.pkl"):
    """
    Trains a Random Forest model on 25 deterministic geometric ISL hand prototypes.
    Each prototype is augmented with Gaussian jitter (σ=0.04) → 100 samples/class → 2,500 total.
    Uses sklearn 1.5.2 (venv-pinned). Never upgrade sklearn without regenerating this file.
    """
    np.random.seed(42)
    n_jitter = 100          # samples per class (after augmentation)
    sigma = 0.04            # jitter std — small relative to unit-normalized landmarks

    X_list = []
    y_list = []

    for class_idx, gloss in enumerate(GLOSS_LIST):
        proto = _build_prototype(ISL_PROTOTYPES[gloss])  # (63,)
        # Augment: add Gaussian noise around deterministic prototype
        noise = np.random.normal(0, sigma, (n_jitter, 63)).astype(np.float32)
        samples = proto[np.newaxis, :] + noise  # (100, 63)
        # Re-normalize each augmented sample (keeps unit-sphere property)
        for i in range(n_jitter):
            pts = samples[i].reshape(21, 3)
            max_d = np.max(np.linalg.norm(pts, axis=1)) + 1e-7
            samples[i] = (pts / max_d).flatten()
        X_list.append(samples)
        y_list.extend([class_idx] * n_jitter)

    X = np.vstack(X_list)          # (2500, 63)
    y = np.array(y_list)           # (2500,)

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X, y)

    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    with open(output_path, "wb") as f:
        pickle.dump({"model": clf, "classes": GLOSS_LIST}, f)

    # Quick sanity-check: verify each prototype is predicted correctly
    n_correct = 0
    for class_idx, gloss in enumerate(GLOSS_LIST):
        proto = _build_prototype(ISL_PROTOTYPES[gloss]).reshape(1, -1)
        pred = clf.predict(proto)[0]
        if GLOSS_LIST[pred] == gloss:
            n_correct += 1

    print(f"[train_model] Saved to {output_path}")
    print(f"[train_model] Prototype self-test: {n_correct}/{len(GLOSS_LIST)} correct")
    print(f"[train_model] Training samples: {X.shape[0]} × {X.shape[1]} features")
    print(f"[train_model] sklearn version used: ", end="")
    import sklearn
    print(sklearn.__version__)


if __name__ == "__main__":
    train_baseline_model()
