from typing import Dict, Any, List

class RoadAnalyzerService:
    """
    Surface Defect, Pothole, and Lane Marking Quality Analyzer
    """

    def analyze_road(self, data: Dict[str, Any]) -> Dict[str, Any]:
        weather = data.get("weather", "Clear")
        potholes = bool(data.get("potholes", False))
        debris = bool(data.get("debrisDetected", False))
        clarity = float(data.get("laneMarkingsClarity", 90.0))

        hazards: List[str] = []
        quality_score = 90

        if potholes:
            hazards.append("Pothole / Road Surface Crater")
            quality_score -= 30

        if debris:
            hazards.append("Road Debris / Foreign Object")
            quality_score -= 20

        if weather == "Heavy Rain":
            hazards.append("Aquaplaning / Standing Surface Water")
            quality_score -= 25
        elif weather == "Fog":
            hazards.append("Low Ambient Contrast / Optical Fog")
            quality_score -= 15

        if clarity < 50.0:
            hazards.append("Faded / Illegible Lane Divider Markings")
            quality_score -= 15

        quality_score = max(10, min(100, quality_score))

        rec_speed = 60
        if quality_score < 50:
            rec_speed = 35
        elif quality_score < 75:
            rec_speed = 50

        return {
            "status": "success",
            "roadQualityScore": quality_score,
            "detectedHazards": hazards,
            "laneMarkingClarityPercent": clarity,
            "recommendedSafeSpeedKmH": rec_speed,
            "aiConfidence": 89,
        }

road_analyzer_instance = RoadAnalyzerService()
