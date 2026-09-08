const { RISK_LEVELS } = require("../config/constants");

/**
 * Configurable, explainable risk engine.
 *
 * This mirrors ai-service/services/risk_engine.py so the Node backend
 * can compute/display a fast, explainable score without a network round
 * trip when it only needs a rule-based estimate (e.g. for seed data,
 * fallback when the AI service is unreachable, or lightweight checks).
 * The FastAPI service is the source of truth for anything camera/ML based.
 *
 * Every contribution to the score is named, so the UI can always show
 * "why is the risk high" instead of a bare number.
 */

const WEIGHTS = {
  overspeedingPerKmhOver: 1.2, // points per km/h over the speed limit
  overspeedingCap: 30,
  lowAttention: 25, // driver attention < 50%
  drowsiness: 30,
  distraction: 20,
  mobileUsage: 25,
  heavyRain: 20,
  fog: 20,
  poorRoadCondition: 15,
  highTrafficDensity: 10,
  lowFollowingDistance: 15,
  laneDeparture: 15,
  wrongSideDriving: 35,
  suddenBraking: 10,
  nightLowVisibility: 10,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function riskLevelFromScore(score) {
  if (score <= 30) return RISK_LEVELS.SAFE;
  if (score <= 60) return RISK_LEVELS.MODERATE;
  if (score <= 80) return RISK_LEVELS.HIGH;
  return RISK_LEVELS.CRITICAL;
}

/**
 * @param {object} input
 * @param {number} input.speed
 * @param {number} input.speedLimit
 * @param {number} [input.driverAttention] 0-100
 * @param {boolean} [input.drowsiness]
 * @param {boolean} [input.distraction]
 * @param {boolean} [input.mobileUsage]
 * @param {string} [input.weather] "CLEAR" | "RAIN" | "HEAVY_RAIN" | "FOG"
 * @param {string} [input.roadCondition] "GOOD" | "DAMAGED" | "WET" | "UNDER_CONSTRUCTION"
 * @param {string} [input.trafficDensity] "LOW" | "MODERATE" | "HIGH"
 * @param {number} [input.followingDistanceMeters]
 * @param {boolean} [input.laneDeparture]
 * @param {boolean} [input.wrongSideDriving]
 * @param {boolean} [input.suddenBraking]
 * @param {string} [input.timeOfDay] "DAY" | "NIGHT"
 * @param {number} [input.visibilityMeters]
 * @returns {{riskScore:number, riskLevel:string, confidence:number, reasons:string[], breakdown:object, recommendation:string, recommendedSpeed:number}}
 */
function calculateRisk(input) {
  const breakdown = {};
  const reasons = [];
  let score = 0;

  // Overspeeding
  const over = Math.max(0, (input.speed || 0) - (input.speedLimit || 0));
  if (over > 0) {
    const pts = clamp(over * WEIGHTS.overspeedingPerKmhOver, 0, WEIGHTS.overspeedingCap);
    score += pts;
    breakdown.overspeeding = Math.round(pts);
    reasons.push(`Overspeeding by ${over} km/h`);
  }

  if (typeof input.driverAttention === "number" && input.driverAttention < 50) {
    score += WEIGHTS.lowAttention;
    breakdown.lowAttention = WEIGHTS.lowAttention;
    reasons.push("Low driver attention");
  }

  if (input.drowsiness) {
    score += WEIGHTS.drowsiness;
    breakdown.drowsiness = WEIGHTS.drowsiness;
    reasons.push("Driver drowsiness detected");
  }

  if (input.distraction) {
    score += WEIGHTS.distraction;
    breakdown.distraction = WEIGHTS.distraction;
    reasons.push("Driver distraction");
  }

  if (input.mobileUsage) {
    score += WEIGHTS.mobileUsage;
    breakdown.mobileUsage = WEIGHTS.mobileUsage;
    reasons.push("Mobile phone usage while driving");
  }

  if (input.weather === "HEAVY_RAIN" || input.weather === "RAIN") {
    score += WEIGHTS.heavyRain;
    breakdown.weather = WEIGHTS.heavyRain;
    reasons.push("Heavy rain");
  } else if (input.weather === "FOG") {
    score += WEIGHTS.fog;
    breakdown.weather = WEIGHTS.fog;
    reasons.push("Fog / low visibility weather");
  }

  if (input.roadCondition === "DAMAGED" || input.roadCondition === "UNDER_CONSTRUCTION") {
    score += WEIGHTS.poorRoadCondition;
    breakdown.roadCondition = WEIGHTS.poorRoadCondition;
    reasons.push("Poor road condition");
  }

  if (input.trafficDensity === "HIGH") {
    score += WEIGHTS.highTrafficDensity;
    breakdown.traffic = WEIGHTS.highTrafficDensity;
    reasons.push("High traffic density");
  }

  if (typeof input.followingDistanceMeters === "number" && input.followingDistanceMeters < 15) {
    score += WEIGHTS.lowFollowingDistance;
    breakdown.followingDistance = WEIGHTS.lowFollowingDistance;
    reasons.push("Low following distance");
  }

  if (input.laneDeparture) {
    score += WEIGHTS.laneDeparture;
    breakdown.laneDeparture = WEIGHTS.laneDeparture;
    reasons.push("Lane departure detected");
  }

  if (input.wrongSideDriving) {
    score += WEIGHTS.wrongSideDriving;
    breakdown.wrongSideDriving = WEIGHTS.wrongSideDriving;
    reasons.push("Wrong-side driving detected");
  }

  if (input.suddenBraking) {
    score += WEIGHTS.suddenBraking;
    breakdown.suddenBraking = WEIGHTS.suddenBraking;
    reasons.push("Sudden braking event");
  }

  if (input.timeOfDay === "NIGHT" && typeof input.visibilityMeters === "number" && input.visibilityMeters < 100) {
    score += WEIGHTS.nightLowVisibility;
    breakdown.lowVisibility = WEIGHTS.nightLowVisibility;
    reasons.push("Low visibility at night");
  }

  const riskScore = Math.round(clamp(score, 0, 100));
  const riskLevel = riskLevelFromScore(riskScore);

  const recommendation = buildRecommendation(riskLevel, reasons);
  const recommendedSpeed = buildRecommendedSpeed(input, riskLevel);

  // Confidence is a demo heuristic: more contributing signals -> higher confidence
  // that the score reflects real conditions rather than a single noisy input.
  const confidence = clamp(0.6 + Object.keys(breakdown).length * 0.05, 0.6, 0.97);

  if (reasons.length === 0) {
    reasons.push("No significant risk factors detected");
  }

  return {
    riskScore,
    riskLevel,
    confidence: Number(confidence.toFixed(2)),
    reasons,
    breakdown,
    recommendation,
    recommendedSpeed,
  };
}

function buildRecommendation(riskLevel, reasons) {
  if (riskLevel === RISK_LEVELS.CRITICAL) {
    return "Reduce speed immediately, maintain a safe following distance, and focus fully on the road.";
  }
  if (riskLevel === RISK_LEVELS.HIGH) {
    return "Slow down and stay alert. Conditions indicate elevated risk: " + reasons.join(", ") + ".";
  }
  if (riskLevel === RISK_LEVELS.MODERATE) {
    return "Drive cautiously and monitor changing conditions.";
  }
  return "Conditions are favorable. Continue safe driving practices.";
}

function buildRecommendedSpeed(input, riskLevel) {
  const limit = input.speedLimit || 60;
  if (riskLevel === RISK_LEVELS.CRITICAL) return Math.round(limit * 0.6);
  if (riskLevel === RISK_LEVELS.HIGH) return Math.round(limit * 0.75);
  if (riskLevel === RISK_LEVELS.MODERATE) return Math.round(limit * 0.9);
  return limit;
}

module.exports = { calculateRisk, riskLevelFromScore };
