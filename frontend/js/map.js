/**
 * DRIVE LEGAL AI — ROAD SAFETY MAP & GEOSPATIAL INTELLIGENCE (MAP.JS)
 * Smart India Hackathon 2026
 */

let mapInstance = null;
let markersLayerGroup = null;
let activeFilter = 'ALL';

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;
  Utils.initNavigation();

  initLeafletMap();
  await loadMapData();
  bindMapFilters();
});

function initLeafletMap() {
  const mapContainer = document.getElementById('road-safety-leaflet-map');
  if (!mapContainer || typeof L === 'undefined') return;

  // Default centered around Chennai / Bengaluru corridor
  mapInstance = L.map('road-safety-leaflet-map').setView([12.9716, 77.5946], 11);

  // CartoDB Dark Matter tiles (Perfect for cybersecurity/road safety dark theme)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapInstance);

  markersLayerGroup = L.layerGroup().addTo(mapInstance);
}

async function loadMapData() {
  if (!markersLayerGroup) return;
  markersLayerGroup.clearLayers();

  // 1. Fetch Blackspots
  if (activeFilter === 'ALL' || activeFilter === 'BLACKSPOTS') {
    const bRes = await API.get('/analytics/blackspots');
    if (bRes.success && bRes.data) {
      bRes.data.forEach((b) => {
        const marker = createCustomMarker(
          [b.latitude, b.longitude],
          b.riskScore >= 80 ? '#ef4444' : '#f97316',
          'bi-exclamation-octagon-fill'
        );

        marker.bindPopup(`
          <div style="color: #0f172a; min-width: 200px;">
            <div style="font-weight: 800; font-size: 0.95rem; color: #ef4444;">${b.roadName}</div>
            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px;">AI Predicted Blackspot (${b.riskScore}% Risk)</div>
            <div style="font-size: 0.75rem;"><strong>Accidents:</strong> ${b.historicalAccidentsCount} | <strong>Near-Misses:</strong> ${b.nearMissCount}</div>
            <div style="font-size: 0.75rem; margin-top: 4px; color: #0284c7;">
              <strong>Recommendation:</strong> ${(b.recommendations || [])[0] || 'Inspect roadway safety'}
            </div>
          </div>
        `);

        markersLayerGroup.addLayer(marker);
      });
    }
  }

  // 2. Fetch Hazards
  if (activeFilter === 'ALL' || activeFilter === 'HAZARDS') {
    const hRes = await API.get('/hazards', { status: 'ACTIVE' });
    if (hRes.success && hRes.data) {
      hRes.data.forEach((h) => {
        const marker = createCustomMarker(
          [h.latitude, h.longitude],
          h.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
          'bi-cone-striped'
        );

        marker.bindPopup(`
          <div style="color: #0f172a; min-width: 200px;">
            <div style="font-weight: 800; font-size: 0.95rem; color: #f59e0b;">${h.hazardType}</div>
            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px;">${h.locationName}</div>
            <div style="font-size: 0.75rem;">${h.description}</div>
            <div style="font-size: 0.75rem; margin-top: 4px;"><strong>AI Confidence:</strong> ${h.aiConfidence}% (${h.reportCount} reports)</div>
          </div>
        `);

        markersLayerGroup.addLayer(marker);
      });
    }
  }

  // 3. Fetch Near Misses
  if (activeFilter === 'ALL' || activeFilter === 'NEARMISS') {
    const nmRes = await API.get('/analytics/near-misses');
    if (nmRes.success && nmRes.data && nmRes.data.recentEvents) {
      nmRes.data.recentEvents.forEach((nm) => {
        const marker = createCustomMarker(
          [nm.latitude, nm.longitude],
          '#00f0ff',
          'bi-shield-exclamation'
        );

        marker.bindPopup(`
          <div style="color: #0f172a; min-width: 190px;">
            <div style="font-weight: 800; font-size: 0.9rem; color: #0284c7;">${nm.eventType}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${nm.locationName}</div>
            <div style="font-size: 0.72rem; margin-top: 4px;">Telemetry Deceleration: ${nm.decelerationGForce}g at ${nm.speedRecordedKmH} km/h</div>
          </div>
        `);

        markersLayerGroup.addLayer(marker);
      });
    }
  }
}

function createCustomMarker(coords, color, iconClass) {
  const customHtml = `
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${color};
      box-shadow: 0 0 15px ${color}88;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-size: 16px;
      border: 2px solid #ffffff;
    ">
      <i class="bi ${iconClass}"></i>
    </div>
  `;

  const icon = L.divIcon({
    html: customHtml,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });

  return L.marker(coords, { icon });
}

function bindMapFilters() {
  document.querySelectorAll('.map-filter-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.map-filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      await loadMapData();
    });
  });
}
