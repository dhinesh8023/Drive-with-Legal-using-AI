"""
Driver monitoring service. DEMO MODE simulates attention/drowsiness/distraction
based on scenario input or simple thresholded inputs. REAL AI MODE would use
face-landmark detection (eye-aspect-ratio, head pose) via OpenCV/dlib/mediapipe —
see the REAL AI MODE notes below for the intended integration point.
"""
from services.demo_scenarios import get_scenario_signals


def analyze_driver(req) -> dict:
    signals = get_scenario_signals(req.scenario)

    attention = signals.get("driverAttention", 90)
    drowsiness = bool(signals.get("drowsiness", False)) or (req.eyesClosedDurationSeconds or 0) > 2
    distraction = bool(signals.get("distraction", False)) or (req.headTurnedAwaySeconds or 0) > 1.5
    phone_usage = bool(signals.get("mobileUsage", False)) or bool(req.phoneVisible)

    reasons = []
    if drowsiness:
        reasons.append("Eyes closed / drowsy pattern detected")
    if distraction:
        reasons.append("Head turned away from road / distraction pattern detected")
    if phone_usage:
        reasons.append("Mobile phone visible in frame")
    if not reasons:
        reasons.append("Driver appears attentive")

    return {
        "status": "success",
        "attention": int(attention),
        "drowsinessDetected": drowsiness,
        "distractionDetected": distraction,
        "phoneUsageDetected": phone_usage,
        "reasons": reasons,
        "isDemoMode": True,
    }


# ---------------------------------------------------------------------------
# REAL AI MODE (future work — not active by default):
#
# def analyze_driver_real(frame):
#     """
#     Intended integration point for real driver monitoring:
#       1. Run a face landmark model (e.g. mediapipe FaceMesh) on `frame`.
#       2. Compute Eye Aspect Ratio (EAR) to detect drowsiness.
#       3. Estimate head pose (yaw/pitch) to detect distraction.
#       4. Run a lightweight object detector for phone-in-hand detection.
#     Must return the same response shape as analyze_driver() above so
#     callers (main.py) don't need to change when real models are enabled.
#     """
#     raise NotImplementedError("Real AI driver monitoring requires trained models - see README Phase 2.")
# ---------------------------------------------------------------------------
