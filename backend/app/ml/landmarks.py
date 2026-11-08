"""
Coordinate normalization for MediaPipe Hand Landmarks (63 dimensions).
Provides translation and scale invariance relative to wrist landmark (index 0).
"""
from typing import List
import numpy as np


def normalize_hand_landmarks(landmarks: List[dict]) -> np.ndarray:
    """
    Given 21 landmarks [{'x':..., 'y':..., 'z':...}],
    translates relative to wrist (landmark 0) and normalizes by max distance
    to achieve scale invariance.
    Returns 1D numpy array of shape (63,).
    """
    if len(landmarks) != 21:
        raise ValueError(f"Expected 21 landmarks, received {len(landmarks)}")

    coords = np.array([[lm["x"], lm["y"], lm.get("z", 0.0)] for lm in landmarks], dtype=np.float32)

    # 1. Wrist translation invariance (wrist at origin)
    wrist = coords[0]
    translated = coords - wrist

    # 2. Scale invariance (normalize by maximum Euclidean distance to wrist)
    distances = np.linalg.norm(translated, axis=1)
    max_dist = np.max(distances)
    if max_dist > 0:
        normalized = translated / max_dist
    else:
        normalized = translated

    return normalized.flatten()

