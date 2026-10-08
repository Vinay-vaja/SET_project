// BiomassSimulationView.jsx — Industrial Process-Plant Biomass & CHP Simulation
// Flow: Feedstock Hopper → Gasifier Reactor (Syngas) → Combustion Generator → Electricity + CHP Heat Recovery
import React, { useEffect, useRef } from 'react';
import { calcBiomassMetrics, BIOMASS_FEEDSTOCKS } from '../../utils/biomassCalculations.js';

export default function BiomassSimulationView({ params, results, isPlaying = true }) {
  const canvasRef = useRef(null);

  const inputKg = params?.biomass?.input ?? 50;
  const conversionEfficiency = params?.biomass?.conversionEfficiency ?? 25;
  const feedstockKey = params?.biomass?.feedstock ?? 'agricultural';
  const moisture = params?.biomass?.moisture ?? 14;

  // Real calculations
  const metrics = calcBiomassMetrics(inputKg, conversionEfficiency, feedstockKey, moisture);
  const electricalPowerKW = +(metrics.electricalEnergy / 24).toFixed(2);
  const thermalPowerKW = +(metrics.recoveredThermalHeatKWh / 24).toFixed(2);
  const effectiveLHV = metrics.effectiveLHV;
  const syngasYieldM3 = Math.round(inputKg * 1.8);

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

    // Solid biomass pellets moving on conveyor
    const pellets = [];
    for (let i = 0; i < 18; i++) {
      pellets.push({
        progress: Math.random(),
        speed: 0.005 + (inputKg / 200) * 0.008,
      });
    }

    // Gas bubbles in gasifier
    const gasBubbles = [];
    for (let i = 0; i < 28; i++) {
      gasBubbles.push({
        x: (Math.random() - 0.5) * 44,
        y: Math.random() * 70,
        speed: 0.8 + Math.random() * 1.4,
        size: 2 + Math.random() * 3,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }

    // Electrical output electrons
    const powerElectrons = [];
    for (let i = 0; i < 16; i++) {
      powerElectrons.push({
        progress: Math.random(),
        speed: 0.008 + (electricalPowerKW / 10) * 0.01,
      });
    }

    // Thermal heat flow particles
    const heatParticles = [];
    for (let i = 0; i < 16; i++) {
      heatParticles.push({
        progress: Math.random(),
        speed: 0.007 + (thermalPowerKW / 15) * 0.01,
      });
    }

    let time = 0;

    const render = () => {
      if (isPlaying) time += 0.02;

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

      // --- 2. STAGE 1: FEEDSTOCK HOPPER & CONVEYOR (Left) ---
      const hopperX = w * 0.08;
      const hopperY = h * 0.38;
      const hopperW = 70;
      const hopperH = 80;

      // Inverted trapezoid hopper bin
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hopperX, hopperY);
      ctx.lineTo(hopperX + hopperW, hopperY);
      ctx.lineTo(hopperX + hopperW * 0.7, hopperY + hopperH);
      ctx.lineTo(hopperX + hopperW * 0.3, hopperY + hopperH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Organic waste pile inside hopper
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.moveTo(hopperX + 8, hopperY + 20);
      ctx.lineTo(hopperX + hopperW - 8, hopperY + 20);
      ctx.lineTo(hopperX + hopperW * 0.65, hopperY + hopperH - 5);
      ctx.lineTo(hopperX + hopperW * 0.35, hopperY + hopperH - 5);
      ctx.closePath();
      ctx.fill();

      // Conveyor belt to gasifier
      const convStartX = hopperX + hopperW * 0.5;
      const convStartY = hopperY + hopperH;
      const gasifierX = w * 0.38;
      const gasifierY = h * 0.44;

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(convStartX, convStartY);
      ctx.lineTo(gasifierX - 45, convStartY);
      ctx.stroke();

      // Moving organic pellets
      pellets.forEach((p) => {
        if (isPlaying) {
          p.progress = (p.progress + p.speed) % 1;
        }
        const currX = convStartX + (gasifierX - 45 - convStartX) * p.progress;
        ctx.fillStyle = '#a16207';
        ctx.beginPath();
        ctx.arc(currX, convStartY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- 3. STAGE 2: THERMOCHEMICAL GASIFIER / DIGESTER SILO ---
      const gasW = 85;
      const gasH = 130;

      // Vertical Gasifier Reactor Vessel
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(gasifierX - gasW / 2, gasifierY - gasH / 2, gasW, gasH, [16, 16, 8, 8]);
      ctx.fill();
      ctx.stroke();

      // Glowing reaction bed at bottom (850°C Thermochemical bed)
      const glowGrad = ctx.createRadialGradient(
        gasifierX,
        gasifierY + gasH * 0.35,
        5,
        gasifierX,
        gasifierY + gasH * 0.35,
        35
      );
      glowGrad.addColorStop(0, '#f97316');
      glowGrad.addColorStop(0.5, '#ea580c');
      glowGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(gasifierX - gasW / 2 + 6, gasifierY + gasH * 0.1, gasW - 12, gasH * 0.35);

      // Rising Syngas / Biogas bubbles
      gasBubbles.forEach((b) => {
        if (isPlaying) {
          b.y -= b.speed;
          if (b.y < -gasH * 0.4) {
            b.y = gasH * 0.35;
            b.x = (Math.random() - 0.5) * 44;
          }
        }
        ctx.fillStyle = `rgba(52, 211, 153, ${b.alpha})`;
        ctx.beginPath();
        ctx.arc(gasifierX + b.x, gasifierY + b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Reactor pressure relief cap
      ctx.fillStyle = '#334155';
      ctx.fillRect(gasifierX - 12, gasifierY - gasH / 2 - 10, 24, 10);

      // --- 4. GAS SCRUBBER & COMBUSTION ENGINE / TURBINE ---
      const engineX = w * 0.65;
      const engineY = h * 0.44;
      const engineW = 95;
      const engineH = 80;

      // Overhead Syngas transfer pipe (Gasifier → Engine)
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(gasifierX, gasifierY - gasH / 2);
      ctx.lineTo(gasifierX, gasifierY - gasH / 2 - 20);
      ctx.lineTo(engineX - 20, gasifierY - gasH / 2 - 20);
      ctx.lineTo(engineX - 20, engineY - engineH / 2);
      ctx.stroke();

      // Flowing green syngas pulse
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gasifierX, gasifierY - gasH / 2);
      ctx.lineTo(gasifierX, gasifierY - gasH / 2 - 20);
      ctx.lineTo(engineX - 20, gasifierY - gasH / 2 - 20);
      ctx.lineTo(engineX - 20, engineY - engineH / 2);
      ctx.stroke();

      // Engine / Generator Block
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(engineX - engineW / 2, engineY - engineH / 2, engineW, engineH, 8);
      ctx.fill();
      ctx.stroke();

      // Combustion Flame / Piston chamber inside engine
      const flameHeight = 16 + Math.sin(time * 12) * 6;
      const flameGrad = ctx.createLinearGradient(
        engineX - 20,
        engineY + 10,
        engineX - 20,
        engineY - flameHeight
      );
      flameGrad.addColorStop(0, '#f97316');
      flameGrad.addColorStop(0.6, '#fbbf24');
      flameGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(engineX - 20, engineY + 4, 14, 0, Math.PI * 2);
      ctx.fill();

      // Generator alternator spinning coil
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(engineX + 22, engineY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GEN', engineX + 22, engineY + 3);
      ctx.textAlign = 'left';

      // --- 5. PATHWAY A: ELECTRICAL POWER TO GRID ---
      const gridX = w * 0.90;
      const gridY = engineY;

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(engineX + engineW / 2, engineY);
      ctx.lineTo(gridX, gridY);
      ctx.stroke();

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(engineX + engineW / 2, engineY);
      ctx.lineTo(gridX, gridY);
      ctx.stroke();

      // Flowing power electrons
      powerElectrons.forEach((el) => {
        if (isPlaying) {
          el.progress = (el.progress + el.speed) % 1;
        }
        const currX = (engineX + engineW / 2) + (gridX - (engineX + engineW / 2)) * el.progress;
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(currX, gridY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Grid pill
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(gridX, gridY - 20, 52, 40, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('POWER GRID', gridX + 26, gridY - 3);
      ctx.fillStyle = '#34d399';
      ctx.fillText(`${electricalPowerKW} kW`, gridX + 26, gridY + 12);
      ctx.textAlign = 'left';

      // --- 6. PATHWAY B: SECONDARY CHP HEAT RECOVERY ---
      const chpPipeStartY = engineY + engineH / 2;
      const chpDistrictX = w * 0.78;
      const chpDistrictY = h * 0.78;

      // Insulated thermal heat pipe
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(engineX, chpPipeStartY);
      ctx.lineTo(engineX, chpDistrictY);
      ctx.lineTo(chpDistrictX, chpDistrictY);
      ctx.stroke();

      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(engineX, chpPipeStartY);
      ctx.lineTo(engineX, chpDistrictY);
      ctx.lineTo(chpDistrictX, chpDistrictY);
      ctx.stroke();

      // Flowing thermal heat particles (Amber/Red)
      heatParticles.forEach((hp) => {
        if (isPlaying) {
          hp.progress = (hp.progress + hp.speed) % 1;
        }
        // Segment 1 (down) or Segment 2 (right)
        const totalLen = (chpDistrictY - chpPipeStartY) + (chpDistrictX - engineX);
        const dist = totalLen * hp.progress;
        let px, py;
        if (dist < (chpDistrictY - chpPipeStartY)) {
          px = engineX;
          py = chpPipeStartY + dist;
        } else {
          px = engineX + (dist - (chpDistrictY - chpPipeStartY));
          py = chpDistrictY;
        }
        ctx.fillStyle = '#fca5a5';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // District Heating Exchanger Station
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(chpDistrictX, chpDistrictY - 18, 64, 36, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DISTRICT HEAT', chpDistrictX + 32, chpDistrictY - 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`+${thermalPowerKW} kW CHP`, chpDistrictX + 32, chpDistrictY + 11);
      ctx.textAlign = 'left';

      // --- 7. CONTEXTUAL ENGINEERING LABELS ---
      // Feedstock Input
      drawEngineeringPill(ctx, hopperX, hopperY - 22, `Feedstock: ${inputKg} kg/day (${moisture}% H₂O)`, '#a16207');

      // Gasifier LHV & Syngas
      drawEngineeringPill(ctx, gasifierX - 45, gasifierY - gasH / 2 - 38, `Syngas: ${syngasYieldM3} m³/day @ ${effectiveLHV} kWh/kg`, '#10b981');

      // Generator Output
      drawEngineeringPill(ctx, engineX - 35, engineY - engineH / 2 - 20, `CHP Engine: η_elec=${conversionEfficiency}%`, '#34d399');

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
        `GOVERNING LAW: E_total = Mass(${inputKg} kg) × Net_LHV(${effectiveLHV} kWh/kg) → ${electricalPowerKW} kW Electricity + ${thermalPowerKW} kW Useful Bio-Heat (~72% Total CHP Yield)`,
        24,
        h - 18
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [inputKg, conversionEfficiency, feedstockKey, moisture, isPlaying, electricalPowerKW, thermalPowerKW, effectiveLHV, syngasYieldM3]);

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
