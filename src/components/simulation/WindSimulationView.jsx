// WindSimulationView.jsx — Realistic Wind Aerodynamic Physics Simulation
// Flow: Atmospheric Wind Streamlines → Airfoil Blades (Betz limit) → Shaft & Gearbox → Alternator → Grid
import React, { useEffect, useRef } from 'react';
import { calcWindMetrics, estimateCapacityFactor } from '../../utils/windCalculations.js';
import { useRealConditions } from '../../hooks/useRealConditions.js';

export default function WindSimulationView({ params, results, isPlaying = true }) {
  const canvasRef = useRef(null);
  const realData = useRealConditions();

  const turbineCapacity = params?.wind?.turbineCapacity ?? 5;
  const numTurbines = params?.wind?.numTurbines ?? 2;
  const isRealActive = realData.isRealMode;
  const windSpeed = isRealActive ? realData.windSpeed : (params?.wind?.windSpeed ?? 7.0);
  const capacityFactor = isRealActive ? Math.round(estimateCapacityFactor(windSpeed)) : (params?.wind?.capacityFactor ?? 30);

  // Real calculation metrics
  const metrics = calcWindMetrics(turbineCapacity, numTurbines, windSpeed, capacityFactor);
  const totalPowerKW = +((metrics.energy / 24)).toFixed(2);
  const rotorRpm = metrics.state.rotorRpm;
  const stateStatus = metrics.state.status;

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

    // Wind particle streamlines
    const particleCount = Math.min(100, Math.max(20, Math.round(windSpeed * 6)));
    const windParticles = [];
    for (let i = 0; i < particleCount; i++) {
      windParticles.push({
        x: Math.random() * w,
        y: 20 + Math.random() * (h * 0.8),
        speed: (windSpeed / 7) * (2.0 + Math.random() * 2.5),
        length: 12 + Math.random() * 20,
        alpha: 0.15 + Math.random() * 0.45,
      });
    }

    // Electrical output electrons down the tower
    const towerElectrons = [];
    for (let i = 0; i < 18; i++) {
      towerElectrons.push({
        progress: Math.random(),
        speed: 0.008 + (totalPowerKW / 40) * 0.01,
      });
    }

    let bladeAngle = 0;
    let time = 0;

    const render = () => {
      if (isPlaying) {
        time += 0.02;
        // Blade rotation speed proportional to calculated rotor RPM
        bladeAngle += (rotorRpm / 60) * Math.PI * 2 * 0.016;
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

      // --- 2. WIND STREAMLINES (Moving left to right) ---
      windParticles.forEach((p) => {
        if (isPlaying) {
          p.x += p.speed;
          if (p.x > w + 20) {
            p.x = -20;
            p.y = 20 + Math.random() * (h * 0.8);
          }
        }
        ctx.strokeStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.length, p.y);
        ctx.stroke();
      });

      // --- 3. WIND TURBINE STRUCTURE ---
      const hubX = w * 0.48;
      const hubY = h * 0.42;
      const towerBaseY = h * 0.84;
      const bladeRadius = Math.min(105, h * 0.32);

      // Ground concrete foundation plinth
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(hubX - 28, towerBaseY, 56, 10, 4);
      ctx.fill();

      // Tapered Steel Tower
      ctx.beginPath();
      ctx.moveTo(hubX - 16, towerBaseY);
      ctx.lineTo(hubX - 6, hubY + 12);
      ctx.lineTo(hubX + 6, hubY + 12);
      ctx.lineTo(hubX + 16, towerBaseY);
      ctx.closePath();

      const towerGrad = ctx.createLinearGradient(hubX - 16, 0, hubX + 16, 0);
      towerGrad.addColorStop(0, '#64748b');
      towerGrad.addColorStop(0.5, '#cbd5e1');
      towerGrad.addColorStop(1, '#475569');
      ctx.fillStyle = towerGrad;
      ctx.fill();

      // Down-tower internal power conduit
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hubX, hubY + 15);
      ctx.lineTo(hubX, towerBaseY);
      ctx.stroke();

      // Flowing power electrons down tower
      if (totalPowerKW > 0) {
        towerElectrons.forEach((el) => {
          if (isPlaying) {
            el.progress = (el.progress + el.speed) % 1;
          }
          const currY = (hubY + 15) + (towerBaseY - (hubY + 15)) * el.progress;
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(hubX, currY, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // Nacelle (Generator Housing on Top)
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(hubX - 24, hubY - 10, 48, 20, 6);
      ctx.fill();
      ctx.stroke();

      // Aviation red beacon light on top of nacelle
      const beaconPulse = Math.sin(time * 6) > 0.3 ? '#ef4444' : '#450a0a';
      ctx.fillStyle = beaconPulse;
      ctx.beginPath();
      ctx.arc(hubX - 16, hubY - 12, 3, 0, Math.PI * 2);
      ctx.fill();

      // --- 4. 3 ROTATING AERODYNAMIC AIRFOIL BLADES ---
      ctx.save();
      ctx.translate(hubX, hubY);

      // Draw 3 blades at 120-degree intervals
      for (let b = 0; b < 3; b++) {
        const curAngle = bladeAngle + (b * Math.PI * 2) / 3;
        ctx.save();
        ctx.rotate(curAngle);

        // Aerodynamic Airfoil Blade geometry
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(-4, -bladeRadius * 0.45);
        ctx.lineTo(-1, -bladeRadius);
        ctx.lineTo(3, -bladeRadius * 0.95);
        ctx.lineTo(5, -bladeRadius * 0.4);
        ctx.lineTo(2, 0);
        ctx.closePath();

        const bladeGrad = ctx.createLinearGradient(0, 0, 0, -bladeRadius);
        bladeGrad.addColorStop(0, '#f8fafc');
        bladeGrad.addColorStop(0.85, '#e2e8f0');
        bladeGrad.addColorStop(1, '#ef4444'); // Red warning tip
        ctx.fillStyle = bladeGrad;
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.restore();
      }

      // Rotor Hub Nose Cone (Front Spinner)
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // --- 5. BASE TRANSFORMER SUBSTATION ---
      const transX = hubX + 42;
      const transY = towerBaseY - 26;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(transX, transY, 68, 36, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('STEP-UP XFR', transX + 6, transY + 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('690V → 33kV', transX + 6, transY + 28);

      // Conduit connecting tower base to transformer
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hubX + 16, towerBaseY + 4);
      ctx.lineTo(transX, towerBaseY + 4);
      ctx.stroke();

      // --- 6. CONTEXTUAL ENGINEERING LABELS ---
      // Wind speed label
      drawEngineeringPill(
        ctx,
        24,
        24,
        isRealActive ? `💨 REAL INFLOW: ${windSpeed.toFixed(1)} m/s` : `💨 Inflow Velocity: ${windSpeed.toFixed(1)} m/s`,
        '#38bdf8'
      );

      // Rotor speed label
      drawEngineeringPill(ctx, hubX - 55, hubY - bladeRadius - 16, `Rotor: ${rotorRpm} RPM`, '#0284c7');

      // State label
      const stateColor = windSpeed < 3 ? '#f59e0b' : windSpeed > 25 ? '#ef4444' : '#10b981';
      drawEngineeringPill(ctx, hubX + 35, hubY - 24, `State: ${stateStatus.split(' ')[0]}`, stateColor);

      // Power label
      drawEngineeringPill(ctx, transX, transY - 20, `Active Power: ${totalPowerKW} kW (SIMULATED)`, '#10b981');

      // --- 7. FORMULA FOOTER OVERLAY ---
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
        `GOVERNING LAW: P_wind = 0.5 × ρ_air(1.225) × A_rotor × v³[${isRealActive ? 'REAL ' : ''}${windSpeed} m/s] × Cp(0.42) = ${totalPowerKW} kW Estimated Output (${numTurbines} Turbines)`,
        24,
        h - 18
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [turbineCapacity, numTurbines, windSpeed, capacityFactor, isPlaying, totalPowerKW, rotorRpm, stateStatus, isRealActive]);

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
