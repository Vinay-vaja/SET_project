import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EnergyProvider } from './context/EnergyContext.jsx';
import { VoiceProvider } from './context/VoiceContext.jsx';
import Navbar from './components/Navbar.jsx';
import VoiceAssistantWidget from './components/VoiceAssistantWidget.jsx';

// Pages
import Dashboard from './pages/Dashboard.jsx';
import Simulator from './pages/Simulator.jsx';
import EmergingTech from './pages/EmergingTech.jsx';
import WasteToEnergy from './pages/WasteToEnergy.jsx';
import EnergyAudit from './pages/EnergyAudit.jsx';
import Compare from './pages/Compare.jsx';
import SDGImpact from './pages/SDGImpact.jsx';
import About from './pages/About.jsx';

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="page-route-container"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/emerging-technologies" element={<EmergingTech />} />
          <Route path="/waste-to-energy" element={<WasteToEnergy />} />
          <Route path="/energy-audit" element={<EnergyAudit />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/sdg-impact" element={<SDGImpact />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <EnergyProvider>
        <VoiceProvider>
          <div className="app-shell full-width-shell">
            <Navbar />
            <main className="main-content-full">
              <AppRoutes />
            </main>
            <VoiceAssistantWidget />
          </div>
        </VoiceProvider>
      </EnergyProvider>
    </BrowserRouter>
  );
}
