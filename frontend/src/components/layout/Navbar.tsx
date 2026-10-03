import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  Lightbulb,
  Building2,
  Users,
  ShieldCheck,
  FlaskConical,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { useAccessibility } from '../../store/useAccessibilityStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { etrMode } = useAccessibility();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const navLinks = [
    {
      to: '/matchmaking',
      label: etrMode ? 'Znajdź pomoc' : 'Kojarzenie potrzeb',
      icon: Sparkles,
      highlight: true
    },
    {
      to: '/problemy',
      label: etrMode ? 'Zgłoś problem' : 'Rejestr Wyzwań JST',
      icon: AlertCircle,
      badge: 'NOWE'
    },
    {
      to: '/baza-wiedzy',
      label: etrMode ? 'Lista pomysłów' : 'Baza Innowacji i Mapa',
      icon: Compass
    },
    {
      to: '/kreator-pomyslow',
      label: etrMode ? 'Dodaj pomysł' : 'Kreator Pomysłów (Canwa)',
      icon: Lightbulb
    },
    {
      to: '/middleman',
      label: etrMode ? 'Dla Gminy' : 'Middleman JST',
      icon: Building2,
      badge: 'Dla Samorządów'
    },
    {
      to: '/tester',
      label: etrMode ? 'Testuj rzeczy' : 'Tester Innowacji',
      icon: FlaskConical
    },
    {
      to: '/dialog',
      label: etrMode ? 'Rozmowa i Pomoc' : 'Dialog i Mentorzy',
      icon: Users
    },
    {
      to: '/admin',
      label: etrMode ? 'Dla Urzędnika' : 'Dla Urzędnika (Panel ROPS)',
      icon: ShieldCheck
    }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo i Nazwa Hubu */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded p-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
              MH
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight group-hover:text-blue-700 transition-colors">
                Małopolski Hub
              </div>
              <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                <span>Innowacji Społecznych</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">prototyp</span>
              </div>
            </div>
          </Link>

          {/* Linki Nawigacyjne */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Nawigacja główna">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : link.highlight
                      ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 font-semibold border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : link.highlight ? 'text-amber-600' : 'text-slate-500'}`} aria-hidden="true" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] bg-blue-700 text-white font-bold px-1.5 py-0.5 rounded-full ml-1">
                      JST
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Przycisk menu mobilnego */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-100"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            <span>Menu</span>
          </button>
        </div>
      </div>
      {/* Menu mobilne */}
      {mobileOpen && (
        <nav id="mobile-nav" aria-label="Nawigacja główna (mobilna)" className="lg:hidden border-t border-slate-200 bg-white px-4 py-3">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
};
