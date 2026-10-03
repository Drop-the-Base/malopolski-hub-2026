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
    { to: '/matchmaking', label: etrMode ? 'Znajdź pomoc' : 'Znajdź rozwiązanie', icon: Sparkles, highlight: true },
    { to: '/problemy', label: etrMode ? 'Zgłoś problem' : 'Rejestr wyzwań', icon: AlertCircle },
    { to: '/baza-wiedzy', label: etrMode ? 'Lista pomysłów' : 'Baza innowacji', icon: Compass },
    { to: '/kreator-pomyslow', label: etrMode ? 'Dodaj pomysł' : 'Kreator pomysłów', icon: Lightbulb },
    { to: '/middleman', label: etrMode ? 'Dla gminy' : 'Middleman dla gmin', icon: Building2 },
    { to: '/tester', label: etrMode ? 'Testuj rzeczy' : 'Tester', icon: FlaskConical },
    { to: '/dialog', label: etrMode ? 'Rozmowa i pomoc' : 'Dialog i mentorzy', icon: Users },
    { to: '/admin', label: etrMode ? 'Dla urzędnika' : 'Panel ROPS', icon: ShieldCheck }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-[72px]">
          {/* Znak: prostokąt w barwie regionu z żółtą belką (jak favicon) */}
          <Link to="/" className="flex items-center gap-3 rounded p-1 -m-1 shrink-0">
            <span className="relative w-10 h-10 rounded bg-blue-600 text-white font-extrabold text-base flex items-start justify-center pt-1.5" aria-hidden="true">
              MH
              <span className="absolute left-1.5 right-1.5 bottom-1.5 h-1 bg-amber-400" />
            </span>
            <span className="leading-tight">
              <span className="block font-extrabold text-slate-900 text-[1.0625rem]">Małopolski Hub</span>
              <span className="block text-sm text-slate-600">
                Innowacji Społecznych <span className="text-slate-500">(prototyp)</span>
              </span>
            </span>
          </Link>

          {/* Linki nawigacyjne */}
          <nav className="hidden xl:block" aria-label="Nawigacja główna">
            <ul className="flex items-stretch">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative flex items-center gap-1.5 px-2 h-[72px] text-sm whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-slate-900 font-bold'
                          : link.highlight
                          ? 'text-blue-700 font-bold hover:text-blue-900'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 hidden 2xl:block" aria-hidden="true" />
                      <span>{link.label}</span>
                      {isActive && <span className="absolute left-2 right-2 bottom-0 h-1 bg-amber-400" aria-hidden="true" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Przycisk menu mobilnego */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="xl:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-slate-100"
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
        <nav id="mobile-nav" aria-label="Nawigacja główna (mobilna)" className="xl:hidden border-t border-slate-200 bg-white px-4 py-3">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2.5 px-3 py-3 border-l-4 text-base ${
                      isActive ? 'border-amber-400 bg-slate-50 font-bold text-slate-900' : 'border-transparent text-slate-800 hover:bg-slate-50'
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
