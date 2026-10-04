import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Building2,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap
} from 'lucide-react';

export const JuryFastTrackBar: React.FC = () => {
  const location = useLocation();
  // Domyślnie rozwinięty dla sędziów, ale zwinięty na niskich ekranach (laptop 1366×768, telefon),
  // żeby pole „Twoja sprawa” na stronie głównej było widoczne bez przewijania. Wybór użytkownika ma pierwszeństwo.
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mhis_jury_collapsed');
      if (saved !== null) return saved === 'true';
    } catch {
      /* ignoruj */
    }
    return typeof window !== 'undefined' && (window.innerHeight < 900 || window.innerWidth < 768);
  });

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    try {
      localStorage.setItem('mhis_jury_collapsed', String(value));
    } catch {
      /* ignoruj */
    }
  };

  const steps = [
    {
      id: 'step1',
      num: '1',
      title: 'Potrzeba mieszkańca',
      subtitle: 'Dopasowanie innowacji',
      path: '/matchmaking?q=Mój+82-letni+dziadek+w+Limanowej+ma+trudności+z+wchodzeniem+do+wanny+i+potrzebuje+adaptacji+łazienki&powiat=limanowski',
      icon: Compass,
    },
    {
      id: 'step2',
      num: '2',
      title: 'Wdrożenie w gminie',
      subtitle: 'Plan, kosztorys, uchwała',
      path: '/middleman?auto=1',
      icon: Building2,
    },
    {
      id: 'step3',
      num: '3',
      title: 'Nowy pomysł',
      subtitle: 'Canwa z autouzupełnianiem',
      path: '/kreator-pomyslow',
      icon: Sparkles,
    },
    {
      id: 'step4',
      num: '4',
      title: 'Panel ROPS',
      subtitle: 'Trendy w 22 powiatach',
      path: '/admin',
      icon: Activity,
    }
  ];

  return (
    <aside aria-label="Szybka prezentacja dla Jury" className="bg-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
        {/* Belka tytułowa = przełącznik zwijania (cały wiersz jest dużym celem dotyku) */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-controls="jury-steps"
          className="w-full flex items-center justify-between gap-2 py-0.5 rounded text-left"
        >
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span className="text-sm font-bold">Ścieżka dla jury</span>
            <span className="text-sm text-slate-300 hidden md:inline">cztery kroki, około minuty</span>
          </span>
          <span className="flex items-center gap-1 text-sm text-slate-300 hover:text-white">
            <span>{collapsed ? 'Pokaż' : 'Ukryj'}</span>
            {collapsed ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronUp className="w-4 h-4" aria-hidden="true" />}
          </span>
        </button>

        {/* Siatka 4 kluczowych kroków demonstracyjnych */}
        {!collapsed && (
          <div id="jury-steps" className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-700">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = location.pathname === s.path.split('?')[0];

              return (
                // Zwykłe linki (nie przyciski): da się je otworzyć w nowej karcie, czytnik ekranu ogłasza „link” i bieżący krok
                <Link
                  key={s.id}
                  to={s.path}
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-colors group ${
                    isActive ? 'bg-slate-900 border-amber-400' : 'border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span className="w-6 h-6 rounded bg-amber-400 flex items-center justify-center text-sm font-extrabold text-slate-900 shrink-0">
                    {s.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
                      <span>{s.title}</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      {s.subtitle}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
