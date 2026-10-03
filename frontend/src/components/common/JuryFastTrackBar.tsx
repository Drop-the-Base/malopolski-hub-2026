import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  // Domyślnie rozwinięty dla sędziów; użytkownik może go zwinąć
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mhis_jury_collapsed') === 'true';
    } catch {
      return false;
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Belka tytułowa z przełącznikiem zwijania */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span className="text-sm font-bold">Ścieżka dla jury</span>
            <span className="text-sm text-slate-300 hidden md:inline">
              cztery kroki, około minuty
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/presentation/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition"
              title="Otwórz 10-slajdową prezentację finałową dla sędziów"
            >
              <span>📊 Prezentacja (10 slajdów)</span>
            </a>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded text-slate-300 hover:text-white"
              title={collapsed ? 'Rozwiń pasek szybkiej ścieżki' : 'Zwiń pasek szybkiej ścieżki'}
              aria-label={collapsed ? 'Rozwiń pasek szybkiej ścieżki' : 'Zwiń pasek szybkiej ścieżki'}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Siatka 4 kluczowych kroków demonstracyjnych */}
        {!collapsed && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-700">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = location.pathname === s.path.split('?')[0];

              return (
                <button
                  key={s.id}
                  onClick={() => navigate(s.path)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-colors group overflow-hidden ${
                    isActive ? 'bg-slate-900 border-amber-400' : 'border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span className="w-6 h-6 rounded bg-amber-400 flex items-center justify-center text-sm font-extrabold text-slate-900 shrink-0">
                    {s.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
                      <span>{s.title}</span>
                    </div>
                    <div className="text-xs text-slate-300 truncate">
                      {s.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
