from typing import Dict, Any, List

class ViolationDetectorService:
    """
    Traffic Camera Video Stream / Telemetry Violation Candidate Extractor
    Architecture is prepared to ingest YOLOv8/v9 bounding boxes and OCR ANPR inferences.
    """

    def detect_violations(self, data: Dict[str, Any]) -> Dict[str, Any]:
        speed = float(data.get("speed", 50.0))
        speed_limit = float(data.get("speedLimit", 60.0))
        red_light = bool(data.get("redLightDetected", False))
        wrong_way = bool(data.get("wrongWayTrajectory", False))
        helmet = bool(data.get("helmetDetected", True))
        seatbelt = bool(data.get("seatbeltDetected", True))
        phone = bool(data.get("phoneDetected", False))

        candidates: List[Dict[str, Any]] = []

        if speed > speed_limit:
            candidates.append({
                "violationType": "Overspeeding",
                "confidence": 94,
                "detail": f"Measured velocity {speed:.1f} km/h vs zone limit {speed_limit:.1f} km/h",
                "severity": "HIGH" if speed > (speed_limit + 20) else "MEDIUM",
            })

        if red_light:
            candidates.append({
                "violationType": "Red-Light Violation",
                "confidence": 96,
                "detail": "Crossed junction stop marker during active red phase",
                "severity": "HIGH",
            })

        if wrong_way:
            candidates.append({
                "violationType": "Wrong-Side Driving",
                "confidence": 98,
                "detail": "Trajectory vector opposing corridor directional flow",
                "severity": "CRITICAL",
            })

        if not helmet:
            candidates.append({
                "violationType": "Helmet Violation",
                "confidence": 89,
                "detail": "Headgear bounding box absent on two-wheeler operator",
                "severity": "MEDIUM",
            })

        if not seatbelt:
            candidates.append({
                "violationType": "Seatbelt Violation",
                "confidence": 88,
                "detail": "Diagonal torso restraint unfastened",
                "severity": "MEDIUM",
            })

        if phone:
            candidates.append({
                "violationType": "Mobile Phone Usage",
                "confidence": 91,
                "detail": "Handheld cellular handset detected adjacent to operator ear/steering",
                "severity": "HIGH",
            })

        return {
            "status": "success",
            "candidateCount": len(candidates),
            "candidates": candidates,
            "requiresOfficerReview": len(candidates) > 0,
            "legalNotice": "All AI candidate detections require human officer review prior to enforcement.",
        }

violation_detector_instance = ViolationDetectorService()
