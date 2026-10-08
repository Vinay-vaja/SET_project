// InteractiveEcoSphere.jsx — Full-Width Photorealistic 3D Earth Digital Twin using Three.js
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Sun, Wind, Droplets, Leaf, Zap,
  RotateCcw, Compass, Layers, ZoomIn, ZoomOut, Maximize2, X
} from 'lucide-react';

// Global Clean Energy Nodes
const GLOBAL_ENERGY_NODES = [
  {
    id: 'solar-sahara',
    name: 'Helios Solar Mega-Field',
    type: 'solar',
    lat: 24.5,
    lon: 12.0,
    region: 'North Sahara Basin',
    output: '18.4 MW',
    efficiency: '97.2%',
    offset: '14.2 t CO₂/day',
    status: 'Optimal Direct Irradiance',
    color: '#F59E0B'
  },
  {
    id: 'wind-northsea',
    name: 'Boreas Offshore Wind Hub',
    type: 'wind',
    lat: 56.0,
    lon: 4.5,
    region: 'North Sea Cluster',
    output: '42.8 MW',
    efficiency: '94.6%',
    offset: '38.1 t CO₂/day',
    status: 'Sustained Gale-Force Stream',
    color: '#06B6D4'
  },
  {
    id: 'hydro-nordic',
    name: 'Fjord Cascade Hydro Station',
    type: 'hydro',
    lat: 61.2,
    lon: 7.8,
    region: 'Scandinavian Watershed',
    output: '26.0 MW',
    efficiency: '98.1%',
    offset: '22.4 t CO₂/day',
    status: 'Max Hydraulic Head Potential',
    color: '#3B82F6'
  },
  {
    id: 'bio-amazon',
    name: 'Amazonia Circular Bio-Refinery',
    type: 'biomass',
    lat: -3.4,
    lon: -62.2,
    region: 'Equatorial Carbon Sink',
    output: '12.5 MW',
    efficiency: '91.8%',
    offset: '16.9 t CO₂/day',
    status: 'Zero Net Carbon Closed-Loop',
    color: '#22C55E'
  },
  {
    id: 'solar-india',
    name: 'Thar Solar & Microgrid Park',
    type: 'solar',
    lat: 27.0,
    lon: 71.5,
    region: 'Rajasthan Desert Corridor',
    output: '34.2 MW',
    efficiency: '96.8%',
    offset: '29.5 t CO₂/day',
    status: 'Peak Irradiance Capture Active',
    color: '#EAB308'
  },
];

// Helper: Convert Lat/Lon to 3D Cartesian coordinates on sphere
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Procedural fallback realistic texture generator (100% offline & instant reliability)
function createProceduralEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Deep Ocean
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#041d38');
  oceanGrad.addColorStop(0.5, '#0a3663');
  oceanGrad.addColorStop(1, '#021226');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Realistic continent rough map generator
  ctx.fillStyle = '#15803d'; // Rich forest green
  const continents = [
    // Eurasia / Africa
    { x: 900, y: 350, rx: 360, ry: 200, color: '#166534' },
    { x: 1050, y: 550, rx: 180, ry: 240, color: '#15803d' }, // Africa
    { x: 1350, y: 320, rx: 280, ry: 160, color: '#14532d' }, // East Asia
    { x: 1220, y: 440, rx: 90, ry: 90, color: '#16a34a' },  // India
    // Americas
    { x: 420, y: 280, rx: 200, ry: 150, color: '#166534' },  // N. America
    { x: 550, y: 640, rx: 150, ry: 220, color: '#15803d' },  // S. America
    // Australia
    { x: 1580, y: 700, rx: 120, ry: 90, color: '#15803d' },
  ];

  continents.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();

    // Coastal shelf highlight
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 8;
    ctx.stroke();
  });

  return new THREE.CanvasTexture(canvas);
}

// Procedural Clouds Texture
function createProceduralCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cloud bands
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = 80 + Math.random() * (canvas.height - 160);
    const radiusX = 60 + Math.random() * 120;
    const radiusY = 20 + Math.random() * 40;

    const grad = ctx.createRadialGradient(x, y, 5, x, y, radiusX);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.5, 'rgba(240, 253, 250, 0.4)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, Math.random() * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

