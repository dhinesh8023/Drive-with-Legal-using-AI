"""
Shared configuration for the Drive Legal AI ai-service.

AI_MODE controls whether endpoints use:
  - "demo": rule-based / simulated analysis (always available, no trained models needed)
  - "real": real model inference (YOLO/OpenCV/etc.) - requires models to be present

The service is designed to run correctly in demo mode out of the box.
"""
import os

AI_MODE = os.getenv("AI_MODE", "demo")  # "demo" | "real"

RISK_LEVEL_THRESHOLDS = {
    "SAFE": (0, 30),
    "MODERATE": (31, 60),
    "HIGH": (61, 80),
    "CRITICAL": (81, 100),
}


def risk_level_from_score(score: float) -> str:
    if score <= 30:
        return "SAFE"
    if score <= 60:
        return "MODERATE"
    if score <= 80:
        return "HIGH"
    return "CRITICAL"


def is_demo_mode() -> bool:
    return AI_MODE != "real"
