# GreenPulse — Sustainable Energy Transition (SET) Platform

> **An industrial-grade, physics-accurate Renewable Energy Simulation, 3D Digital Twin, and AI Voice Studio built to accelerate the United Nations Sustainable Development Goal 7 (SDG 7: Affordable and Clean Energy).**

---

## 🧭 System Architecture & Energy Flow

```mermaid
flowchart TD
    subgraph "1. Renewable Generation Assets"
        SOLAR["☀️ Solar Photovoltaic Farm<br/>Crystalline Silicon PV Cells & Inverters"]
        WIND["💨 Wind Turbine Array<br/>Aerodynamic Airfoil Rotors & Pitch Control"]
        HYDRO["💧 Hydroelectric Power Station<br/>Reservoir, Penstock & Francis Water Turbine"]
        BIO["🌿 Biomass & Waste Cogeneration<br/>Anaerobic Digester & CHP Turbine"]
    end

    subgraph "2. Central Energy Management System (EMS)"
        EMS["⚡ Microgrid Central EMS Bus<br/>50.0 Hz Frequency & Voltage Synchronization"]
        BESS["🔋 Containerized BESS Hub<br/>Megapack Lithium-Ion Storage (SoC Tracking)"]
    end

    subgraph "3. Consumer Demand & Macro-Grid"
        DEMAND["🏡 Consumer Demand Load<br/>Residential, Commercial & Industrial Loads"]
        GRID["🏢 Utility Macro-Grid<br/>Deficit Backup Import & Green Surplus Export"]
    end

    SOLAR -->|Clean AC Power| EMS
    WIND -->|Clean AC Power| EMS
    HYDRO -->|Baseload AC Power| EMS
    BIO -->|Dispatchable AC + Heat| EMS

    EMS <-->|Charge Surplus / Discharge Buffer| BESS
    EMS -->|Direct Clean Power| DEMAND
    EMS <-->|Net Metering Import / Export| GRID
```

---

## 📖 What We Built & Why (Plain Language)

### The Problem
Most renewable energy simulators are static calculators or black-box spreadsheets. They show a number for "Solar" or "Wind", but never explain **how electricity actually gets generated**, **what physical laws apply**, or **where energy is lost**.

### Our Solution
**GreenPulse** transforms complex energy science into an intuitive, visual, and explainable experience:
- **Interactive Multi-Stage Physics**: Visualizes the exact mechanical, chemical, and electrical stages of 4 renewable sources.
- **Real-Time 3D Digital Twin**: Lets users inspect an industrial clean energy campus in 3D WebGL with live turbine rotations, day/night cycles, and camera presets.
- **AI-Powered Voice Studio**: Enables hands-free audio briefings narrated by two specialized AI personas (**Mitra** and **Miles**).
- **Eco-Obsidian Design System**: Replaces dull blue interfaces with high-contrast obsidian carbon (`#070b12`), frosted glass, and vibrant nature-coded accents.

---

## 🔬 Point-by-Point Feature Breakdown & Physical Conversion Flows

### 1. ☀️ Solar Photovoltaic (PV) Simulation Engine

```mermaid
flowchart LR
    S1["Stage 01<br/>Solar Irradiance Flux<br/>G in W/m² incident sunlight"] --> S2["Stage 02<br/>Photoelectric Excitation<br/>1.1 eV Silicon Bandgap Carrier Pairs"]
    S2 --> S3["Stage 03<br/>MPPT & Temp Derating<br/>-0.38%/°C Thermal Loss above 25°C"]
    S3 --> S4["Stage 04<br/>AC Inverter Sync<br/>Pure 50.0 Hz Sinusoidal AC Output"]
```

* **What It Is**: A simulation of crystalline silicon solar panel performance under changing sunlight and temperature conditions.
* **Why We Built It**: Real solar panels lose efficiency when they heat up, and solar output changes dynamically with angle and sunlight intensity.
* **How It Works (Step-by-Step)**:
  1. **Solar Irradiance ($G$)**: Sunlight hits panels with radiant energy ($200\text{--}1200\text{ W/m}^2$).
  2. **Photoelectric Carrier Excitation**: Photons with energy above $1.1\text{ eV}$ knock electrons free, creating Direct Current ($DC$).
  3. **MPPT & Thermal Derating**: Maximum Power Point Tracking optimizes voltage and current, while thermal loss derates power by $-0.38\%$ for every degree Celsius above $25^\circ\text{C}$ (Standard Test Conditions).
  4. **AC Inverter Grid Sync**: Pure sine-wave inverters convert filtered DC to synchronized $50\text{ Hz}$ Alternating Current ($AC$).