export default function InteractiveEcoSphere({ results, realData }) {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeLayer, setActiveLayer] = useState('all');
  const [activeBeacon, setActiveBeacon] = useState(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight || 540;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.8, 5.0);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    const fallbackEarthTex = createProceduralEarthTexture();
    const fallbackCloudTex = createProceduralCloudTexture();

    // 3. Earth Core Group
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = (23.4 * Math.PI) / 180; // Earth axial tilt
    scene.add(earthGroup);

    const earthRadius = 1.75;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);

    const earthMat = new THREE.MeshStandardMaterial({
      map: fallbackEarthTex,
      roughness: 0.65,
      metalness: 0.1,
    });

    // Try loading NASA Blue Marble textures
    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
      (tex) => {
        earthMat.map = tex;
        earthMat.needsUpdate = true;
      },
      undefined,
      () => { /* keep fallback */ }
    );

    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
      (specTex) => {
        earthMat.roughnessMap = specTex;
        earthMat.needsUpdate = true;
      }
    );

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // 4. Cloud Layer
    const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.018, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: fallbackCloudTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
      (cloudTex) => {
        cloudMat.map = cloudTex;
        cloudMat.needsUpdate = true;
      }
    );

    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(cloudMesh);

    // 5. Atmospheric Fresnel Glow Shader
    const atmoVertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmoFragmentShader = `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.6);
        gl_FragColor = vec4(0.12, 0.88, 0.58, 1.0) * intensity * 1.7;
      }
    `;

    const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.16, 48, 48);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: atmoVertexShader,
      fragmentShader: atmoFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // 6. Orbital Clean Energy Ring
    const ringGeo = new THREE.RingGeometry(earthRadius * 1.45, earthRadius * 1.47, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    scene.add(ringMesh);

    // Satellite Mesh orbiting on the ring
    const satGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const satMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const satMesh = new THREE.Mesh(satGeo, satMat);
    scene.add(satMesh);

    // 7. Interactive Renewable Energy Beacons (Nodes)
    const nodeMarkersGroup = new THREE.Group();
    earthGroup.add(nodeMarkersGroup);

    const clickableMarkers = [];

    GLOBAL_ENERGY_NODES.forEach((node) => {
      const pos = latLonToVector3(node.lat, node.lon, earthRadius * 1.01);

      // Core glowing point
      const markerGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(node.color) });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(pos);
      markerMesh.userData = { node };
      nodeMarkersGroup.add(markerMesh);
      clickableMarkers.push(markerMesh);

      // Radar Pulse Ring around beacon
      const pulseGeo = new THREE.RingGeometry(0.04, 0.09, 24);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.position.copy(pos);
      pulseMesh.lookAt(new THREE.Vector3(0, 0, 0));
      nodeMarkersGroup.add(pulseMesh);
    });

    // 8. Natural Lighting (Sunlight + Ambient Earthshine)
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(5, 3, 4);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0c2d48, 0.8);
    scene.add(ambientLight);

    // 9. Interactive Drag & Zoom Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      earthGroup.rotation.y += deltaX * 0.005;
      earthGroup.rotation.x = Math.max(-0.6, Math.min(0.6, earthGroup.rotation.x + deltaY * 0.005));

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e) => {
      isDragging = false;
      // Raycast to check if a node was clicked
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableMarkers);
      if (intersects.length > 0) {
        const clickedNode = intersects[0].object.userData.node;
        setActiveBeacon(clickedNode);
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(3.2, Math.min(7.5, camera.position.z + e.deltaY * 0.003));
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 10. Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Earth & Cloud Rotation
      if (autoRotate && !isDragging) {
        earthGroup.rotation.y += delta * 0.08;
      }
      cloudMesh.rotation.y += delta * 0.095;

      // Satellite Orbit
      const orbitSpeed = elapsedTime * 0.75;
      satMesh.position.x = Math.cos(orbitSpeed) * (earthRadius * 1.46);
      satMesh.position.z = Math.sin(orbitSpeed) * (earthRadius * 1.46) * Math.cos(Math.PI / 2.3);
      satMesh.position.y = Math.sin(orbitSpeed) * (earthRadius * 1.46) * Math.sin(Math.PI / 2.3);

      // Layer Visibility Controls
      cloudMesh.visible = activeLayer === 'all' || activeLayer === 'atmosphere' || activeLayer === 'canopy';
      nodeMarkersGroup.visible = activeLayer === 'all' || activeLayer === 'energy';
      atmoMesh.visible = activeLayer === 'all' || activeLayer === 'atmosphere';

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [autoRotate, activeLayer]);

  const handleZoom = (direction) => {
    if (!cameraRef.current) return;
    const step = direction === 'in' ? -0.5 : 0.5;
    cameraRef.current.position.z = Math.max(3.2, Math.min(7.5, cameraRef.current.position.z + step));
  };

  return (
    <div className="ecosphere-panel-container">
      {/* Top Header Controls Bar */}
      <div className="ecosphere-header">
        <div className="ecosphere-title-box">
          <div className="ecosphere-pulse-icon">
            <Globe size={20} color="#22c55e" className="spin-slow" />
          </div>
          <div>
            <div className="ecosphere-title-row">
              <h3 className="ecosphere-title">Planetary Eco-Sphere Digital Twin</h3>
              <span className="badge-biosphere">
                <span className="live-dot-green" /> LIVE 3D BIOSPHERE
              </span>
            </div>
            <p className="ecosphere-subtitle">
              Photorealistic Three.js Earth with dynamic atmosphere, cloud layers &amp; clean energy telemetry
            </p>
          </div>
        </div>

        {/* Layer Filter Toggles */}
        <div className="ecosphere-layer-controls">
          <button
            className={`ecosphere-layer-btn ${activeLayer === 'all' ? 'active' : ''}`}
            onClick={() => setActiveLayer('all')}
          >
            <Layers size={13} /> All Telemetry
          </button>
          <button
            className={`ecosphere-layer-btn ${activeLayer === 'energy' ? 'active' : ''}`}
            onClick={() => setActiveLayer('energy')}
          >
            <Zap size={13} color="#f59e0b" /> Clean Nodes
          </button>
          <button
            className={`ecosphere-layer-btn ${activeLayer === 'atmosphere' ? 'active' : ''}`}
            onClick={() => setActiveLayer('atmosphere')}
          >
            <Wind size={13} color="#06b6d4" /> Atmospheric Flow
          </button>
          <button
            className={`ecosphere-layer-btn ${activeLayer === 'canopy' ? 'active' : ''}`}
            onClick={() => setActiveLayer('canopy')}
          >
            <Leaf size={13} color="#22c55e" /> Forest Canopy
          </button>
          <button
            className="ecosphere-icon-btn"
            title={autoRotate ? 'Pause Rotation' : 'Resume Auto Rotation'}
            onClick={() => setAutoRotate(!autoRotate)}
          >
            <RotateCcw size={14} className={autoRotate ? 'spin-slow' : ''} />
          </button>
        </div>
      </div>

      {/* Full-Width Interactive 3D Earth Viewport */}
      <div
        className="ecosphere-viewport ecosphere-viewport-full"
        ref={mountRef}
        style={{ cursor: 'grab' }}
      >
        {/* Interactive Drag & Scroll Hint */}
        <div className="ecosphere-drag-hint">
          <Compass size={13} color="#38bdf8" />
          <span>Click &amp; Drag to Rotate • Scroll to Zoom 360°</span>
        </div>

        {/* Floating Quick Zoom & Reset HUD */}
        <div className="ecosphere-floating-zoom-hud">
          <button className="zoom-btn" onClick={() => handleZoom('in')} title="Zoom In">
            <ZoomIn size={15} />
          </button>
          <button className="zoom-btn" onClick={() => handleZoom('out')} title="Zoom Out">
            <ZoomOut size={15} />
          </button>
        </div>

        {/* Floating Planetary Health Stats (Minimal Pill) */}
        <div className="ecosphere-floating-health">
          <div className="health-ring-val">
            <span className="health-num">98.4%</span>
            <span className="health-sub">BIOSPHERE INTEGRITY</span>
          </div>
          <div className="health-pills">
            <span className="pill-item">🍃 Carbon Neutrality Active</span>
            <span className="pill-item">⚡ 100% Green Microgrid</span>
          </div>
        </div>

        {/* Interactive Node Beacon Inspection Popup Modal */}
        <AnimatePresence>
          {activeBeacon && (
            <motion.div
              className="ecosphere-beacon-popup"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
            >
              <div className="beacon-popup-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="node-badge-icon" style={{ background: `${activeBeacon.color}25`, color: activeBeacon.color }}>
                    {activeBeacon.type === 'solar' && <Sun size={14} />}
                    {activeBeacon.type === 'wind' && <Wind size={14} />}
                    {activeBeacon.type === 'hydro' && <Droplets size={14} />}
                    {activeBeacon.type === 'biomass' && <Leaf size={14} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{activeBeacon.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{activeBeacon.region}</div>
                  </div>
                </div>
                <button className="close-popup-btn" onClick={() => setActiveBeacon(null)}>
                  <X size={14} />
                </button>
              </div>

              <div className="beacon-popup-grid">
                <div>
                  <span className="metric-label">Live Output</span>
                  <span className="metric-val" style={{ color: activeBeacon.color, fontSize: '0.95rem', fontWeight: 800 }}>
                    {activeBeacon.output}
                  </span>
                </div>
                <div>
                  <span className="metric-label">Efficiency</span>
                  <span className="metric-val">{activeBeacon.efficiency}</span>
                </div>
                <div>
                  <span className="metric-label">CO₂ Offset</span>
                  <span className="metric-val" style={{ color: '#22c55e' }}>{activeBeacon.offset}</span>
                </div>
                <div>
                  <span className="metric-label">Operating Status</span>
                  <span className="metric-val" style={{ color: '#38bdf8' }}>{activeBeacon.status}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
