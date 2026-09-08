"""
Explainable, configurable risk engine.

Mirrors backend/services/riskEngine.js so both Node and Python sides agree
on how a risk score is derived. This is the DEMO / rule-based engine that
always works without any trained model. Real AI mode (see services/real_ai.py
stub) would eventually feed its outputs into the same explainable structure.
"""
from utils.config import risk_level_from_score

WEIGHTS = {
    "overspeeding_per_kmh_over": 1.2,
    "overspeeding_cap": 30,
    "low_attention": 25,
    "drowsiness": 30,
    "distraction": 20,
    "mobile_usage": 25,
    "heavy_rain": 20,
    "fog": 20,
    "poor_road_condition": 15,
    "high_traffic_density": 10,
    "low_following_distance": 15,
    "lane_departure": 15,
    "wrong_side_driving": 35,
    "sudden_braking": 10,
    "night_low_visibility": 10,
}


def clamp(value, lo, hi):
    return max(lo, min(hi, value))


def calculate_risk(req) -> dict:
    breakdown = {}
    reasons = []
    score = 0.0

    over = max(0, (req.speed or 0) - (req.speedLimit or 0))
    if over > 0:
        pts = clamp(over * WEIGHTS["overspeeding_per_kmh_over"], 0, WEIGHTS["overspeeding_cap"])
        score += pts
        breakdown["overspeeding"] = round(pts)
        reasons.append(f"Overspeeding by {over:.0f} km/h")

    if req.driverAttention is not None and req.driverAttention < 50:
        score += WEIGHTS["low_attention"]
        breakdown["lowAttention"] = WEIGHTS["low_attention"]
        reasons.append("Low driver attention")

    if req.drowsiness:
        score += WEIGHTS["drowsiness"]
        breakdown["drowsiness"] = WEIGHTS["drowsiness"]
        reasons.append("Driver drowsiness detected")

    if req.distraction:
        score += WEIGHTS["distraction"]
        breakdown["distraction"] = WEIGHTS["distraction"]
        reasons.append("Driver distraction")

    if req.mobileUsage:
        score += WEIGHTS["mobile_usage"]
        breakdown["mobileUsage"] = WEIGHTS["mobile_usage"]
        reasons.append("Mobile phone usage while driving")

    if req.weather in ("HEAVY_RAIN", "RAIN"):
        score += WEIGHTS["heavy_rain"]
        breakdown["weather"] = WEIGHTS["heavy_rain"]
        reasons.append("Heavy rain")
    elif req.weather == "FOG":
        score += WEIGHTS["fog"]
        breakdown["weather"] = WEIGHTS["fog"]
        reasons.append("Fog / low visibility weather")

    if req.roadCondition in ("DAMAGED", "UNDER_CONSTRUCTION"):
        score += WEIGHTS["poor_road_condition"]
        breakdown["roadCondition"] = WEIGHTS["poor_road_condition"]
        reasons.append("Poor road condition")

    if req.trafficDensity == "HIGH":
        score += WEIGHTS["high_traffic_density"]
        breakdown["traffic"] = WEIGHTS["high_traffic_density"]
        reasons.append("High traffic density")

    if req.followingDistanceMeters is not None and req.followingDistanceMeters < 15:
        score += WEIGHTS["low_following_distance"]
        breakdown["followingDistance"] = WEIGHTS["low_following_distance"]
        reasons.append("Low following distance")

    if req.laneDeparture:
        score += WEIGHTS["lane_departure"]
        breakdown["laneDeparture"] = WEIGHTS["lane_departure"]
        reasons.append("Lane departure detected")

    if req.wrongSideDriving:
        score += WEIGHTS["wrong_side_driving"]
        breakdown["wrongSideDriving"] = WEIGHTS["wrong_side_driving"]
        reasons.append("Wrong-side driving detected")

    if req.suddenBraking:
        score += WEIGHTS["sudden_braking"]
        breakdown["suddenBraking"] = WEIGHTS["sudden_braking"]
        reasons.append("Sudden braking event")

    if req.timeOfDay == "NIGHT" and req.visibilityMeters is not None and req.visibilityMeters < 100:
        score += WEIGHTS["night_low_visibility"]
        breakdown["lowVisibility"] = WEIGHTS["night_low_visibility"]
        reasons.append("Low visibility at night")

    risk_score = round(clamp(score, 0, 100))
    risk_level = risk_level_from_score(risk_score)

    if not reasons:
        reasons.append("No significant risk factors detected")

    confidence = round(clamp(0.6 + len(breakdown) * 0.05, 0.6, 0.97), 2)

    recommendations = build_recommendations(risk_level, reasons)
    recommended_speed = build_recommended_speed(req, risk_level)

    return {
        "status": "success",
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "confidence": confidence,
        "reasons": reasons,
        "breakdown": breakdown,
        "recommendations": recommendations,
        "recommendedSpeed": recommended_speed,
        "isDemoMode": True,
    }


def build_recommendations(risk_level, reasons):
    if risk_level == "CRITICAL":
        return [
            "Reduce speed immediately",
            "Maintain a safe following distance",
            "Focus fully on the road",
        ]
    if risk_level == "HIGH":
        return ["Slow down and stay alert", "Conditions indicate elevated risk: " + ", ".join(reasons)]
    if risk_level == "MODERATE":
        return ["Drive cautiously", "Monitor changing conditions"]
    return ["Conditions are favorable", "Continue safe driving practices"]


def build_recommended_speed(req, risk_level):
    limit = req.speedLimit or 60
    if risk_level == "CRITICAL":
        return round(limit * 0.6)
    if risk_level == "HIGH":
        return round(limit * 0.75)
    if risk_level == "MODERATE":
        return round(limit * 0.9)
    return round(limit)
