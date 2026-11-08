"""
SignBridge Universal — Wrist-Relative 63-D Coordinate Normalizer
Member 1: ML Preprocessing Pipeline

Transforms 21 MediaPipe 3D hand landmarks into translation- and scale-invariant 63-D feature vectors.
"""
from typing import List, Union, Dict, Any
import numpy as np


def normalize_landmarks(landmarks: Union[List[List[float]], List[Dict[str, Any]], np.ndarray]) -> np.ndarray:
    """
    Normalizes 21 3D hand landmarks to be wrist-relative and scale-invariant.
    
    Algorithm:
    1. Parse input to (21, 3) numpy float32 array.
    2. Subtract wrist coordinate (index 0) from all 21 points (translation invariance).
    3. Flatten to 63-D vector.
    4. Divide by np.max(np.abs(flattened)) with safe zero-division handling (scale invariance).
    
    Returns:
        np.ndarray of shape (63,) with dtype float32.
    """
    if isinstance(landmarks, np.ndarray):
        if landmarks.ndim == 1 and landmarks.size == 63:
            # Already flattened 63 coordinates: reshape, translate, normalize
            coords = landmarks.reshape(21, 3).astype(np.float32)
        elif landmarks.ndim == 2 and landmarks.shape == (21, 3):
            coords = landmarks.astype(np.float32)
        else:
            raise ValueError(f"Invalid numpy array shape {landmarks.shape}, expected (21, 3) or (63,)")
    elif isinstance(landmarks, list):
        if len(landmarks) == 63 and isinstance(landmarks[0], (int, float)):
            coords = np.array(landmarks, dtype=np.float32).reshape(21, 3)
        elif len(landmarks) == 21:
            first = landmarks[0]
            if isinstance(first, dict):
                coords = np.array([[lm["x"], lm["y"], lm.get("z", 0.0)] for lm in landmarks], dtype=np.float32)
            elif isinstance(first, (list, tuple)):
                coords = np.array([[pt[0], pt[1], pt[2] if len(pt) > 2 else 0.0] for pt in landmarks], dtype=np.float32)
            else:
                raise ValueError("Expected landmarks list items to be list, tuple, or dict")
        else:
            raise ValueError(f"Expected 21 landmarks or 63 flattened values, received {len(landmarks)}")
    else:
        raise TypeError(f"Unsupported landmarks type: {type(landmarks)}")

    # Step 1: Wrist translation invariance (wrist at origin [0, 0, 0])
    wrist = coords[0].copy()
    translated = coords - wrist

    # Step 2: Flatten to 63-D float vector
    flattened = translated.flatten()

    # Step 3: Scale invariance (divide by max absolute value, handling zero safely)
    max_abs = np.max(np.abs(flattened))
    if max_abs > 1e-7:
        normalized = flattened / max_abs
    else:
        normalized = flattened

    return normalized.astype(np.float32)


# Alias for backward compatibility
normalize_hand_landmarks = normalize_landmarks
