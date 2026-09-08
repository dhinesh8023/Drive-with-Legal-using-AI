"""
Collision risk service. DEMO MODE derives a collision risk score from
following distance and relative speed, or from a named scenario.
REAL AI MODE would fuse object-detection bounding boxes + tracked velocity
to estimate time-to-collision (TTC) directly from camera/radar frames.
"""
from services.demo_scenarios import get_scenario_signals
from utils.config import risk_level_from_score


def analyze_collision_risk(req) -> dict:
    if req.scenario:
        signals = get_scenario_signals(req.scenario)
        following_distance = signals.get("followingDistanceMeters", 20)
        relative_speed = signals.get("speed", 50) - 40
    else:
        following_distance = req.followingDistanceMeters if req.followingDistanceMeters is not None else 20
        relative_speed = req.relativeSpeedKmh if req.relativeSpeedKmh is not None else 0

    score = 0
    reasons = []

    if following_distance < 5:
        score += 40
        reasons.append("Critically low following distance")
    elif following_distance < 10:
        score += 25
        reasons.append("Low following distance")
    elif following_distance < 15:
        score += 10
        reasons.append("Reduced following distance")

    if relative_speed > 20:
        score += 35
        reasons.append("High closing speed relative to vehicle ahead")
    elif relative_speed > 10:
        score += 20
        reasons.append("Moderate closing speed relative to vehicle ahead")

    score = max(0, min(100, score))
    if not reasons:
        reasons.append("No significant collision risk factors detected")

    return {
        "status": "success",
        "collisionRiskScore": score,
        "riskLevel": risk_level_from_score(score),
        "reasons": reasons,
        "isDemoMode": True,
    }
