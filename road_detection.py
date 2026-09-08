"""
Road detection service. DEMO MODE flags pothole/lane-departure/obstacle
signals from the named scenario. REAL AI MODE would run a YOLO model
fine-tuned on road-surface defects plus a lane-detection model (e.g.
classical Hough-transform or a segmentation network) over camera frames.
"""
from services.demo_scenarios import get_scenario_signals


def detect_road_conditions(req) -> dict:
    scenario = (req.scenario or "NORMAL_DRIVING").upper()
    signals = get_scenario_signals(scenario)

    pothole = scenario == "POTHOLE" or signals.get("roadCondition") == "DAMAGED"
    lane_departure = scenario == "LANE_DEPARTURE" or bool(signals.get("laneDeparture"))
    obstacle = scenario in ("ACCIDENT", "UNSAFE_OVERTAKING")

    return {
        "status": "success",
        "potholeDetected": pothole,
        "laneDepartureDetected": lane_departure,
        "obstacleDetected": obstacle,
        "confidence": 0.9 if (pothole or lane_departure or obstacle) else 0.5,
        "isDemoMode": True,
    }