* **Governing Formula**:
  $$P(t) = \text{Capacity}_{\text{STC}} \times \left(\frac{G}{1000}\right) \times [1 - 0.0038 \times (T_{\text{cell}} - 25)] \times \eta_{\text{inv}}$$

---

### 2. 💨 Wind Aerodynamic Turbine Simulation Engine

```mermaid
flowchart LR
    W1["Stage 01<br/>Kinetic Wind Inflow<br/>Proportional to Air Velocity v³"] --> W2["Stage 02<br/>Rotor Aerodynamics<br/>Airfoil Lift (Betz Limit Cp ≤ 59.3%)"]
    W2 --> W3["Stage 03<br/>Gearbox Multiplier<br/>Steps 15 RPM Rotor to 1500 RPM Gen"]
    W3 --> W4["Stage 04<br/>Frequency Converter<br/>AC-DC-AC Grid Synchronization"]
```

* **What It Is**: An aerodynamic simulation of industrial wind turbines operating under varying atmospheric wind velocities.
* **Why We Built It**: Wind power does not scale linearly — power is proportional to the **cube of wind speed ($v^3$)**, and turbines must protect themselves in storms.
* **How It Works (Step-by-Step)**:
  1. **Kinetic Wind Inflow**: Moving air mass carries power proportional to $v^3$.
  2. **Rotor Lift & Betz Limit**: Airfoil blades generate lift and torque. Aerodynamic physics limits maximum capture to $59.3\%$ (Betz Limit).
  3. **Gearbox Multiplier**: Multiplies low rotor speed ($12\text{--}18\text{ RPM}$) up to $1500\text{ RPM}$ to drive the alternator.
  4. **AC-DC-AC Conversion**: Variable frequency AC is rectified to DC, then inverted to clean $50\text{ Hz}$ microgrid AC.
* **4 Operational Aerodynamic States**:
  - **Standby / Idle** ($< 3\text{ m/s}$): Below cut-in speed; insufficient torque to overcome friction.
  - **Active Generation** ($3\text{--}12\text{ m/s}$): Power scales cubicly; active yaw aligns with wind.
  - **Rated Full Generation** ($12\text{--}25\text{ m/s}$): Peak rated power maintained via pitch feathering.
  - **Emergency Storm Brake** ($> 25\text{ m/s}$): Mechanical disk brakes engaged to protect structural integrity.
* **Governing Formula**:
  $$P_{\text{wind}} = \frac{1}{2} \times \rho_{\text{air}} \times A_{\text{rotor}} \times v^3 \times C_p$$

---

### 3. 💧 Hydroelectric Power Station Simulation Engine

```mermaid
flowchart LR
    H1["Stage 01<br/>Reservoir Head Elevation<br/>H (meters) & Flow Q (L/s)"] --> H2["Stage 02<br/>Pressurized Penstock<br/>Fluid Pressure P = ρ·g·H (kPa)"]
    H2 --> H3["Stage 03<br/>Water Turbine Runner<br/>Francis Reaction / Pelton Wheel (82% Eff)"]
    H3 --> H4["Stage 04<br/>Synchronous Generator<br/>Continuous Zero-Carbon Baseload AC"]
```

* **What It Is**: A hydraulic simulation modeling water reservoir elevation, penstock fluid dynamics, and hydro turbine electricity generation.
* **Why We Built It**: Hydropower provides continuous, dispatchable zero-carbon baseload energy that stabilizes renewable microgrids.
* **How It Works (Step-by-Step)**:
  1. **Hydraulic Head ($H$) & Flow Rate ($Q$)**: Elevated water holds gravitational potential energy. Intake valves meter volumetric water flow.
  2. **Penstock Pressure Conduit**: Static head creates high column pressure ($P = \rho \cdot g \cdot H$) channeled down the penstock.
  3. **Turbine Runner**: High-velocity water jets impart momentum to Francis reaction or Pelton runner blades, converting fluid momentum to shaft torque.
  4. **Synchronous Generator**: Couples mechanical shaft rotation to a synchronous AC generator, supplying steady baseload electricity.
* **Governing Formula**:
  $$P_{\text{hydro}} = \eta_{\text{total}} \times \rho_{\text{water}} \times g \times Q \times H$$
  *(where $\rho = 1000\text{ kg/m}^3$, $g = 9.81\text{ m/s}^2$)*

---

### 4. 🌿 Biomass & Waste Cogeneration (CHP) Engine

```mermaid
flowchart LR
    B1["Stage 01<br/>Organic Feedstock Mass<br/>Crop Straw, Wood Pellets, Food Waste"] --> B2["Stage 02<br/>Thermochemical Gasification<br/>Syngas Yield derated for Moisture"]
    B2 --> B3["Stage 03<br/>Turbine Alternator<br/>Dispatchable Electrical Output"]
    B3 --> B4["Stage 04<br/>Thermal Recovery (CHP)<br/>+46% Recovered Useful Bio-Heat (~75% Total Eff)"]
```

