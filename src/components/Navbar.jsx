// Navbar.jsx — Futuristic Full-Width Top Navigation Bar for GreenPulse
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Zap, Cpu, Trash2, ClipboardCheck,
  GitCompare, Info, Menu, X
} from 'lucide-react';

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/simulator', label: 'Simulator', icon: Zap, badge: '3D Twin' },
  { path: '/emerging-technologies', label: 'Emerging Tech', icon: Cpu },
  { path: '/waste-to-energy', label: 'Waste → Energy', icon: Trash2 },
  { path: '/energy-audit', label: 'Energy Audit', icon: ClipboardCheck },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/about', label: 'About', icon: Info },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="top-navbar-root">
      <div className="top-navbar-inner">
        {/* BRAND / LOGO */}
        <NavLink to="/" className="navbar-brand" title="GreenPulse — Sustainable Energy Platform">
          <img
            src="/logo.png"
            alt="GreenPulse Logo"
            className="navbar-brand-logo-img"
          />
        </NavLink>

        {/* DESKTOP NAV TABS */}
        <nav className="desktop-nav-tabs">
          {NAV_ITEMS.map(({ path, label, icon: Icon, exact, badge }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) =>
                `top-nav-tab ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} className="nav-tab-icon" />
              <span className="nav-tab-text">{label}</span>
              {badge && (
                <span className="nav-tab-badge">{badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* RIGHT TELEMETRY & ACTIONS */}
        <div className="navbar-right-section">
          {/* Live Simulator Status */}
          <div className="live-status-pill" title="Real-time simulation engine active">
            <span className="live-pulsing-dot" />
            <span className="live-status-text">Engine Online</span>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-nav-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mobile-nav-grid">
              {NAV_ITEMS.map(({ path, label, icon: Icon, exact, badge }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={exact}
                  className={({ isActive }) =>
                    `mobile-nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="mobile-nav-icon-wrap">
                    <Icon size={18} />
                  </div>
                  <div className="mobile-nav-text-wrap">
                    <span className="mobile-nav-label">{label}</span>
                    {badge && <span className="mobile-nav-badge">{badge}</span>}
                  </div>
                </NavLink>
              ))}
            </div>

            <div className="mobile-nav-footer">
              <div className="mobile-gtu-credit">
                GTU Engineering PBL • Sustainable Energy Technology
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
