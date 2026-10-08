// DigitalTwin3D.jsx — Industrial-Grade 3D Digital Twin Viewport for GreenPulse
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  Sun, Wind, Droplets, Battery, Maximize2, Minimize2,
  Play, Pause, RotateCcw, Layers, Sparkles, Volume2, VolumeX, Mic
} from 'lucide-react';
import { useVoice } from '../context/VoiceContext.jsx';

export default function DigitalTwin3D({ params, results }) {
  const mountRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePreset, setActivePreset] = useState('overview');
  const [timeOfDay, setTimeOfDay] = useState('day'); // 'day', 'sunset', 'night'
  const [isPlaying, setIsPlaying] = useState(true);
  const [voiceGuide, setVoiceGuide] = useState(false);

  const { speakAssetReport, personaInfo, isSpeaking, stopSpeaking } = useVoice();

  // Proper HTML5 Fullscreen toggle with fallback
  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    };

    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 60);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // References to keep animation loop synchronized with live inputs
  const sceneStateRef = useRef({
    windSpeed: params?.wind?.windSpeed || 8,
    numTurbines: params?.wind?.numTurbines || 3,
    solarCapacity: params?.solar?.capacity || 25,
    batterySoC: results?.batterySoC || 60,
    isPlaying: true,
    timeOfDay: 'day',
    controls: null,
    camera: null,
    scene: null,
    renderer: null,
    turbines: [],
    sunLight: null,
    hemiLight: null,
    skyDome: null,
    bessLED: null,
    beaconLights: [],
    particles: null,
  });

  // Sync state with props
  useEffect(() => {
    sceneStateRef.current.windSpeed = params?.wind?.windSpeed || 8;
    sceneStateRef.current.numTurbines = params?.wind?.numTurbines || 3;
    sceneStateRef.current.solarCapacity = params?.solar?.capacity || 25;
    sceneStateRef.current.batterySoC = results?.batterySoC || 60;
    sceneStateRef.current.isPlaying = isPlaying;
    sceneStateRef.current.timeOfDay = timeOfDay;
  }, [params, results, isPlaying, timeOfDay]);

  // Lighting & Atmospheric update for Day / Sunset / Night
  useEffect(() => {
    const s = sceneStateRef.current;
    if (!s.sunLight || !s.hemiLight || !s.scene) return;

    if (timeOfDay === 'day') {
      s.scene.background.setHex(0x0f172a);
      s.scene.fog.color.setHex(0x0f172a);
      s.scene.fog.density = 0.012;
      s.sunLight.color.setHex(0xfffaed);
      s.sunLight.intensity = 2.8;
      s.sunLight.position.set(30, 40, 25);
      s.hemiLight.color.setHex(0xc8e0f8);
      s.hemiLight.groundColor.setHex(0x283822);
      s.hemiLight.intensity = 1.2;
      if (s.skyDome) s.skyDome.material.color.setHex(0x1e293b);
    } else if (timeOfDay === 'sunset') {
      s.scene.background.setHex(0x2a1420);
      s.scene.fog.color.setHex(0x2a1420);
      s.scene.fog.density = 0.014;
      s.sunLight.color.setHex(0xff7733);
      s.sunLight.intensity = 3.2;
      s.sunLight.position.set(45, 12, 10);
      s.hemiLight.color.setHex(0xffaa77);
      s.hemiLight.groundColor.setHex(0x3a1e28);
      s.hemiLight.intensity = 1.0;
      if (s.skyDome) s.skyDome.material.color.setHex(0x40162a);
    } else {
      // Night
      s.scene.background.setHex(0x040812);
      s.scene.fog.color.setHex(0x040812);
      s.scene.fog.density = 0.015;
      s.sunLight.color.setHex(0x38bdf8);
      s.sunLight.intensity = 0.7;
      s.sunLight.position.set(-25, 35, -20);
      s.hemiLight.color.setHex(0x0f172a);
      s.hemiLight.groundColor.setHex(0x020617);
      s.hemiLight.intensity = 0.5;
      if (s.skyDome) s.skyDome.material.color.setHex(0x070c18);
    }
  }, [timeOfDay]);

  // Camera presets
  const applyCameraPreset = (preset, forceVoice = false) => {
    setActivePreset(preset);
    if (voiceGuide || forceVoice) {
      speakAssetReport(preset, results, params);
    }
    const camera = sceneStateRef.current.camera;
    const controls = sceneStateRef.current.controls;
    if (!camera || !controls) return;

    let targetCam = { x: 26, y: 15, z: 26 };
    let targetLook = { x: 0, y: 3, z: 0 };

    if (preset === 'overview') {
      targetCam = { x: 26, y: 15, z: 26 };
      targetLook = { x: 0, y: 3, z: 0 };
    } else if (preset === 'solar') {
      targetCam = { x: -16, y: 7, z: 12 };
      targetLook = { x: -11, y: 1.6, z: 3 };
    } else if (preset === 'wind') {
      targetCam = { x: 18, y: 14, z: -2 };
      targetLook = { x: 9, y: 8, z: -10 };
    } else if (preset === 'battery') {
      targetCam = { x: 8, y: 5, z: 8 };
      targetLook = { x: 2, y: 1.2, z: 2 };
    } else if (preset === 'hydro') {
      targetCam = { x: -18, y: 8, z: -6 };
      targetLook = { x: -14, y: 1.6, z: -11 };
    }

    const startCam = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const startLook = { x: controls.target.x, y: controls.target.y, z: controls.target.z };
    const startTime = performance.now();
    const duration = 850;

    const animateTransition = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      camera.position.x = startCam.x + (targetCam.x - startCam.x) * ease;
      camera.position.y = startCam.y + (targetCam.y - startCam.y) * ease;
      camera.position.z = startCam.z + (targetCam.z - startCam.z) * ease;

      controls.target.x = startLook.x + (targetLook.x - startLook.x) * ease;
      controls.target.y = startLook.y + (targetLook.y - startLook.y) * ease;
      controls.target.z = startLook.z + (targetLook.z - startLook.z) * ease;
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      }
    };
    requestAnimationFrame(animateTransition);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b12);
    scene.fog = new THREE.FogExp2(0x070b12, 0.012);
    sceneStateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.5,
      350
    );
    camera.position.set(26, 15, 26);
    sceneStateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    sceneStateRef.current.renderer = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Stay above ground
    controls.minDistance = 6;
    controls.maxDistance = 120;
    controls.target.set(0, 3, 0);
    sceneStateRef.current.controls = controls;

    // --- ATMOSPHERIC SKY DOME ---
    const skyGeo = new THREE.SphereGeometry(150, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x0a101d,
      side: THREE.BackSide,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);
    sceneStateRef.current.skyDome = skyDome;

    // --- LIGHTING ---
    const hemiLight = new THREE.HemisphereLight(0xc8e0f8, 0x283822, 1.2);
    hemiLight.position.set(0, 60, 0);
    scene.add(hemiLight);
    sceneStateRef.current.hemiLight = hemiLight;

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    sunLight.position.set(30, 40, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1.0;
    sunLight.shadow.camera.far = 150;
    const shadowSize = 35;
    sunLight.shadow.camera.left = -shadowSize;
    sunLight.shadow.camera.right = shadowSize;
    sunLight.shadow.camera.top = shadowSize;
    sunLight.shadow.camera.bottom = -shadowSize;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);
    sceneStateRef.current.sunLight = sunLight;

    // --- LANDSCAPED INDUSTRIAL CAMPUS TERRAIN ---
    // 1. Natural Grass & Terrain Base
    const terrainGeo = new THREE.CylinderGeometry(34, 36, 2, 64);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x1b2820, // Rich landscaped dark grass/earth
      roughness: 0.85,
      metalness: 0.1,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = -1;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // 2. Peripheral Security Ring / Kerb
    const kerbGeo = new THREE.RingGeometry(33.6, 34.2, 64);
    const kerbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const kerb = new THREE.Mesh(kerbGeo, kerbMat);
    kerb.rotation.x = -Math.PI / 2;
    kerb.position.y = 0.02;
    scene.add(kerb);

    // 3. Asphalt Service Roads connecting the plant
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2b323c, roughness: 0.9 });
    
    // Main spine road
    const spineRoad = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 42), roadMat);
    spineRoad.rotation.x = -Math.PI / 2;
    spineRoad.position.set(0, 0.03, 0);
    spineRoad.receiveShadow = true;
    scene.add(spineRoad);

    // Lateral road to wind farm
    const windRoad = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.2), roadMat);
    windRoad.rotation.x = -Math.PI / 2;
    windRoad.position.set(9, 0.035, -8);
    windRoad.receiveShadow = true;
    scene.add(windRoad);

    // Lateral road to solar farm
    const solarRoad = new THREE.Mesh(new THREE.PlaneGeometry(18, 3.2), roadMat);
    solarRoad.rotation.x = -Math.PI / 2;
    solarRoad.position.set(-8, 0.035, 4);
    solarRoad.receiveShadow = true;
    scene.add(solarRoad);

    // --- INDUSTRIAL CONCRETE PADS ---
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Reinforced concrete
      roughness: 0.7,
      metalness: 0.15,
    });

    // Wind farm pad
    const windPad = new THREE.Mesh(new THREE.BoxGeometry(18, 0.15, 16), padMat);
    windPad.position.set(10, 0.08, -10);
    windPad.receiveShadow = true;
    scene.add(windPad);

    // Solar farm pad
    const solarPad = new THREE.Mesh(new THREE.BoxGeometry(16, 0.15, 15), padMat);
    solarPad.position.set(-11, 0.08, 3);
    solarPad.receiveShadow = true;
    scene.add(solarPad);

    // BESS Substation pad
    const bessPad = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 9), padMat);
    bessPad.position.set(2, 0.1, 3);
    bessPad.receiveShadow = true;
    scene.add(bessPad);

    // --- 1. INDUSTRIAL-GRADE WIND TURBINES (Vestas V162 Architecture) ---
    const windTurbines = [];
    const beaconLights = [];

    const turbinePositions = [
      { x: 7, z: -8, scale: 1.0 },
      { x: 15, z: -5, scale: 0.95 },
      { x: 13, z: -14, scale: 0.9 },
      { x: 4, z: -14, scale: 0.8 },
    ];

    const towerMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Industrial Off-White
      roughness: 0.35,
      metalness: 0.25,
    });
    const nacelleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.3,
      metalness: 0.3,
    });
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
    });
    const spinnerMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant Industrial Blue spinner
      roughness: 0.25,
      metalness: 0.4,
    });

    turbinePositions.forEach((pos, idx) => {
      const turbineGroup = new THREE.Group();
      turbineGroup.position.set(pos.x, 0, pos.z);
      turbineGroup.scale.setScalar(pos.scale);

      // Octagonal foundation ring
      const basePlinth = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.6, 0.4, 16),
        padMat
      );
      basePlinth.position.y = 0.2;
      basePlinth.receiveShadow = true;
      turbineGroup.add(basePlinth);

      // Conical Tapered Steel Tubular Tower
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.65, 15, 32),
        towerMat
      );
      tower.position.y = 7.7;
      tower.castShadow = true;
      tower.receiveShadow = true;
      turbineGroup.add(tower);

      // Tower base door
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.7, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
      );
      door.position.set(0, 0.9, 0.62);
      turbineGroup.add(door);

      // Aerodynamic Nacelle (Streamlined housing with maintenance vents)
      const nacelleGroup = new THREE.Group();
      nacelleGroup.position.set(0, 15.2, 0);

      const nacelleBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.85, 2.4),
        nacelleMat
      );
      nacelleBody.castShadow = true;
      nacelleGroup.add(nacelleBody);

      // Rear cooling radiator
      const radiator = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.6, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
      );
      radiator.position.set(0, 0, -1.25);
      nacelleGroup.add(radiator);

      // Aviation Red Beacon Light (pulsing warning light)
      const beaconGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, 0.52, -0.6);
      nacelleGroup.add(beacon);
      beaconLights.push(beaconMat);

      // Rotor Assembly
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 0, 1.3);
      nacelleGroup.add(rotorGroup);

      // Streamlined Bullet Nosecone / Spinner
      const spinner = new THREE.Mesh(
        new THREE.ConeGeometry(0.42, 0.9, 24),
        spinnerMat
      );
      spinner.rotation.x = Math.PI / 2;
      rotorGroup.add(spinner);

      // 3 Aerodynamic Airfoil Blades with Realistic Chord & Taper
      for (let b = 0; b < 3; b++) {
        const bladeAssembly = new THREE.Group();
        bladeAssembly.rotation.z = (b * Math.PI * 2) / 3;

        // Blade root cylinder
        const root = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.14, 0.8, 16),
          bladeMat
        );
        root.position.y = 0.5;
        bladeAssembly.add(root);

        // Aerodynamic Main Blade Body (tapered)
        const bladeBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 5.2, 0.08),
          bladeMat
        );
        bladeBody.position.y = 3.2;
        bladeBody.rotation.y = 0.14; // Pitch angle
        bladeBody.castShadow = true;
        bladeAssembly.add(bladeBody);

        // Aviation Red Warning Stripes at the Tip
        const redTip = new THREE.Mesh(
          new THREE.BoxGeometry(0.33, 0.8, 0.09),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        redTip.position.y = 5.4;
        bladeAssembly.add(redTip);

        rotorGroup.add(bladeAssembly);
      }

      turbineGroup.add(nacelleGroup);
      scene.add(turbineGroup);
      windTurbines.push({ group: turbineGroup, rotor: rotorGroup, id: idx });
    });
    sceneStateRef.current.turbines = windTurbines;
    sceneStateRef.current.beaconLights = beaconLights;

    // --- 2. UTILITY-SCALE HIGH-SPECULAR SOLAR PV PARK ---
    const solarGroup = new THREE.Group();
    solarGroup.position.set(-11, 0, 3);
    scene.add(solarGroup);

    // Solar tracker torque-tube mounts
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Galvanized steel
      metalness: 0.85,
      roughness: 0.25,
    });
    // High-efficiency Monocrystalline Silicon Cell Material (glistening reflective surface)
    const pvCellMat = new THREE.MeshStandardMaterial({
      color: 0x071e3d, // Deep midnight solar blue
      metalness: 0.9,
      roughness: 0.08,
      emissive: 0x020d1c,
    });
    // Silver aluminum module frame
    const moduleBorderMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.9,
      roughness: 0.2,
    });

    const rows = 3;
    const cols = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const table = new THREE.Group();
        table.position.set((c - 1.5) * 3.4, 0, (r - 1) * 3.6);

        // Galvanized steel H-piles
        const postFront = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), frameMat);
        postFront.position.set(0, 0.4, 0.6);
        table.add(postFront);

        const postBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.08), frameMat);
        postBack.position.set(0, 0.7, -0.6);
        table.add(postBack);

        // Module chassis tilted at 28 degrees
        const rackGroup = new THREE.Group();
        rackGroup.position.set(0, 1.0, 0);
        rackGroup.rotation.x = 0.46; // ~26.5 deg tilt to the sun

        // Module frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.6), moduleBorderMat);
        frame.castShadow = true;
        frame.receiveShadow = true;
        rackGroup.add(frame);

        // Glass silicon PV cells on top
        const cells = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.02, 1.5), pvCellMat);
        cells.position.y = 0.035;
        cells.castShadow = true;
        cells.receiveShadow = true;
        rackGroup.add(cells);

        table.add(rackGroup);
        solarGroup.add(table);
      }
    }

    // Solar Central Inverter Station with ventilation
    const invStation = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.5, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.6 })
    );
    invStation.position.set(6.5, 0.75, 0);
    invStation.castShadow = true;
    solarGroup.add(invStation);

    // --- 3. CONTAINERIZED BESS HUB (Tesla Megapack Industrial Architecture) ---
    const bessGroup = new THREE.Group();
    bessGroup.position.set(2, 0, 3);
    scene.add(bessGroup);

    // Twin BESS Megapack Containers
    [-1.6, 1.6].forEach((xOffset, i) => {
      const container = new THREE.Group();
      container.position.set(xOffset, 0, 0);

      // Industrial container enclosure
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 2.2, 5.0),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.35 })
      );
      body.position.y = 1.1;
      body.castShadow = true;
      body.receiveShadow = true;
      container.add(body);

      // Ventilation louver panels on roof
      const vents = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.15, 4.2),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
      );
      vents.position.y = 2.25;
      container.add(vents);

      // Live LED Status Light Bar
      const ledGeo = new THREE.BoxGeometry(1.8, 0.08, 0.05);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, 1.8, 2.53);
      container.add(led);
      if (i === 0) sceneStateRef.current.bessLED = ledMat;

      bessGroup.add(container);
    });

    // Step-Up Substation Transformer
    const transformer = new THREE.Group();
    transformer.position.set(5.2, 0, 0);

    const txBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 2.0, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.7 })
    );
    txBody.position.y = 1.0;
    txBody.castShadow = true;
    transformer.add(txBody);

    // Ceramic High-Voltage Bushings (Terracotta insulators)
    const bushingMat = new THREE.MeshStandardMaterial({ color: 0xa04020, roughness: 0.3, metalness: 0.4 });
    [-0.5, 0, 0.5].forEach((bX) => {
      const bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 12), bushingMat);
      bushing.position.set(bX, 2.35, 0);
      transformer.add(bushing);
    });
    bessGroup.add(transformer);

    // Relocate Grid Transmission Tower to the BACKGROUND PERIMETER (Out of camera path!)
    const pylon = new THREE.Group();
    pylon.position.set(20, 0, 20); // Moved to corner edge!
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.3 });
    const pylonTower = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.4, 15, 8), pylonMat);
    pylonTower.position.y = 7.5;
    pylon.add(pylonTower);
    const arm1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.2, 0.2), pylonMat);
    arm1.position.y = 12.5;
    pylon.add(arm1);
    scene.add(pylon);

    // --- 4. HYDRO RESERVOIR & BIOMASS FACILITY ---
    const hydroGroup = new THREE.Group();
    hydroGroup.position.set(-14, 0, -11);
    scene.add(hydroGroup);

    // Concrete Dam Flume Basin
    const damWall = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 2.8, 5.5),
      padMat
    );
    damWall.position.y = 1.4;
    damWall.castShadow = true;
    hydroGroup.add(damWall);

    // Translucent Deep Cyan Water Surface with Refractive Gloss
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.05,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 5.0), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 2.75;
    hydroGroup.add(water);

    // High-Pressure Steel Penstock
    const penstock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 4.5, 20),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.25 })
    );
    penstock.rotation.z = Math.PI / 3;
    penstock.position.set(3.4, 1.4, 0);
    penstock.castShadow = true;
    hydroGroup.add(penstock);

    // Biomass Digester Dome with Pressure Relief Manifold
    const biomassGroup = new THREE.Group();
    biomassGroup.position.set(-4, 0, -14);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45, metalness: 0.3 })
    );
    dome.castShadow = true;
    biomassGroup.add(dome);
    scene.add(biomassGroup);

    // --- 5. HIGH-TECH TRANSMISSION ENERGY FLOW PARTICLES ---
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    const paths = [
      { start: new THREE.Vector3(-11, 1.2, 3), end: new THREE.Vector3(2, 1.2, 3) },
      { start: new THREE.Vector3(8, 1.2, -9), end: new THREE.Vector3(2, 1.2, 3) },
      { start: new THREE.Vector3(-14, 1.2, -11), end: new THREE.Vector3(2, 1.2, 3) },
      { start: new THREE.Vector3(2, 1.2, 3), end: new THREE.Vector3(20, 1.2, 20) },
    ];

    const particleProgress = new Float32Array(particleCount);
    const particlePathIndices = new Uint8Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePathIndices[i] = i % 4;
      particleProgress[i] = i / particleCount;
      const p = paths[particlePathIndices[i]];
      const pos = new THREE.Vector3().lerpVectors(p.start, p.end, particleProgress[i]);
      particlePositions[i * 3] = pos.x;
      particlePositions[i * 3 + 1] = pos.y + 0.6 + Math.sin(particleProgress[i] * Math.PI) * 1.5;
      particlePositions[i * 3 + 2] = pos.z;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x22c55e,
      size: 0.4,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);
    sceneStateRef.current.particles = {
      system: particleSystem,
      progress: particleProgress,
      pathIndices: particlePathIndices,
      paths,
    };

    // --- ANIMATION LOOP ---
    let animationFrameId;
    let lastTime = performance.now();

    const animate = (currentTime) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const state = sceneStateRef.current;
      if (state.isPlaying) {
        // 1. Dynamic Wind Turbine Rotation based on wind speed input
        const rotSpeed = Math.max(0.15, (state.windSpeed / 10) * 2.8);
        const visibleTurbines = Math.min(state.turbines.length, Math.max(1, state.numTurbines));

        state.turbines.forEach((t, i) => {
          t.group.visible = i < visibleTurbines;
          if (t.rotor && i < visibleTurbines) {
            t.rotor.rotation.z += rotSpeed * delta * (1 - i * 0.06);
          }
        });

        // 2. Pulse Aviation Red Beacons
        const beaconPulse = Math.sin(currentTime * 0.004) > 0.3 ? 1.0 : 0.2;
        state.beaconLights.forEach((bMat) => {
          bMat.color.setRGB(beaconPulse, 0.05, 0.05);
        });

        // 3. Power Flow Particles
        if (state.particles) {
          const positions = state.particles.system.geometry.attributes.position.array;
          const prog = state.particles.progress;
          const pSpeed = 0.3 + (state.windSpeed / 20) * 0.3;

          for (let i = 0; i < particleCount; i++) {
            prog[i] += delta * pSpeed;
            if (prog[i] > 1) prog[i] = 0;

            const path = state.particles.paths[state.particles.pathIndices[i]];
            const cur = new THREE.Vector3().lerpVectors(path.start, path.end, prog[i]);
            const arch = Math.sin(prog[i] * Math.PI) * 1.4;

            positions[i * 3] = cur.x;
            positions[i * 3 + 1] = cur.y + 0.5 + arch;
            positions[i * 3 + 2] = cur.z;
          }
          state.particles.system.geometry.attributes.position.needsUpdate = true;
        }

        // 4. Update BESS Battery LED indicator
        if (state.bessLED) {
          const soc = state.batterySoC;
          if (soc > 50) {
            state.bessLED.color.setHex(0x22c55e); // Green
          } else if (soc > 20) {
            state.bessLED.color.setHex(0xf59e0b); // Amber
          } else {
            state.bessLED.color.setHex(0xef4444); // Red
          }
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // --- RESIZE LISTENER ---
    const handleResize = () => {
      const el = wrapperRef.current || container;
      if (!el) return;
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`digital-twin-wrapper ${isFullscreen ? 'fullscreen-mode' : ''}`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              borderRadius: 0,
              overflow: 'hidden',
              background: '#040812',
              zIndex: 999999,
              boxShadow: 'none',
              border: 'none',
            }
          : {
              position: 'relative',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#0a0f1d',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
              width: '100%',
              height: 460,
              zIndex: 1,
              transition: 'all 0.3s ease',
            }
      }
    >
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* TOP HUD BAR */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Title badge */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '6px 14px',
            borderRadius: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em', color: '#fff', textTransform: 'uppercase' }}>
            3D Digital Twin Simulation
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 8 }}>
            Real-Time Telemetry
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ pointerEvents: 'auto', display: 'flex', gap: 6 }}>
          {/* Day / Sunset / Night Toggle */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 20,
              padding: 3,
              display: 'flex',
              gap: 2,
            }}
          >
            {[
              { id: 'day', label: '☀️ Day' },
              { id: 'sunset', label: '🌅 Sunset' },
              { id: 'night', label: '🌙 Night' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeOfDay(t.id)}
                style={{
                  background: timeOfDay === t.id ? '#22c55e' : 'transparent',
                  color: timeOfDay === t.id ? '#0f172a' : '#cbd5e1',
                  border: 'none',
                  borderRadius: 14,
                  padding: '4px 9px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Voice Guide Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextState = !voiceGuide;
              setVoiceGuide(nextState);
              if (nextState) {
                speakAssetReport(activePreset, results, params);
              } else {
                stopSpeaking();
              }
            }}
            style={{
              background: voiceGuide ? `${personaInfo.color}35` : 'rgba(15, 23, 42, 0.85)',
              border: voiceGuide ? `1px solid ${personaInfo.color}` : '1px solid rgba(255, 255, 255, 0.15)',
              color: voiceGuide ? personaInfo.color : '#cbd5e1',
              borderRadius: 20,
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.73rem',
              fontWeight: 600,
              boxShadow: voiceGuide ? `0 0 12px ${personaInfo.color}40` : 'none',
              transition: 'all 0.2s ease',
            }}
            title={`Toggle 3D Audio Guide narrated by ${personaInfo.name}`}
          >
            {voiceGuide ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>Voice Guide: {personaInfo.name}</span>
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              borderRadius: 20,
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.75rem',
            }}
            title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: isFullscreen ? 'rgba(34, 197, 94, 0.25)' : 'rgba(15, 23, 42, 0.85)',
              border: isFullscreen ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
              color: isFullscreen ? '#4ade80' : '#fff',
              borderRadius: 20,
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={13} /> Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 size={13} /> Fullscreen
              </>
            )}
          </button>
        </div>
      </div>

      {/* BOTTOM CAMERA PRESETS BAR */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          right: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {/* Preset View Switcher */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 24,
            padding: 4,
            display: 'flex',
            gap: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {[
            { id: 'overview', label: '🌐 Overview' },
            { id: 'solar', label: '☀️ Solar PV' },
            { id: 'wind', label: '💨 Wind Farm' },
            { id: 'battery', label: '🔋 BESS Hub' },
            { id: 'hydro', label: '💧 Hydro & Bio' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyCameraPreset(preset.id)}
              style={{
                background: activePreset === preset.id ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
                border: activePreset === preset.id ? '1px solid #22c55e' : '1px solid transparent',
                color: activePreset === preset.id ? '#4ade80' : '#94a3b8',
                borderRadius: 18,
                padding: '5px 12px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Live Floating Telemetry Chips */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            gap: 8,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 20,
            padding: '6px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#F59E0B' }}>
            <Sun size={13} />
            <span>{(results?.solarEnergy || 0).toFixed(1)} kWh</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#3B82F6' }}>
            <Wind size={13} />
            <span>{(results?.windEnergy || 0).toFixed(1)} kWh</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#8B5CF6' }}>
            <Battery size={13} />
            <span>{Math.round(results?.batterySoC || 60)}% SoC</span>
          </div>
        </div>
      </div>

      {/* Orbit Tip */}
      <div
        style={{
          position: 'absolute',
          top: 55,
          left: 18,
          pointerEvents: 'none',
          fontSize: '0.68rem',
          color: 'rgba(255,255,255,0.4)',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}
      >
        Left Click + Drag: Orbit • Scroll: Zoom • Right Click: Pan
      </div>
    </div>
  );
}