* **What It Is**: A circular bioeconomy and thermal cogeneration model converting organic agricultural and municipal waste into electricity and clean heat.
* **Why We Built It**: Diverting organic waste avoids methane emissions from landfills while providing dispatchable Combined Heat & Power (CHP).
* **How It Works (Step-by-Step)**:
  1. **Feedstock Selection**: Selectable categories: **Agricultural Straw** ($4.2\text{ kWh/kg}$), **Wood Pellets** ($4.8\text{ kWh/kg}$), and **Municipal Organic Waste** ($2.6\text{ kWh/kg}$).
  2. **Moisture Derating**: The engine calculates Net Lower Heating Value ($LHV$) based on moisture content:
     $$LHV_{\text{net}} = LHV_{\text{dry}} \times (1 - \text{Moisture}) - 0.68 \times \text{Moisture}$$
  3. **Gasification & Combustion**: Thermochemical gasification ($850^\circ\text{C}$) produces syngas driving a turbine alternator.
  4. **Combined Heat & Power (CHP)**: Flue-gas heat exchangers recover $+46\%$ of thermal energy for community district heating, lifting overall system efficiency to over $72\%$.

---

### 5. 🎙️ AI-Powered Voice Studio & Copilot

```mermaid
flowchart TD
    EVENT["User Interaction or Simulation Telemetry"] --> VOICE_CTX["🎙️ Central Voice Context"]

    VOICE_CTX --> PERSONA_PICK{"Active Persona"}
    PERSONA_PICK -->|Mitra| MITRA["🌱 Mitra (Sustainability Advisor)<br/>Warm & Articulate • CO₂ Avoidance, SDG 7 Alignment, Clean Ratios"]
    PERSONA_PICK -->|Miles| MILES["⚡ Miles (Grid Operations Dispatcher)<br/>Crisp & Commanding • Active MW, Battery SoC Reserves, Substation Sync"]

    MITRA --> ROUTER{"Synthesis Engine Router"}
    MILES --> ROUTER

    ROUTER -->|API Key Configured| CLOUD["🧠 Primary Engine: Cloud AI Neural Synthesis<br/>Situational real-time telemetry analysis"]
    ROUTER -->|Fallback / Offline| BROWSER["🔊 Fallback Engine: Browser Native Speech<br/>100% Free, zero-latency, offline synthesis"]

    CLOUD --> AUDIO["🎧 Clear Audio Output (Full Uncut Sentences)"]
    BROWSER --> AUDIO
```

* **What It Is**: An intelligent audio debriefing studio featuring two specialized AI copilot personas.
* **Why We Built It**: Operators and students can listen to situational microgrid debriefs without taking their eyes off the 3D twin or charts.
* **Key Capabilities**:
  - **Mitra**: Focuses on ecological impact, carbon offset milestones, and UN SDG 7 scorecard progress.
  - **Miles**: Focuses on electrical engineering, generation megawatts, battery State of Charge, and dispatch loads.
  - **Fail-Safe Architecture**: Cloud AI neural synthesis as primary engine with automatic instant fallback to the browser's native speech synthesizer.
  - **Guaranteed Full Responses**: Generates complete thoughts and sentences without mid-sentence truncation.

---

### 6. 🌐 3-Way Interactive Simulator Cockpit

* **3D Digital Twin Viewport (Three.js)**:
  - Real-time 3D models for all assets: tilted solar tables, rotating wind turbines, hydroelectric penstock, biomass digester dome, and BESS storage with live LED status indicators.
  - Procedural road networks, realistic lighting (Daylight, Golden Hour Sunset, Night operations), and HTML5 Fullscreen mode.
  - 5 Instant Camera Presets: **Overview**, **Solar PV**, **Wind Farm**, **BESS Hub**, and **Hydro & Bio**.
* **2D Animated Energy Flow Schematic (GSAP)**:
  - Dynamic animated energy flow between generators, the Energy Management System (EMS), battery storage, and consumer demand.
  - **Click-to-Inspect**: Clicking any source node immediately opens that source's physics pipeline.
* **Physics Process Simulator (`GenerationProcessViewer`)**:
  - Deep-dive 4-stage pipeline with interactive sliders for solar irradiance, cell temp, wind speed, hydraulic head height, water flow rate, biomass feedstock type, and moisture content.

---

### 7. 🎨 The "Pristine Eco-Obsidian" Theme

