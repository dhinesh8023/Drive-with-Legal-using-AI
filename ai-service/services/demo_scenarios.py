"""
DEMO AI MODE scenario simulator.

Maps the scenario buttons on live-drive.html (NORMAL_DRIVING, OVERSPEEDING,
DROWSINESS, DISTRACTION, MOBILE_PHONE_USAGE, POTHOLE, UNSAFE_OVERTAKING,
WRONG_SIDE_DRIVING, HEAVY_RAIN, LANE_DEPARTURE, SUDDEN_BRAKING,
COLLISION_RISK, ACCIDENT) to a consistent, explainable set of simulated
sensor/AI signals, without needing any trained model.

REAL AI MODE (services/real_ai.py) would replace this simulator's outputs
with genuine model inference (YOLO for objects/hazards, face-landmark
models for drowsiness, etc.) while keeping the same response contract.
"""

SCENARIOS = {
    "NORMAL_DRIVING": {
        "speed": 55, "speedLimit": 60, "driverAttention": 95, "weather": "CLEAR", "roadCondition": "GOOD",
    },
    "OVERSPEEDING": {
        "speed": 100, "speedLimit": 60, "driverAttention": 85, "weather": "CLEAR", "roadCondition": "GOOD",
    },
    "DROWSINESS": {
        "speed": 60, "speedLimit": 60, "driverAttention": 35, "drowsiness": True, "weather": "CLEAR", "roadCondition": "GOOD",
    },
    "DISTRACTION": {
        "speed": 55, "speedLimit": 60, "driverAttention": 40, "distraction": True, "weather": "CLEAR", "roadCondition": "GOOD",
    },
    "MOBILE_PHONE_USAGE": {
        "speed": 50, "speedLimit": 60, "driverAttention": 30, "mobileUsage": True, "distraction": True, "weather": "CLEAR", "roadCondition": "GOOD",
    },
    "POTHOLE": {
        "speed": 50, "speedLimit": 60, "driverAttention": 90, "roadCondition": "DAMAGED", "weather": "CLEAR",
    },
    "UNSAFE_OVERTAKING": {
        "speed": 80, "speedLimit": 60, "driverAttention": 80, "followingDistanceMeters": 8, "weather": "CLEAR", "roadCondition": "GOOD",
    },
    "WRONG_SIDE_DRIVING": {
        "speed": 55, "speedLimit": 60, "driverAttention": 80, "wrongSideDriving": True, "weather": "CLEAR", "roadCondition": "GOOD",
    },
    "HEAVY_RAIN": {
        "speed": 65, "speedLimit": 60, "driverAttention": 85, "weather": "HEAVY_RAIN", "roadCondition": "WET",
    },
    "LANE_DEPARTURE": {
        "speed": 70, "speedLimit": 60, "driverAttention": 60, "laneDeparture": True, "weather": "CLEAR", "roadCondition": "GOOD",
    },
    "SUDDEN_BRAKING": {
        "speed": 60, "speedLimit": 60, "driverAttention": 85, "suddenBraking": True, "followingDistanceMeters": 10, "weather": "CLEAR", "roadCondition": "GOOD",
    },
    "COLLISION_RISK": {
        "speed": 90, "speedLimit": 60, "driverAttention": 55, "followingDistanceMeters": 6, "weather": "RAIN", "roadCondition": "WET",
    },
    "ACCIDENT": {
        "speed": 95, "speedLimit": 60, "driverAttention": 20, "distraction": True, "wrongSideDriving": True,
        "followingDistanceMeters": 4, "weather": "HEAVY_RAIN", "roadCondition": "DAMAGED", "suddenBraking": True,
    },
}


def get_scenario_signals(scenario_name: str) -> dict:
    """Returns the simulated signal set for a scenario name, defaulting to NORMAL_DRIVING."""
    return dict(SCENARIOS.get((scenario_name or "NORMAL_DRIVING").upper(), SCENARIOS["NORMAL_DRIVING"]))
