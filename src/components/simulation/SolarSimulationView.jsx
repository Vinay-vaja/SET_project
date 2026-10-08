// SolarSimulationView.jsx — Realistic Solar Photovoltaic Physics Simulation
// Flow: Sun → Photons → PV Silicon Array → DC Conductor → Inverter → AC Grid
import React, { useEffect, useRef } from 'react';
import { calcSolarMetrics } from '../../utils/solarCalculations.js';
import { useRealConditions } from '../../hooks/useRealConditions.js';

export default function SolarSimulationView({ params, results, isPlaying = true }) {
  const canvasRef = useRef(null);
  const realData = useRealConditions();

  const capacity = params?.solar?.capacity ?? 10;
  const sunlightHours = params?.solar?.sunlightHours ?? 5.5;
  const efficiency = params?.solar?.efficiency ?? 18;
  const ambientTemp = realData.isRealMode ? realData.temperature : 25;

  // Real-time calculations
  const metrics = calcSolarMetrics(capacity, sunlightHours, efficiency, ambientTemp);
  const irradianceDisplay = realData.isRealMode
    ? realData.solarIrradiance
    : Math.min(1200, Math.round(sunlightHours * 160));
  const isRealActive = realData.isRealMode;

  const dcPowerKW = +(capacity * (irradianceDisplay / 1000) * (efficiency / 100) * (100 / 96)).toFixed(2);
  const acPowerKW = +(metrics.energy / Math.max(1, sunlightHours)).toFixed(2);
  const invEfficiency = 96.0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Photon particle system
    const photonCount = Math.min(90, Math.max(15, Math.round(sunlightHours * 12)));
    const photons = [];
    for (let i = 0; i < photonCount; i++) {
      photons.push({
        x: 60 + Math.random() * (w * 0.35),
        y: 20 + Math.random() * (h * 0.4),
        speed: 1.2 + Math.random() * 2.2,
        length: 8 + Math.random() * 10,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }

    // Energy electron stream (DC)
    const dcElectrons = [];
    for (let i = 0; i < 24; i++) {
      dcElectrons.push({
        progress: Math.random(),
        speed: 0.006 + (dcPowerKW / 30) * 0.008,
      });
    }

    // AC Wave stream
    const acElectrons = [];
    for (let i = 0; i < 24; i++) {
      acElectrons.push({
        progress: Math.random(),
        speed: 0.008 + (acPowerKW / 30) * 0.008,
      });
    }

    let time = 0;

    const render = () => {
      if (isPlaying) time += 0.02;

      ctx.clearRect(0, 0, w, h);

      // --- 1. TECHNICAL GRID BACKGROUND ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 28;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // --- 2. SUN SOURCE ---
      const sunX = w * 0.18;
      const sunY = h * 0.18;
      const sunRadius = 26;

      // Sun glow halo
      const sunGradient = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 70);
      sunGradient.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
      sunGradient.addColorStop(0.3, 'rgba(245, 158, 11, 0.45)');
      sunGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
      ctx.fill();

      // Sun core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing corona rays
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
      ctx.lineWidth = 1.5;
      const rays = 12;
      for (let i = 0; i < rays; i++) {
        const angle = (i * Math.PI * 2) / rays + (isPlaying ? time * 0.2 : 0);
        const rayLen = 10 + Math.sin(time * 3 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(angle) * (sunRadius + 2), sunY + Math.sin(angle) * (sunRadius + 2));
        ctx.lineTo(sunX + Math.cos(angle) * (sunRadius + rayLen), sunY + Math.sin(angle) * (sunRadius + rayLen));
        ctx.stroke();
      }

      // --- 3. PHOTOVOLTAIC PANEL ARRAY ---
      const panelX = w * 0.12;
      const panelY = h * 0.58;
      const panelW = w * 0.28;
      const panelH = h * 0.24;

      // Structural Ground Mount Base
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(panelX + 20, panelY + panelH + 18);
      ctx.lineTo(panelX + panelW * 0.4, panelY + panelH * 0.5);
      ctx.moveTo(panelX + panelW - 20, panelY + panelH + 18);
      ctx.lineTo(panelX + panelW * 0.7, panelY + panelH * 0.5);
      ctx.stroke();

      // Ground concrete footings
      ctx.fillStyle = '#334155';
      ctx.fillRect(panelX + 10, panelY + panelH + 16, 22, 8);
      ctx.fillRect(panelX + panelW - 32, panelY + panelH + 16, 22, 8);

      // Tilted PV Panel Frame (Perspective Trapezoid)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(panelX, panelY + panelH * 0.45);
      ctx.lineTo(panelX + panelW * 0.2, panelY);
      ctx.lineTo(panelX + panelW, panelY + panelH * 0.15);
      ctx.lineTo(panelX + panelW * 0.85, panelY + panelH);
      ctx.closePath();

      // Deep silicon wafer gradient
      const pvGradient = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
      pvGradient.addColorStop(0, '#0f172a');
      pvGradient.addColorStop(0.5, '#1e293b');
      pvGradient.addColorStop(1, '#0284c7');
      ctx.fillStyle = pvGradient;
      ctx.fill();

      // Silicon border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Grid busbars & cell fingers
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      const cellCols = 5;
      const cellRows = 3;
      for (let c = 1; c < cellCols; c++) {
        const t = c / cellCols;
        ctx.beginPath();
        ctx.moveTo(panelX + (panelW * 0.2) * (1 - t) + panelX * t, panelY * (1 - t) + (panelY + panelH * 0.45) * t);
        ctx.lineTo(
          (panelX + panelW) * (1 - t) + (panelX + panelW * 0.85) * t,
          (panelY + panelH * 0.15) * (1 - t) + (panelY + panelH) * t
        );
        ctx.stroke();
      }
      ctx.restore();

      // --- 4. PHOTONS STREAMING FROM SUN TO PV PANEL ---
      ctx.strokeStyle = '#fef08a';
      photons.forEach((p) => {
        if (isPlaying) {
          p.y += p.speed;
          p.x += p.speed * 0.25;
          if (p.y > panelY + panelH * 0.6) {
            p.y = sunY + (Math.random() - 0.5) * 20;
            p.x = sunX + (Math.random() - 0.5) * 30;
          }
        }
        ctx.strokeStyle = `rgba(253, 224, 71, ${p.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.speed * 1.8, p.y + p.length);
        ctx.stroke();
      });

      // --- 5. DC POWER BUS CONDUIT (PV → Inverter) ---
      const dcStartX = panelX + panelW * 0.85;
      const dcStartY = panelY + panelH * 0.6;
      const invX = w * 0.56;
      const invY = h * 0.52;
      const invW = 90;
      const invH = 100;

      // Conduit line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(dcStartX, dcStartY);
      ctx.lineTo(invX, dcStartY);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dcStartX, dcStartY);
      ctx.lineTo(invX, dcStartY);
      ctx.stroke();

      // Flowing DC electrons (Amber)
      dcElectrons.forEach((el) => {
        if (isPlaying) {
          el.progress = (el.progress + el.speed) % 1;
        }
        const currX = dcStartX + (invX - dcStartX) * el.progress;
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(currX, dcStartY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // --- 6. INVERTER UNIT ---
      // Inverter enclosure
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(invX, invY, invW, invH, 8);
      ctx.fill();
      ctx.stroke();

      // Inverter ventilation louvers
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(invX + 12, invY + 12, invW - 24, 22);

      // Status LED
      const ledGlow = isPlaying ? (Math.sin(time * 5) > 0 ? '#10b981' : '#059669') : '#64748b';
      ctx.fillStyle = ledGlow;
      ctx.beginPath();
      ctx.arc(invX + 22, invY + 23, 4, 0, Math.PI * 2);
      ctx.fill();

      // Inverter label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('DC/AC INV', invX + 32, invY + 26);

      // Internal conversion circuit icon (Square wave to Sine wave)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // DC step
      ctx.moveTo(invX + 18, invY + 54);
      ctx.lineTo(invX + 28, invY + 54);
      ctx.lineTo(invX + 28, invY + 44);
      ctx.lineTo(invX + 38, invY + 44);
      // Arrow
      ctx.moveTo(invX + 43, invY + 49);
      ctx.lineTo(invX + 49, invY + 49);
      // Sine wave
      ctx.stroke();

      ctx.strokeStyle = '#22c55e';
      ctx.beginPath();
      for (let sx = 0; sx <= 24; sx++) {
        const sy = Math.sin((sx / 24) * Math.PI * 2) * 6;
        if (sx === 0) ctx.moveTo(invX + 54 + sx, invY + 49 + sy);
        else ctx.lineTo(invX + 54 + sx, invY + 49 + sy);
      }
      ctx.stroke();

      // Efficiency tag
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px sans-serif';
      ctx.fillText(`η = ${invEfficiency}%`, invX + 24, invY + 80);

      // --- 7. AC POWER CONDUIT (Inverter → Load/Grid) ---
      const acStartX = invX + invW;
      const acStartY = invY + invH * 0.5;
      const gridX = w * 0.88;
      const gridY = acStartY;

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(acStartX, acStartY);
      ctx.lineTo(gridX, gridY);
      ctx.stroke();

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(acStartX, acStartY);
      ctx.lineTo(gridX, gridY);
      ctx.stroke();

      // Flowing AC electrons (Green wave)
      acElectrons.forEach((el) => {
        if (isPlaying) {
          el.progress = (el.progress + el.speed) % 1;
        }
        const currX = acStartX + (gridX - acStartX) * el.progress;
        const sineWaveOffset = Math.sin(el.progress * Math.PI * 8 + time * 6) * 4;
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(currX, acStartY + sineWaveOffset, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // --- 8. SUBSTATION GRID / CONSUMER LOAD ---
      const subW = 54;
      const subH = 68;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(gridX, gridY - subH / 2, subW, subH, 6);
      ctx.fill();
      ctx.stroke();

      // Pylon transmission icon
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gridX + subW / 2, gridY - subH / 2 + 12);
      ctx.lineTo(gridX + subW / 2, gridY + subH / 2 - 12);
      ctx.moveTo(gridX + 12, gridY - 8);
      ctx.lineTo(gridX + subW - 12, gridY - 8);
      ctx.moveTo(gridX + 16, gridY + 6);
      ctx.lineTo(gridX + subW - 16, gridY + 6);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AC GRID', gridX + subW / 2, gridY + subH / 2 + 12);
      ctx.textAlign = 'left';

      // --- 9. COMPACT CONTEXTUAL ENGINEERING LABELS ---
      // Sun label
      drawEngineeringPill(
        ctx,
        sunX - 35,
        sunY - 42,
        isRealActive ? `☀️ REAL G: ${irradianceDisplay} W/m²` : `☀️ ${irradianceDisplay} W/m²`,
        '#f59e0b'
      );

      // PV Array label
      drawEngineeringPill(ctx, panelX, panelY - 18, `PV DC: ${dcPowerKW} kW (SIMULATED)`, '#38bdf8');

      // Inverter label
      drawEngineeringPill(ctx, invX - 10, invY - 18, `INVERTER (50 Hz)`, '#10b981');

      // Grid output label
      drawEngineeringPill(ctx, gridX - 14, gridY - subH / 2 - 18, `AC OUT: ${acPowerKW} kW (ESTIMATED)`, '#34d399');

      // --- 10. FORMULA FOOTER OVERLAY ---
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(14, h - 34, w - 28, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(
        `GOVERNING LAW: P_solar = Capacity(${capacity} kW) × (G[${isRealActive ? 'REAL ' : ''}${irradianceDisplay} W/m²] / 1000) × η_pv(${efficiency}%) × η_inv(${invEfficiency}%) = ${acPowerKW} kW Estimated Output`,
        24,
        h - 18
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [capacity, sunlightHours, efficiency, isPlaying, dcPowerKW, acPowerKW, irradianceDisplay, isRealActive]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 380 }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          borderRadius: 10,
          background: '#070b12',
        }}
      />
    </div>
  );
}

// Helper to draw clean engineering annotation badge
function drawEngineeringPill(ctx, x, y, text, color) {
  ctx.save();
  ctx.font = 'bold 9px monospace';
  const width = ctx.measureText(text).width + 12;
  const height = 18;

  ctx.fillStyle = 'rgba(11, 16, 26, 0.88)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.fillText(text, x + 6, y + 12);
  ctx.restore();
}
