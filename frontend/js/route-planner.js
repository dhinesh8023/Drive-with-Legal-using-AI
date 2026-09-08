/**
 * PROTOTYPE MODE: there is no real routing/mapping API wired in yet.
 * This uses straight-line distance between the two clicked map points and
 * cross-references nearby hazards/blackspots already in the system to
 * produce an illustrative "fastest vs safest vs balanced" comparison.
 * See the note in the page: replace calculateRoutes() with a real
 * directions API (Google/OSRM/Mapbox) + a live traffic feed for production.
 */

let map = null;
let startPoint = null;
let endPoint = null;
let clickMode = "start";
let markers = [];

function initMap() {
  map = L.map("routeMapContainer").setView([11.1085, 77.3411], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  map.on("click", (e) => {
    if (clickMode === "start") {
      startPoint = e.latlng;
      document.getElementById("startLabel").textContent = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
      clickMode = "end";
    } else {
      endPoint = e.latlng;
      document.getElementById("endLabel").textContent = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
      clickMode = "start";
    }
    redrawMarkers();
  });
}

function redrawMarkers() {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];
  if (startPoint) markers.push(L.marker(startPoint).addTo(map).bindPopup("Start"));
  if (endPoint) markers.push(L.marker(endPoint).addTo(map).bindPopup("Destination"));
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function calculateRoutes() {
  if (!startPoint || !endPoint) {
    Utils.toast("Click the map to set a start point, then a destination.", "info");
    return;
  }

  const distanceKm = haversineKm(startPoint, endPoint);

  let hazardCount = 0;
  let blackspotCount = 0;
  try {
    const [{ hazards }, { blackspots }] = await Promise.all([
      api.get("/hazards"),
      api.get("/blackspots").catch(() => ({ blackspots: [] })),
    ]);
    hazardCount = hazards.filter((h) => pointNearLine(h.location, startPoint, endPoint)).length;
    blackspotCount = blackspots.filter((b) => pointNearLine(b.location, startPoint, endPoint)).length;
  } catch (err) {
    /* demo data may be empty; continue with zero counts */
  }

  // Demo heuristics only — not derived from a real routing engine.
  const baseTimeMin = Math.max(5, Math.round(distanceKm * 2)); // ~30km/h avg demo speed
  const routes = [
    {
      label: "FASTEST ROUTE",
      distanceKm: distanceKm.toFixed(1),
      timeMin: baseTimeMin,
      riskScore: Math.min(100, 30 + hazardCount * 8 + blackspotCount * 15),
      hazardCount,
      blackspotCount,
    },
    {
      label: "SAFEST ROUTE",
      distanceKm: (distanceKm * 1.25).toFixed(1),
      timeMin: Math.round(baseTimeMin * 1.3),
      riskScore: Math.max(5, 20 - hazardCount * 2),
      hazardCount: Math.max(0, hazardCount - 1),
      blackspotCount: Math.max(0, blackspotCount - 1),
    },
    {
      label: "BALANCED ROUTE",
      distanceKm: (distanceKm * 1.1).toFixed(1),
      timeMin: Math.round(baseTimeMin * 1.15),
      riskScore: Math.min(100, 22 + hazardCount * 4 + blackspotCount * 7),
      hazardCount: Math.max(0, hazardCount - Math.floor(hazardCount / 2)),
      blackspotCount,
    },
  ];

  renderRoutes(routes);
}

function pointNearLine(point, a, b, thresholdKm = 1.5) {
  // Simple midpoint-distance approximation for demo purposes.
  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  return haversineKm(point, mid) <= thresholdKm;
}

function renderRoutes(routes) {
  const container = document.getElementById("routeResults");
  container.innerHTML = routes
    .map((r) => {
      const level = r.riskScore <= 30 ? "SAFE" : r.riskScore <= 60 ? "MODERATE" : r.riskScore <= 80 ? "HIGH" : "CRITICAL";
      return `<div class="glass-card accented" style="margin-bottom:12px;">
        <div class="flex justify-between items-center">
          <strong>${r.label}</strong>
          <span class="risk-badge risk-${level}">${level}</span>
        </div>
        <div class="grid grid-cols-4" style="margin-top:10px; font-size:12.5px;">
          <div><span class="text-muted">Distance</span><br>${r.distanceKm} km</div>
          <div><span class="text-muted">Est. Time</span><br>${r.timeMin} min</div>
          <div><span class="text-muted">Hazards</span><br>${r.hazardCount}</div>
          <div><span class="text-muted">Blackspots</span><br>${r.blackspotCount}</div>
        </div>
      </div>`;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const user = renderShell("route-planner", "Route Safety Planner");
  if (!user) return;
  initMap();
  document.getElementById("calcRouteBtn").addEventListener("click", calculateRoutes);
});
