from typing import Dict, Any

class DriverMonitorService:
    """
    Facial Landmark & Eye Aspect Ratio (EAR) / Head Pose Evaluation Simulator
    Architecture is ready to plug in MediaPipe / OpenCV / Dlib models.
    """

    def analyze_driver(self, data: Dict[str, Any]) -> Dict[str, Any]:
        eyes_closed = bool(data.get("eyesClosed", False))
        head_yaw = float(data.get("headYaw", 0.0))
        phone_detected = bool(data.get("phoneDetected", False))
        yawning = bool(data.get("yawning", False))

        attention = 95.0
        drowsiness = 5.0
        distraction = 5.0

        if eyes_closed:
            attention -= 65.0
            drowsiness += 75.0

        if phone_detected:
            attention -= 50.0
            distraction += 80.0

        if abs(head_yaw) > 25.0:
            attention -= 35.0
            distraction += 45.0

        if yawning:
            drowsiness += 30.0
            attention -= 15.0

        attention = max(10.0, min(100.0, attention))
        drowsiness = max(0.0, min(100.0, drowsiness))
        distraction = max(0.0, min(100.0, distraction))

        status_label = "ATTENTIVE"
        if drowsiness > 60:
            status_label = "DROWSY - PULL OVER"
        elif distraction > 50:
            status_label = "DISTRACTED"
        elif attention < 60:
            status_label = "LOW ATTENTION"

        recommendation = "Nominal driver alertness"
        if status_label != "ATTENTIVE":
            recommendation = "Audio Alert: Focus visual attention on the road corridor."

        return {
            "status": "success",
            "driverAttention": round(attention, 1),
            "drowsinessIndex": round(drowsiness, 1),
            "distractionIndex": round(distraction, 1),
            "statusLabel": status_label,
            "headPoseYawDegrees": head_yaw,
            "recommendation": recommendation,
            "aiConfidence": 93,
        }

driver_monitor_instance = DriverMonitorService()
