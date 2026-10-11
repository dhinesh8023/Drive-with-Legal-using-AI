from fastapi import APIRouter
from typing import Dict, Any

from services.risk_engine import risk_engine_instance
from services.driver_monitor import driver_monitor_instance
from services.violation_detector import violation_detector_instance
from services.collision_risk import collision_risk_instance
from services.road_analyzer import road_analyzer_instance

api_router = APIRouter()

@api_router.post("/analyze")
async def analyze_endpoint(payload: Dict[str, Any]):
    return risk_engine_instance.compute_risk(payload)

@api_router.post("/predict-risk")
async def predict_risk_endpoint(payload: Dict[str, Any]):
    return risk_engine_instance.compute_risk(payload)

@api_router.post("/driver-monitor")
async def driver_monitor_endpoint(payload: Dict[str, Any]):
    return driver_monitor_instance.analyze_driver(payload)

@api_router.post("/road-detection")
async def road_detection_endpoint(payload: Dict[str, Any]):
    return road_analyzer_instance.analyze_road(payload)

@api_router.post("/collision-risk")
async def collision_risk_endpoint(payload: Dict[str, Any]):
    return collision_risk_instance.calculate_collision_risk(payload)

@api_router.post("/violation-detection")
async def violation_detection_endpoint(payload: Dict[str, Any]):
    return violation_detector_instance.detect_violations(payload)
