import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  Lightbulb,
  Building2,
  Users,
  ShieldCheck,
  FlaskConical,
  AlertCircle
} from 'lucide-react';
import { useAccessibility } from '../../store/useAccessibilityStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { etrMode } = useAccessibility();

  const navLinks = [
    {
      to: '/matchmaking',
      label: etrMode ? 'Znajdź pomoc' : 'Kojarzenie potrzeb (RAG)',
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
      label: etrMode ? 'Dla Gminy' : 'Middleman JST (Asystent AI)',
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
      label: etrMode ? 'Dla Urzędnika' : 'Panel ROPS',
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
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">ROPS Kraków</span>
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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : link.highlight
                      ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 font-semibold border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : link.highlight ? 'text-amber-600' : 'text-slate-400'}`} aria-hidden="true" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full ml-1">
                      JST
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {/* Pasek mobilnej nawigacji */}
      <div className="lg:hidden border-t border-slate-100 px-4 py-2 flex overflow-x-auto gap-2 text-xs scrollbar-none bg-slate-50">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full font-medium ${
              location.pathname === link.to ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
};
