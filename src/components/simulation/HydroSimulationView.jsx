// HydroSimulationView.jsx — Realistic Hydroelectric Physics Simulation
// Flow: Reservoir → Penstock Conduit (Water Particles) → Francis Turbine Runner → Generator → Grid
import React, { useEffect, useRef } from 'react';
import { calcHydroMetrics } from '../../utils/hydroCalculations.js';

export default function HydroSimulationView({ params, results, isPlaying = true }) {
  const canvasRef = useRef(null);

  const capacity = params?.hydro?.capacity ?? 3;
  const operatingHours = params?.hydro?.operatingHours ?? 8;
  const efficiency = params?.hydro?.efficiency ?? 80;
  const headHeight = params?.hydro?.headHeight ?? 18;
  const flowRate = params?.hydro?.flowRate ?? 0.025; // m^3/s

  // Real calculations
  const metrics = calcHydroMetrics(capacity, operatingHours, efficiency, headHeight, flowRate);
  const hydroPowerKW = metrics.actualPowerKW;
  const penstockPressure = metrics.penstockPressureKPa;
  const flowLps = Math.round(flowRate * 1000);
  const runnerRpm = Math.round(180 + Math.sqrt(headHeight) * 35);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Water particles inside penstock
    const waterParticleCount = Math.min(80, Math.max(25, Math.round(flowLps * 1.5)));
    const waterParticles = [];
    for (let i = 0; i < waterParticleCount; i++) {
      waterParticles.push({
        progress: Math.random(),
        offset: (Math.random() - 0.5) * 14,
        speed: 0.008 + (Math.sqrt(headHeight) / 10) * 0.012 + (flowLps / 100) * 0.008,
        size: 2.5 + Math.random() * 2.5,
      });
    }

    // Output electricity electrons
    const powerElectrons = [];
    for (let i = 0; i < 20; i++) {
      powerElectrons.push({
        progress: Math.random(),
        speed: 0.008 + (hydroPowerKW / 20) * 0.01,
      });
    }

    let runnerAngle = 0;
    let time = 0;

    const render = () => {
      if (isPlaying) {
        time += 0.02;
        runnerAngle += (runnerRpm / 60) * Math.PI * 2 * 0.016;
      }

      ctx.clearRect(0, 0, w, h);

      // --- 1. TECHNICAL GRID ---
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

      // --- 2. MOUNTAIN RESERVOIR (Top Left) ---
      const resX = 20;
      const resY = h * 0.14;
      const resW = w * 0.28;
      const resH = h * 0.26;

      // Mountain / Dam Wall cross section
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.45);
      ctx.lineTo(resX + resW, resY + resH);
      ctx.lineTo(resX + resW, h * 0.85);
      ctx.lineTo(0, h * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Deep Water Basin Reservoir
      ctx.beginPath();
      ctx.moveTo(resX, resY);
      ctx.lineTo(resX + resW, resY);
      ctx.lineTo(resX + resW, resY + resH);
      ctx.lineTo(resX, resY + resH);
      ctx.closePath();

      const waterGrad = ctx.createLinearGradient(0, resY, 0, resY + resH);
      waterGrad.addColorStop(0, '#0ea5e9');
      waterGrad.addColorStop(0.7, '#0284c7');
      waterGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = waterGrad;
      ctx.fill();

      // Water surface animated waves
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = resX; x <= resX + resW; x += 4) {
        const y = resY + Math.sin((x * 0.08) + time * 3) * 3;
        if (x === resX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Intake Gate Screen
      ctx.fillStyle = '#475569';
      ctx.fillRect(resX + resW - 8, resY + resH - 30, 8, 30);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      for (let gy = resY + resH - 28; gy < resY + resH; gy += 6) {
        ctx.beginPath();
        ctx.moveTo(resX + resW - 8, gy);
        ctx.lineTo(resX + resW, gy);
        ctx.stroke();
      }

      // --- 3. PRESSURIZED PENSTOCK CONDUIT ---
      const penstockStartX = resX + resW;
      const penstockStartY = resY + resH - 15;
      const turbineX = w * 0.62;
      const turbineY = h * 0.68;

      // Heavy steel penstock pipe casing
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(penstockStartX, penstockStartY);
      ctx.lineTo(turbineX, turbineY);
      ctx.stroke();

      // Internal fluid channel
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(penstockStartX, penstockStartY);
      ctx.lineTo(turbineX, turbineY);
      ctx.stroke();

      // Rushing water particles inside penstock
      waterParticles.forEach((p) => {
        if (isPlaying) {
          p.progress = (p.progress + p.speed) % 1;
        }
        const currX = penstockStartX + (turbineX - penstockStartX) * p.progress;
        const currY = penstockStartY + (turbineY - penstockStartY) * p.progress;

        // Perpendicular offset
        const dx = turbineX - penstockStartX;
        const dy = turbineY - penstockStartY;
        const len = Math.hypot(dx, dy);
        const nx = -dy / len;
        const ny = dx / len;

        ctx.fillStyle = '#7dd3fc';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(currX + nx * p.offset, currY + ny * p.offset, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // --- 4. FRANCIS REACTION TURBINE HOUSING ---
      // Spiral volute casing
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(turbineX, turbineY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Water discharge draft tube (Tailrace back to river)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(turbineX - 15, turbineY + 30);
      ctx.lineTo(turbineX - 30, h * 0.88);
      ctx.lineTo(turbineX + 30, h * 0.88);
      ctx.lineTo(turbineX + 15, turbineY + 30);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0369a1';
      ctx.fillRect(turbineX - 45, h * 0.85, 90, h * 0.15);

      // Tailrace water flow ripples
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        const ry = h * 0.87 + r * 6;
        ctx.moveTo(turbineX - 40, ry);
        ctx.lineTo(turbineX + 40, ry);
        ctx.stroke();
      }

      // Rotating Francis Runner Blades
      ctx.save();
      ctx.translate(turbineX, turbineY);
      ctx.rotate(runnerAngle);

      // Center runner hub
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // 6 Curved runner bucket blades
      const bladeCount = 6;
      for (let i = 0; i < bladeCount; i++) {
        const bAngle = (i * Math.PI * 2) / bladeCount;
        ctx.save();
        ctx.rotate(bAngle);

        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(14, 0, 12, Math.PI * 0.5, Math.PI * 1.5, true);
        ctx.stroke();

        ctx.restore();
      }
      ctx.restore();

      // --- 5. SYNCHRONOUS HYDRO GENERATOR (Above Turbine) ---
      const genX = turbineX;
      const genY = turbineY - 65;
      const genW = 54;
      const genH = 46;

      // Vertical shaft connecting turbine to generator
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(turbineX, turbineY - 30);
      ctx.lineTo(genX, genY + genH);
      ctx.stroke();

      // Rotating shaft marker ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(turbineX, turbineY - 45, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Generator Stator Frame
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(genX - genW / 2, genY, genW, genH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HYDRO GEN', genX, genY + 16);
      ctx.fillStyle = '#34d399';
      ctx.fillText(`${runnerRpm} RPM`, genX, genY + 28);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('50.0 Hz', genX, genY + 39);
      ctx.textAlign = 'left';

      // --- 6. ELECTRICAL OUTPUT BUS (Generator → Grid) ---
      const busStartX = genX + genW / 2;
      const busStartY = genY + genH / 2;
      const busEndX = w * 0.90;
      const busEndY = busStartY;

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(busStartX, busStartY);
      ctx.lineTo(busEndX, busEndY);
      ctx.stroke();

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(busStartX, busStartY);
      ctx.lineTo(busEndX, busEndY);
      ctx.stroke();

      // Flowing power electrons
      powerElectrons.forEach((el) => {
        if (isPlaying) {
          el.progress = (el.progress + el.speed) % 1;
        }
        const currX = busStartX + (busEndX - busStartX) * el.progress;
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(currX, busStartY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Substation Pill
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(busEndX, busEndY - 20, 48, 40, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AC GRID', busEndX + 24, busEndY + 4);
      ctx.fillStyle = '#34d399';
      ctx.fillText(`${hydroPowerKW} kW`, busEndX + 24, busEndY + 15);
      ctx.textAlign = 'left';

      // --- 7. CONTEXTUAL ENGINEERING LABELS ---
      // Reservoir Head
      drawEngineeringPill(ctx, resX, resY - 20, `💧 Head (H): ${headHeight} m`, '#0ea5e9');

      // Penstock Flow & Pressure
      const midPenX = (penstockStartX + turbineX) / 2;
      const midPenY = (penstockStartY + turbineY) / 2;
      drawEngineeringPill(ctx, midPenX - 30, midPenY - 24, `Penstock: ${penstockPressure} kPa | ${flowLps} L/s`, '#38bdf8');

      // Turbine Speed
      drawEngineeringPill(ctx, turbineX - 40, turbineY + 36, `Francis Runner: ${runnerRpm} RPM`, '#7dd3fc');

      // Generator Output
      drawEngineeringPill(ctx, genX - 35, genY - 20, `Baseload: ${hydroPowerKW} kW`, '#10b981');

      // --- 8. FORMULA FOOTER OVERLAY ---
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
        `GOVERNING LAW: P_hydro = η(${efficiency}%) × ρ(1000) × g(9.81) × Q(${flowRate} m³/s) × H(${headHeight}m) = ${hydroPowerKW} kW Continuous Baseload`,
        24,
        h - 18
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [capacity, operatingHours, efficiency, headHeight, flowRate, isPlaying, hydroPowerKW, penstockPressure, flowLps, runnerRpm]);

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