* **Design Philosophy**: Replaced dull, muddy blue backgrounds with an ultra-clean **Eco-Obsidian Carbon & Frosted Glass** visual language:
  - **Background**: Deep carbon obsidian (`#070b12` / `#0c121d`) with zero blue glare.
  - **Surfaces**: Frosted glass panels (`rgba(11, 16, 26, 0.82)`) with crisp hairline borders (`rgba(255, 255, 255, 0.08)`).
  - **Nature-Coded Glowing Accents**:
    - ☀️ **Solar**: Luminous Golden Amber (`#f59e0b`)
    - 💨 **Wind**: Aero Kinetic Cyan (`#06b6d4`)
    - 💧 **Hydro**: Glacier Aquamarine (`#0ea5e9` / `#2dd4bf`)
    - 🌿 **Biomass**: Living Eco Emerald (`#10b981`)
    - 🔋 **Battery**: Neon Violet / Lime (`#8b5cf6` / `#22c55e`)
    - ⚡ **Grid**: High-Contrast Alert Coral (`#ef4444`)

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19 + Vite | Fast, modern client application architecture |
| **3D Graphics** | Three.js + WebGL | Interactive 3D Digital Twin campus and asset rendering |
| **Animation** | GSAP + Framer Motion | Smooth particle flows, stage transitions, and pipeline cards |
| **Calculations** | Modular Physics Engines | Real-world engineering calculations for Solar, Wind, Hydro, Biomass, and Battery |
| **Charts & Data** | Recharts + Lucide React | Clean, high-contrast analytics, radar charts, and iconography |
| **Styling** | Vanilla CSS Design System | Custom Eco-Obsidian design system tokens and glassmorphism |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
```bash
# 1. Clone repository
git clone https://github.com/Vinay-vaja/SET_project.git

# 2. Navigate to project root
cd SET_project

# 3. Install dependencies
npm install
```

### Environment Configuration (Optional)
Create a `.env` file in the root directory to configure cloud intelligence features:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```
*(If no API key is provided, GreenPulse automatically falls back to the native offline browser speech engine!)*

### Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production
```bash
npm run build
```

---

## 📁 Project Directory Structure

```
SET_Project/
├── public/                     # Static brand assets & vector logos
├── src/
│   ├── components/             # Reusable UI, 3D, and Visualization Components
│   │   ├── DigitalTwin3D.jsx           # 3D Industrial campus (Three.js WebGL)
│   │   ├── EnergyFlowDiagram.jsx       # 2D animated energy routing schematic (GSAP)
│   │   ├── GenerationProcessViewer.jsx # 4-stage physics conversion simulator
│   │   ├── VoiceAssistantWidget.jsx    # Mitra & Miles AI Voice Studio
│   │   ├── Navbar.jsx                  # Top navigation & system health badge
│   │   ├── KPICard.jsx                 # Live metrics and telemetry cards
│   │   └── SliderInput.jsx             # Physics parameter controls
│   ├── context/
│   │   ├── EnergyContext.jsx           # Central microgrid state & calculation dispatcher
│   │   └── VoiceContext.jsx            # Speech synthesis & persona management
│   ├── data/
│   │   └── energyConstants.js          # Physics constants, emission factors, defaults
│   ├── pages/
│   │   ├── Simulator.jsx               # Main simulation cockpit & viewport switcher
│   │   ├── Dashboard.jsx               # Executive KPI overview & metrics
│   │   ├── Compare.jsx                 # Multi-scenario configuration comparison
│   │   ├── SDGImpact.jsx               # UN SDG 7 scorecard & ESG indicators
│   │   ├── EnergyAudit.jsx             # Facility energy audit calculator
│   │   ├── WasteToEnergy.jsx           # Biomass and circular bioeconomy modeling
│   │   └── EmergingTech.jsx            # Hydrogen, micro-hydro, and wave technologies
│   ├── utils/                          # Calculation engines
│   │   ├── solarCalculations.js        # Irradiance, PV effect & temp derating
│   │   ├── windCalculations.js         # Betz limit, air density & turbine power curve
│   │   ├── hydroCalculations.js        # Hydraulic head, flow rate & Francis turbine
│   │   ├── biomassCalculations.js      # Feedstock LHV, moisture & CHP cogeneration
│   │   ├── batteryCalculations.js      # Round-trip efficiency & SoC limits
│   │   └── sdgScore.js                 # Multi-criteria SDG 7 scoring algorithm
│   ├── App.jsx                         # Application router & main layout
│   └── index.css                       # Eco-Obsidian design system & animations
├── package.json
└── vite.config.js
```

---

## 📄 License
This project is licensed under the MIT License — designed and built for the Sustainable Energy Transition (SET) initiative.
