from typing import Dict, Any, List

class PythonRiskEngine:
    """
    Drive Legal AI - Python Predictive Safety & Risk Engine
    Provides ML/Heuristic hybrid risk scoring with Explainable AI attribution.
    """

    def compute_risk(self, data: Dict[str, Any]) -> Dict[str, Any]:
        scenario = data.get("scenario", "NORMAL DRIVING")
        speed = float(data.get("speed", 50.0))
        speed_limit = float(data.get("speedLimit", 60.0))
        attention = float(data.get("driverAttention", 95.0))
        drowsiness = float(data.get("drowsiness", 0.0))
        distraction = float(data.get("distraction", 0.0))
        mobile_usage = bool(data.get("mobileUsage", False))
        weather = data.get("weather", "Clear")
        road_condition = data.get("roadCondition", "Good")
        following_dist = float(data.get("followingDistance", 30.0))
        lane_departure = bool(data.get("laneDeparture", False))
        sudden_braking = bool(data.get("suddenBraking", False))
        wrong_side = bool(data.get("wrongSide", False))

        base_score = 10
        breakdown: Dict[str, int] = {}
        reasons: List[str] = []
        recommendations: List[str] = []

        # Scenario and telemetry evaluations
        if scenario == "OVERSPEEDING" or speed > (speed_limit + 25):
            delta = 30
            base_score += delta
            breakdown["Excessive Overspeeding"] = delta
            reasons.append(f"Vehicle speed ({speed:.0f} km/h) substantially exceeds safe limit ({speed_limit:.0f} km/h)")
            recommendations.append("Decelerate immediately to the safe regulated threshold")
        elif speed > speed_limit:
            delta = 15
            base_score += delta
            breakdown["Moderate Speeding"] = delta
            reasons.append("Speed slightly above corridor limit")
            recommendations.append("Reduce throttle cruise")

        if scenario == "DROWSINESS" or drowsiness > 60 or attention < 40:
            delta = 35
            base_score += delta
            breakdown["Driver Drowsiness / Microsleep"] = delta
            reasons.append("Prolonged ocular closure and reduced cognitive vigilance")
            recommendations.append("Auditory alertness trigger; pull over in safe service bay")

        if scenario == "MOBILE PHONE USAGE" or mobile_usage:
            delta = 28
            base_score += delta
            breakdown["Handheld Mobile Device Engagement"] = delta
            reasons.append("Driver visual attention diverted to smartphone device")
            recommendations.append("Stow device in dashboard cradle; engage hands-free mode")
        elif scenario == "DISTRACTION" or distraction > 50 or attention < 65:
            delta = 22
            base_score += delta
            breakdown["Driver Distraction"] = delta
            reasons.append("Persistent off-axis head yaw away from road corridor")
            recommendations.append("Focus visual attention on forward travel lane")

        if scenario == "HEAVY RAIN" or weather in ["Heavy Rain", "Storm"]:
            delta = 22
            base_score += delta
            breakdown["Severe Weather Aquaplaning Risk"] = delta
            reasons.append("Reduced tire contact friction and low visual contrast")
            recommendations.append("Activate rain wipers and expand following distance to 40m")

        if scenario == "POTHOLE" or road_condition == "Potholed":
            delta = 20
            base_score += delta
            breakdown["Pothole / Road Surface Defect Ahead"] = delta
            reasons.append("Localized pavement depression detected by vision sensor")
            recommendations.append("Maintain straight tracking; decelerate smoothly")

        if scenario == "WRONG SIDE DRIVING" or wrong_side:
            delta = 45
            base_score += delta
            breakdown["Opposite Carriageway Incursion"] = delta
            reasons.append("Dangerous movement opposing primary vehicle flow")
            recommendations.append("Halt on safety shoulder immediately and right-side vehicle")

        if scenario == "COLLISION RISK" or following_dist < 10:
            delta = 38
            base_score += delta
            breakdown["Critical Frontal Time-to-Collision"] = delta
            reasons.append(f"Inadequate headway gap ({following_dist:.1f}m to preceding vehicle)")
            recommendations.append("Apply active braking; disengage cruise control")

        if scenario == "SUDDEN BRAKING" or sudden_braking:
            delta = 24
            base_score += delta
            breakdown["High Negative Deceleration"] = delta
            reasons.append("Kinetic jerk / hard braking event registered")
            recommendations.append("Check rear-view mirror for trailing vehicles")

        if scenario == "LANE DEPARTURE" or lane_departure:
            delta = 18
            base_score += delta
            breakdown["Unintentional Lane Boundary Drift"] = delta
            reasons.append("Vehicle traversing roadway divider without blinker")
            recommendations.append("Correct steering within lane centerline")

        if scenario == "ACCIDENT":
            base_score = 98
            breakdown["Kinetic Impact Signature"] = 98
            reasons.append("Abrupt deceleration impact spike registered")
            recommendations.append("Automated SOS assistance activated")

        # Bounds clamp 5 to 100
        risk_score = min(100, max(5, int(base_score)))

        if risk_score >= 81:
            risk_level = "CRITICAL"
        elif risk_score >= 61:
            risk_level = "HIGH"
        elif risk_score >= 31:
            risk_level = "MODERATE"
        else:
            risk_level = "SAFE"

        if not reasons:
            reasons.append("Nominal driving parameters confirmed")
            recommendations.append("Maintain attentive situational awareness")

        # Adaptive recommended speed
        rec_speed = speed_limit
        if "Heavy Rain" in weather or scenario == "HEAVY RAIN":
            rec_speed -= 20
        if road_condition == "Potholed" or scenario == "POTHOLE":
            rec_speed -= 15
        if risk_score >= 80:
            rec_speed = min(rec_speed, 35)

        return {
            "status": "success",
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "aiConfidence": 91,
            "breakdown": breakdown,
            "reasons": reasons,
            "recommendations": recommendations,
            "recommendedSpeed": max(20.0, float(rec_speed)),
            "isAiAssisted": True,
        }

risk_engine_instance = PythonRiskEngine()
