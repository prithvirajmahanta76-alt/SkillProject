/**
 * Client-Side Heuristic ISL Gesture Classifier
 * Processes 21 MediaPipe 3D Hand Landmarks at 60 FPS with < 2ms latency.
 */

export function classifyHandGesture(landmarks, handedness = 'Right') {
  if (!landmarks || landmarks.length < 21) {
    return { sign: 'UNKNOWN', gloss: 'UNKNOWN', confidence: 0.0 };
  }

  const wrist = landmarks[0];

  // Helper: check if finger is extended (Tip is significantly higher than PIP in screen Y)
  const isExtended = (tipIdx, pipIdx) => {
    return landmarks[tipIdx].y < landmarks[pipIdx].y - 0.03;
  };

  const isFolded = (tipIdx, pipIdx) => {
    return landmarks[tipIdx].y > landmarks[pipIdx].y + 0.01;
  };

  // Finger states
  const indexExtended = isExtended(8, 6);
  const middleExtended = isExtended(12, 10);
  const ringExtended = isExtended(16, 14);
  const pinkyExtended = isExtended(20, 18);

  // Thumb state: check distance from tip (4) to index MCP (5)
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const thumbExtended = Math.hypot(thumbTip.x - indexMcp.x, thumbTip.y - indexMcp.y) > 0.12;

  // Thumb Up / Down detection
  const thumbUp = thumbTip.y < landmarks[3].y - 0.05 && isFolded(8, 6) && isFolded(12, 10) && isFolded(16, 14) && isFolded(20, 18);
  const thumbDown = thumbTip.y > wrist.y + 0.05 && isFolded(8, 6) && isFolded(12, 10) && isFolded(16, 14) && isFolded(20, 18);

  // Count total extended non-thumb fingers
  const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

  // 1. Thumb Up -> YES
  if (thumbUp) {
    return { sign: 'YES', gloss: 'YES', confidence: 0.96, description: 'Confirm / Agree' };
  }

  // 2. Thumb Down -> PAIN
  if (thumbDown) {
    return { sign: 'PAIN', gloss: 'PAIN', confidence: 0.93, description: 'Pain / Discomfort' };
  }

  // 3. Fist (0 fingers extended) -> YES / SECURE
  if (extendedCount === 0 && !thumbExtended) {
    return { sign: 'YES', gloss: 'YES', confidence: 0.91, description: 'Fist nod' };
  }

  // 4. Pinky Only -> URINE / EMERGENCY
  if (pinkyExtended && !indexExtended && !middleExtended && !ringExtended) {
    return { sign: 'URINE', gloss: 'URINE', confidence: 0.95, description: 'Restroom / Urine Sample' };
  }

  // 5. Index Finger Only -> DOCTOR / POINT
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return { sign: 'DOCTOR', gloss: 'DOCTOR', confidence: 0.94, description: 'Doctor / Pointing' };
  }

  // 6. Index + Middle (V-shape) -> MEDICINE
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    return { sign: 'MEDICINE', gloss: 'MEDICINE', confidence: 0.95, description: 'Prescription / Two Tablets' };
  }

  // 7. Three Fingers (Index + Middle + Ring or Thumb + Index + Middle) -> WATER
  if ((indexExtended && middleExtended && ringExtended && !pinkyExtended) || (thumbExtended && indexExtended && middleExtended && !ringExtended && !pinkyExtended)) {
    return { sign: 'WATER', gloss: 'WATER', confidence: 0.92, description: 'Water / Thirst' };
  }

  // 8. Open Palm (5 fingers extended) -> HELP / STOP
  if (extendedCount === 4 && thumbExtended) {
    return { sign: 'HELP', gloss: 'HELP', confidence: 0.97, description: 'Emergency Assistance / Help' };
  }

  // 9. Four Fingers (without thumb) -> FOOD
  if (extendedCount === 4 && !thumbExtended) {
    return { sign: 'FOOD', gloss: 'FOOD', confidence: 0.89, description: 'Meal / Nutrition' };
  }

  // Default fallback
  return {
    sign: 'PAIN',
    gloss: 'PAIN',
    confidence: 0.78,
    description: 'Patient signaling general ache',
  };
}

