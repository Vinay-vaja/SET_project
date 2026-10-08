# GreenPulse — Sustainable Energy Transition (SET) Platform

An interactive, industrial-grade Sustainable Energy Simulation and 3D Digital Twin Platform designed for renewable energy modeling, microgrid optimization, carbon offset analytics, and SDG alignment.

---

## 🌟 Key Features

- **Realistic 3D Digital Twin Viewport (Three.js)**:
  - Interactive multi-energy industrial park: Vestas-style aerodynamic wind turbines, monocrystalline bifacial solar array with dual-axis tilt tracking, Tesla-style Megapack BESS with real-time SoC LED bar, and hydroelectric penstock & generator house.
  - Procedural asphalt road network, terrain, dynamic shadows, and live turbine blade rotation linked to real-time wind speeds.
  - Realistic lighting presets (Daylight, Golden Hour Sunset, Night operations) and comprehensive HTML5 Fullscreen mode.
- **Top Eco-Modern Navigation**:
  - Glassmorphic eco-green header with custom branding, active route highlighting, system health status indicator, and responsive navigation.
- **Microgrid Energy Simulator**:
  - Dynamic simulation of solar, wind, biomass, and battery storage with configurable weather, demand profiles, and storage degradation calculations.
- **Financial & LCOE Analyzer**:
  - Levelized Cost of Electricity (LCOE), Net Present Value (NPV), Payback Period, and Internal Rate of Return (IRR) models.
- **Carbon Accounting & SDG Tracking**:
  - Metric tons of CO₂ avoided, equivalent trees planted, vehicle emissions offset, and sustainable energy KPIs.
- **AI Policy & Optimization Copilot**:
  - Intelligent scenario recommendations, curtailment mitigation, and tariff-arbitrage battery dispatch schedules.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6
- **3D Graphics & Simulation**: Three.js, Canvas WebGL
- **Styling**: Vanilla CSS, Glassmorphic Design System, Modern typography
- **Data & Charts**: Lucide React icons, Canvas-based visualizations

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Vinay-vaja/SET_project.git

# Navigate into the project directory
cd SET_project

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```

The application will start at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

---

## 📁 Project Structure

```
SET_Project/
├── public/                 # Static assets, branding, and favicons
│   ├── favicon.svg
│   ├── logo.png
│   └── logo-icon.png
├── src/
│   ├── components/         # Reusable UI & 3D Components
│   │   ├── DigitalTwin3D.jsx
│   │   ├── Navbar.jsx
│   │   ├── KPICard.jsx
│   │   └── AnimatedNumber.jsx
│   ├── pages/              # Platform route views
│   │   ├── Dashboard.jsx
│   │   ├── EnergySimulator.jsx
│   │   ├── FinancialLCOE.jsx
│   │   ├── CarbonOffset.jsx
│   │   └── AIPolicyAdvisor.jsx
│   ├── utils/              # Calculation engines & models
│   ├── App.jsx             # Main router and layout
│   ├── main.jsx            # React root
│   └── index.css           # Global design system & theme tokens
├── package.json
└── vite.config.js
```

---

## 📄 License

MIT License. Designed and developed for Sustainable Energy Transition (SET).
