"""
Drive Legal AI - AI Service (FastAPI)

Runs in DEMO AI MODE by default: every endpoint returns explainable,
rule-based/simulated results and works with zero trained models.
Set AI_MODE=real in the environment once real models are wired in
(see services/*.py "REAL AI MODE" notes for each module's integration point).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import (
    RiskPredictionRequest, RiskPredictionResponse,
    DriverMonitorRequest, DriverMonitorResponse,
    ViolationDetectionRequest, ViolationDetectionResponse,
    CollisionRiskRequest, CollisionRiskResponse,
    RoadDetectionRequest, RoadDetectionResponse,
)
from services.risk_engine import calculate_risk
from services.demo_scenarios import get_scenario_signals
from services.driver_monitor import analyze_driver
from services.violation_detection import detect_violation
from services.collision_risk import analyze_collision_risk
from services.road_detection import detect_road_conditions
from utils.config import is_demo_mode, AI_MODE

app = FastAPI(
    title="Drive Legal AI - AI Service",
    description="Predictive road safety AI service (SIH 2026 prototype). Runs in DEMO mode by default.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to CLIENT_URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "success", "service": "ai-service", "aiMode": AI_MODE, "isDemoMode": is_demo_mode()}


@app.post("/predict-risk", response_model=RiskPredictionResponse)
def predict_risk(req: RiskPredictionRequest):
    """
    Explainable AI risk prediction. If `scenario` is provided (from the
    live-drive.html demo buttons), the scenario's simulated signals are
    merged in before scoring so the frontend demo stays consistent.
    """
    if req.scenario:
        signals = get_scenario_signals(req.scenario)
        merged = req.dict()
        for key, value in signals.items():
            merged[key] = value
        req = RiskPredictionRequest(**merged)

    result = calculate_risk(req)
    return result


@app.post("/driver-monitor", response_model=DriverMonitorResponse)
def driver_monitor(req: DriverMonitorRequest):
    return analyze_driver(req)


@app.post("/violation-detection", response_model=ViolationDetectionResponse)
def violation_detection(req: ViolationDetectionRequest):
    return detect_violation(req)


@app.post("/collision-risk", response_model=CollisionRiskResponse)
def collision_risk(req: CollisionRiskRequest):
    return analyze_collision_risk(req)


@app.post("/road-detection", response_model=RoadDetectionResponse)
def road_detection(req: RoadDetectionRequest):
    return detect_road_conditions(req)


@app.post("/analyze")
def analyze(req: RiskPredictionRequest):
    """
    Convenience endpoint combining risk + driver monitor + road detection
    for a single scenario, matching what live-drive.html needs in one call.
    """
    risk = calculate_risk(req if not req.scenario else RiskPredictionRequest(**{**req.dict(), **get_scenario_signals(req.scenario)}))
    driver = analyze_driver(DriverMonitorRequest(scenario=req.scenario))
    road = detect_road_conditions(RoadDetectionRequest(scenario=req.scenario))

    return {
        "status": "success",
        "risk": risk,
        "driver": driver,
        "road": road,
        "isDemoMode": is_demo_mode(),
    }
