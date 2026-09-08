"""
Pydantic request/response schemas shared across ai-service endpoints.
Keeping schemas centralized keeps main.py thin and makes the explainable-AI
contract (score + reasons + confidence + recommendation) consistent everywhere.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class RiskPredictionRequest(BaseModel):
    speed: float = 0
    speedLimit: float = 60
    driverAttention: Optional[float] = None  # 0-100
    drowsiness: Optional[bool] = False
    distraction: Optional[bool] = False
    mobileUsage: Optional[bool] = False
    weather: Optional[str] = "CLEAR"  # CLEAR | RAIN | HEAVY_RAIN | FOG
    roadCondition: Optional[str] = "GOOD"  # GOOD | DAMAGED | WET | UNDER_CONSTRUCTION
    trafficDensity: Optional[str] = "LOW"  # LOW | MODERATE | HIGH
    followingDistanceMeters: Optional[float] = None
    laneDeparture: Optional[bool] = False
    wrongSideDriving: Optional[bool] = False
    suddenBraking: Optional[bool] = False
    timeOfDay: Optional[str] = "DAY"  # DAY | NIGHT
    visibilityMeters: Optional[float] = None
    scenario: Optional[str] = None  # demo scenario button name, if applicable


class RiskPredictionResponse(BaseModel):
    status: str = "success"
    riskScore: int
    riskLevel: str
    confidence: float
    reasons: List[str]
    breakdown: dict
    recommendations: List[str]
    recommendedSpeed: int
    isDemoMode: bool


class DriverMonitorRequest(BaseModel):
    scenario: Optional[str] = "NORMAL_DRIVING"
    eyesClosedDurationSeconds: Optional[float] = 0
    headTurnedAwaySeconds: Optional[float] = 0
    phoneVisible: Optional[bool] = False


class DriverMonitorResponse(BaseModel):
    status: str = "success"
    attention: int
    drowsinessDetected: bool
    distractionDetected: bool
    phoneUsageDetected: bool
    reasons: List[str]
    isDemoMode: bool


class ViolationDetectionRequest(BaseModel):
    scenario: str
    speed: Optional[float] = None
    speedLimit: Optional[float] = None


class ViolationDetectionResponse(BaseModel):
    status: str = "success"
    violationDetected: bool
    violationType: Optional[str] = None
    confidence: float
    reasons: List[str]
    isDemoMode: bool


class CollisionRiskRequest(BaseModel):
    followingDistanceMeters: Optional[float] = None
    relativeSpeedKmh: Optional[float] = None
    scenario: Optional[str] = None


class CollisionRiskResponse(BaseModel):
    status: str = "success"
    collisionRiskScore: int
    riskLevel: str
    reasons: List[str]
    isDemoMode: bool


class RoadDetectionRequest(BaseModel):
    scenario: Optional[str] = "NORMAL_DRIVING"


class RoadDetectionResponse(BaseModel):
    status: str = "success"
    potholeDetected: bool
    laneDepartureDetected: bool
    obstacleDetected: bool
    confidence: float
    isDemoMode: bool
