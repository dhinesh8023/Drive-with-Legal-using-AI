"""
Violation detection service. DEMO MODE maps known scenarios to a violation
type with a plausible confidence score. This NEVER finalizes a legal fine —
see backend Violation model / officer review workflow for the human-in-the-loop
step required before any fine is generated.

REAL AI MODE would run YOLO-based object/plate detection plus rule logic
(e.g. speed-over-limit via radar/camera fusion) — see the note at the bottom.
"""
import random
from services.demo_scenarios import get_scenario_signals

SCENARIO_TO_VIOLATION = {
    "OVERSPEEDING": "OVERSPEEDING",
    "WRONG_SIDE_DRIVING": "WRONG_SIDE_DRIVING",
    "MOBILE_PHONE_USAGE": "MOBILE_PHONE_USAGE",
    "LANE_DEPARTURE": "LANE_VIOLATION",
    "UNSAFE_OVERTAKING": "DANGEROUS_DRIVING",
    "ACCIDENT": "DANGEROUS_DRIVING",
}


def detect_violation(req) -> dict:
    scenario = (req.scenario or "NORMAL_DRIVING").upper()
    violation_type = SCENARIO_TO_VIOLATION.get(scenario)

    if scenario == "OVERSPEEDING" and req.speed and req.speedLimit:
        detected = req.speed > req.speedLimit
    else:
        detected = violation_type is not None

    reasons = []
    confidence = 0.0

    if detected:
        confidence = round(random.uniform(0.78, 0.97), 2)
        reasons.append(f"AI pattern consistent with {violation_type.replace('_', ' ').title()}")
        reasons.append("Detection is AI-assisted and requires officer review before any fine is issued")
    else:
        reasons.append("No violation pattern detected")

    return {
        "status": "success",
        "violationDetected": detected,
        "violationType": violation_type if detected else None,
        "confidence": confidence,
        "reasons": reasons,
        "isDemoMode": True,
    }


# ---------------------------------------------------------------------------
# REAL AI MODE (future work):
#   - YOLOv8 model for vehicle/plate/helmet/seatbelt detection on camera frames
#   - OCR (e.g. Tesseract/PaddleOCR) for license plate recognition
#   - Radar/loop-sensor fusion for verified speed measurement
# All real-mode detections must still flow through the same officer-review
# workflow — AI confidence alone never generates an enforceable fine.
# ---------------------------------------------------------------------------
