from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TelemetryPayload(BaseModel):
    speed: Optional[float] = 45.0
    speedLimit: Optional[float] = 60.0
    driverAttention: Optional[float] = 95.0
    drowsiness: Optional[float] = 0.0
    distraction: Optional[float] = 0.0
    mobileUsage: Optional[bool] = False
    weather: Optional[str] = "Clear"
    roadCondition: Optional[str] = "Good"
    trafficDensity: Optional[str] = "Moderate"
    followingDistance: Optional[float] = 30.0
    laneDeparture: Optional[bool] = False
    suddenBraking: Optional[bool] = False
    wrongSide: Optional[bool] = False
    scenario: Optional[str] = "NORMAL DRIVING"

class DriverMonitorPayload(BaseModel):
    eyesClosed: Optional[bool] = False
    blinkRatePerMin: Optional[float] = 16.0
    headYaw: Optional[float] = 0.0
    headPitch: Optional[float] = 0.0
    phoneDetected: Optional[bool] = False
    yawning: Optional[bool] = False

class RoadDetectionPayload(BaseModel):
    weather: Optional[str] = "Clear"
    potholes: Optional[bool] = False
    debrisDetected: Optional[bool] = False
    laneMarkingsClarity: Optional[float] = 90.0

class CollisionRiskPayload(BaseModel):
    speed: Optional[float] = 60.0
    followingDistance: Optional[float] = 25.0
    relativeClosingSpeed: Optional[float] = 15.0

class ViolationDetectionPayload(BaseModel):
    speed: Optional[float] = 50.0
    speedLimit: Optional[float] = 60.0
    redLightDetected: Optional[bool] = False
    wrongWayTrajectory: Optional[bool] = False
    helmetDetected: Optional[bool] = True
    seatbeltDetected: Optional[bool] = True
    phoneDetected: Optional[bool] = False

class RiskResponse(BaseModel):
    status: str
    riskScore: int
    riskLevel: str
    aiConfidence: int
    breakdown: Dict[str, int]
    reasons: List[str]
    recommendations: List[str]
    isAiAssisted: bool = True
