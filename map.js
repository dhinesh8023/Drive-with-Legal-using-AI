let map = null;
let markerLayer = null;

function initMap() {
  map = L.map("mapContainer", { attributionControl: true }).setView([11.1085, 77.3411], 12); // Tiruppur, TN default center
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
}

function riskColor(level) {
  return { LOW: "#22c55e", SAFE: "#22c55e", MODERATE: "#eab308", HIGH: "#f97316", CRITICAL: "#ef4444" }[level] || "#94a3b8";
}

function addHazardMarkers(hazards) {
  hazards.forEach((h) => {
    const color = h.severity === "CRITICAL" || h.severity === "HIGH" ? "#ef4444" : h.severity === "MODERATE" ? "#eab308" : "#22c55e";
    L.circleMarker([h.location.latitude, h.location.longitude], {
      radius: 7,
      color,
      fillColor: color,
      fillOpacity: 0.8,
    })
      .bindPopup(`<strong>${h.hazardType.replace(/_/g, " ")}</strong><br>Severity: ${h.severity}<br>Confidence: ${Math.round((h.confidenceScore || 0) * 100)}%`)
      .addTo(markerLayer);
  });
}

function addBlackspotMarkers(blackspots) {
  blackspots.forEach((b) => {
    L.circle([b.location.latitude, b.location.longitude], {
      radius: 400,
      color: riskColor(b.riskLevel),
      fillColor: riskColor(b.riskLevel),
      fillOpacity: 0.15,
    })
      .bindPopup(`<strong>AI-Predicted Blackspot</strong><br>Risk: ${b.riskPercentage}% (${b.riskLevel})<br>${b.location.roadName || ""}<br><em>This is an AI-assisted risk estimate, not an official designation.</em>`)
      .addTo(markerLayer);
  });
}

async function loadMapData() {
  try {
    const [{ hazards }, { blackspots }] = await Promise.all([
      api.get("/hazards"),
      api.get("/blackspots").catch(() => ({ blackspots: [] })),
    ]);

    if (document.getElementById("filterHazards").checked) addHazardMarkers(hazards);
    if (document.getElementById("filterBlackspots").checked) addBlackspotMarkers(blackspots);
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

function refreshMap() {
  markerLayer.clearLayers();
  loadMapData();
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("road-map", "Road Safety Map");
  if (!user) return;
  initMap();
  loadMapData();
  document.getElementById("filterHazards").addEventListener("change", refreshMap);
  document.getElementById("filterBlackspots").addEventListener("change", refreshMap);
});
