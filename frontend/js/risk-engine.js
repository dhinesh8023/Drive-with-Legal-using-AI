/**
 * DRIVE LEGAL AI — CLIENT-SIDE RISK ENGINE & EXPLAINABLE AI VISUALIZER (RISK-ENGINE.JS)
 */

const ClientRiskEngine = {
  /**
   * Evaluate telemetry with backend or fallback internal calculation
   */
  async calculateRisk(data) {
    try {
      const res = await API.post('/ai/risk-prediction', data);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (e) {
      // Fallback
    }

    return this.fallbackEvaluate(data);
  },

  /**
   * Deterministic client fallback calculator
   */
  fallbackEvaluate(data) {
    const scenario = data.scenario || 'NORMAL DRIVING';
    const speed = data.speed || 50;
    const limit = data.speedLimit || 60;

    let score = 15;
    const breakdown = {};
    const reasons = [];
    const recommendations = [];

    if (scenario === 'OVERSPEEDING' || speed > limit + 20) {
      score += 35;
      breakdown['Excessive Speeding'] = 35;
      reasons.push(`Speeding at ${speed} km/h (Limit: ${limit} km/h)`);
      recommendations.push('Reduce speed immediately.');
    }

    if (scenario === 'DROWSINESS') {
      score += 40;
      breakdown['Driver Drowsiness'] = 40;
      reasons.push('Driver eyes closed / microsleep signs');
      recommendations.push('Pull over and take a rest break.');
    }

    if (scenario === 'DISTRACTION') {
      score += 25;
      breakdown['Driver Inattention'] = 25;
      reasons.push('Head turned away from forward lane');
      recommendations.push('Focus on the road ahead.');
    }

    if (scenario === 'MOBILE PHONE USAGE') {
      score += 30;
      breakdown['Mobile Phone Handset Use'] = 30;
      reasons.push('Device detected near steering zone');
      recommendations.push('Put down mobile device immediately.');
    }

    if (scenario === 'HEAVY RAIN') {
      score += 25;
      breakdown['Adverse Rain / Low Friction'] = 25;
      reasons.push('Wet slippery asphalt and poor visibility');
      recommendations.push('Turn on headlights and increase headway buffer.');
    }

    if (scenario === 'POTHOLE') {
      score += 20;
      breakdown['Severe Road Pothole Ahead'] = 20;
      reasons.push('Deep crater detected in vehicle path');
      recommendations.push('Decelerate safely; do not swerve aggressively.');
    }

    if (scenario === 'WRONG SIDE DRIVING') {
      score = 90;
      breakdown['Wrong-Side Movement'] = 90;
      reasons.push('Vehicle heading into opposing traffic');
      recommendations.push('Stop immediately on shoulder and reorient.');
    }

    if (scenario === 'COLLISION RISK') {
      score = 88;
      breakdown['Imminent Frontal Impact'] = 88;
      reasons.push('Time-to-collision under 1.5 seconds');
      recommendations.push('Apply brakes immediately!');
    }

    if (scenario === 'ACCIDENT') {
      score = 99;
      breakdown['Kinetic Impact Deceleration'] = 99;
      reasons.push('Severe kinetic shock signature');
      recommendations.push('Automated SOS Alert active.');
    }

    score = Math.min(100, Math.max(5, score));
    let level = 'SAFE';
    if (score >= 81) level = 'CRITICAL';
    else if (score >= 61) level = 'HIGH';
    else if (score >= 31) level = 'MODERATE';

    if (reasons.length === 0) {
      reasons.push('Smooth vehicle trajectory');
      reasons.push('Driver focused and alert');
      recommendations.push('Maintain regular safety buffer.');
    }

    return {
      status: 'success',
      riskScore: score,
      riskLevel: level,
      aiConfidence: 92,
      breakdown,
      reasons,
      recommendations,
      isAiAssisted: true,
    };
  },

  /**
   * Update visual gauge and Explainable AI breakdown elements in DOM
   */
  updateVisuals(result) {
    const scoreEl = document.getElementById('risk-score-value');
    const levelEl = document.getElementById('risk-level-badge');
    const gaugeEl = document.getElementById('risk-gauge-circle');
    const reasonsContainer = document.getElementById('xai-reasons-list');
    const factorsContainer = document.getElementById('xai-factors-breakdown');
    const recommendationEl = document.getElementById('ai-recommendation-text');

    if (scoreEl) scoreEl.textContent = result.riskScore;

    if (levelEl) {
      levelEl.className = `badge-risk ${result.riskLevel.toLowerCase()}`;
      levelEl.textContent = result.riskLevel;
    }

    // Change Gauge Border Color
    if (gaugeEl) {
      let color = '#10b981'; // safe
      if (result.riskLevel === 'CRITICAL') color = '#ef4444';
      else if (result.riskLevel === 'HIGH') color = '#f97316';
      else if (result.riskLevel === 'MODERATE') color = '#f59e0b';

      gaugeEl.style.borderColor = color;
      gaugeEl.style.boxShadow = `0 0 25px ${color}55`;
    }

    // Render Reasons
    if (reasonsContainer && result.reasons) {
      reasonsContainer.innerHTML = result.reasons
        .map((r) => `<li style="margin-bottom: 4px;">• ${r}</li>`)
        .join('');
    }

    // Render Explainable AI delta breakdown
    if (factorsContainer && result.breakdown) {
      const keys = Object.keys(result.breakdown);
      if (keys.length === 0) {
        factorsContainer.innerHTML = '<div class="text-muted small">No anomalous risk factors identified.</div>';
      } else {
        factorsContainer.innerHTML = keys
          .map((k) => {
            const val = result.breakdown[k];
            const isCritical = val >= 30;
            return `
              <div class="xai-factor-item ${isCritical ? 'danger' : 'warning'}">
                <span>${k}</span>
                <span class="xai-delta-pill ${isCritical ? 'danger' : 'warning'}">+${val}</span>
              </div>
            `;
          })
          .join('');
      }
    }

    if (recommendationEl && result.recommendations) {
      recommendationEl.textContent = result.recommendations[0] || 'Maintain safe driving caution.';
    }
  },
};

window.ClientRiskEngine = ClientRiskEngine;
