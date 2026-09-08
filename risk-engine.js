/**
 * Client-side demo scenario definitions for the Live AI Drive page.
 * Each scenario sends a signal payload to the AI service's /predict-risk
 * endpoint (with a Node-side fallback — see backend/services/riskEngine.js)
 * and the AI service returns an explainable score. This file just defines
 * what each demo button simulates and drives the voice co-driver alerts.
 */

const SCENARIOS = {
  NORMAL: {
    label: "Normal Driving",
    icon: "bi-check-circle",
    signals: { speed: 55, speedLimit: 60, driverAttention: 95, weather: "CLEAR", roadCondition: "GOOD", trafficDensity: "LOW" },
    voice: { en: "All clear. Conditions are normal.", ta: "எல்லாம் சரி. நிலைமை இயல்பாக உள்ளது." },
  },
  OVERSPEEDING: {
    label: "Overspeeding",
    icon: "bi-speedometer",
    signals: { speed: 105, speedLimit: 80, driverAttention: 85, weather: "CLEAR", roadCondition: "GOOD", trafficDensity: "MODERATE" },
    voice: { en: "Warning. Reduce speed.", ta: "எச்சரிக்கை. வேகத்தைக் குறைக்கவும்." },
  },
  DROWSINESS: {
    label: "Drowsiness",
    icon: "bi-emoji-dizzy",
    signals: { speed: 70, speedLimit: 80, driverAttention: 30, drowsiness: true, weather: "CLEAR", roadCondition: "GOOD" },
    voice: { en: "Driver attention is low. Please take a break.", ta: "ஓட்டுநரின் கவனம் குறைவாக உள்ளது." },
  },
  DISTRACTION: {
    label: "Distraction",
    icon: "bi-eye-slash",
    signals: { speed: 65, speedLimit: 80, driverAttention: 40, distraction: true, weather: "CLEAR", roadCondition: "GOOD" },
    voice: { en: "Focus on the road.", ta: "சாலையில் கவனம் செலுத்துங்கள்." },
  },
  MOBILE_USAGE: {
    label: "Mobile Phone Usage",
    icon: "bi-phone",
    signals: { speed: 60, speedLimit: 80, driverAttention: 35, mobileUsage: true, weather: "CLEAR", roadCondition: "GOOD" },
    voice: { en: "Mobile phone usage detected. Please focus on driving.", ta: "மொபைல் பயன்பாடு கண்டறியப்பட்டது." },
  },
  POTHOLE: {
    label: "Pothole",
    icon: "bi-exclamation-diamond",
    signals: { speed: 60, speedLimit: 80, driverAttention: 90, roadCondition: "DAMAGED", weather: "CLEAR" },
    voice: { en: "Pothole detected ahead.", ta: "முன்னால் பள்ளம் உள்ளது." },
  },
  UNSAFE_OVERTAKING: {
    label: "Unsafe Overtaking",
    icon: "bi-arrow-left-right",
    signals: { speed: 85, speedLimit: 80, driverAttention: 80, followingDistanceMeters: 6, trafficDensity: "HIGH", weather: "CLEAR" },
    voice: { en: "Unsafe following distance.", ta: "பாதுகாப்பற்ற தொடர் தூரம்." },
  },
  WRONG_SIDE: {
    label: "Wrong Side Driving",
    icon: "bi-sign-turn-left",
    signals: { speed: 50, speedLimit: 60, driverAttention: 80, wrongSideDriving: true, weather: "CLEAR" },
    voice: { en: "Warning. You are on the wrong side of the road.", ta: "எச்சரிக்கை. தவறான பக்கத்தில் உள்ளீர்கள்." },
  },
  HEAVY_RAIN: {
    label: "Heavy Rain",
    icon: "bi-cloud-rain-heavy",
    signals: { speed: 70, speedLimit: 80, driverAttention: 85, weather: "HEAVY_RAIN", roadCondition: "WET", trafficDensity: "MODERATE" },
    voice: { en: "Heavy rain detected. Recommended speed reduced.", ta: "கடும் மழை கண்டறியப்பட்டது." },
  },
  LANE_DEPARTURE: {
    label: "Lane Departure",
    icon: "bi-sign-merge-left",
    signals: { speed: 75, speedLimit: 80, driverAttention: 60, laneDeparture: true, weather: "CLEAR" },
    voice: { en: "Lane departure detected. Please steer back.", ta: "பாதை விலகல் கண்டறியப்பட்டது." },
  },
  SUDDEN_BRAKING: {
    label: "Sudden Braking",
    icon: "bi-slash-circle",
    signals: { speed: 65, speedLimit: 80, driverAttention: 80, suddenBraking: true, trafficDensity: "HIGH", weather: "CLEAR" },
    voice: { en: "Sudden braking event recorded.", ta: "திடீர் பிரேக் நிகழ்வு பதிவு செய்யப்பட்டது." },
  },
  COLLISION_RISK: {
    label: "Collision Risk",
    icon: "bi-exclamation-octagon",
    signals: { speed: 90, speedLimit: 80, driverAttention: 50, followingDistanceMeters: 5, distraction: true, trafficDensity: "HIGH", weather: "CLEAR" },
    voice: { en: "Collision risk detected. Reduce speed immediately.", ta: "மோதல் அபாயம் கண்டறியப்பட்டுள்ளது. உடனடியாக வேகத்தைக் குறைக்கவும்." },
  },
  ACCIDENT: {
    label: "Accident",
    icon: "bi-车",
    signals: { speed: 40, speedLimit: 80, driverAttention: 20, suddenBraking: true, wrongSideDriving: false, weather: "CLEAR" },
    voice: { en: "Emergency event detected. Checking driver response.", ta: "அவசர நிகழ்வு கண்டறியப்பட்டது." },
  },
};

module.exports = typeof module !== "undefined" ? { SCENARIOS } : undefined;
