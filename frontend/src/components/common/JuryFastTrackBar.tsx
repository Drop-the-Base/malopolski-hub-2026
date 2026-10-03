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
      title: 'Diagnoza Mieszkańca',
      subtitle: 'Kojarzenie AI (98%)',
      path: '/matchmaking?q=Mój+82-letni+dziadek+w+Limanowej+ma+trudności+z+wchodzeniem+do+wanny+i+potrzebuje+adaptacji+łazienki&powiat=limanowski',
      icon: Compass,
      color: 'hover:border-amber-400'
    },
    {
      id: 'step2',
      num: '2',
      title: 'Middleman dla JST',
      subtitle: 'Uchwała Rady & Blueprint',
      path: '/middleman?auto=1',
      icon: Building2,
      color: 'hover:border-blue-400'
    },
    {
      id: 'step3',
      num: '3',
      title: 'Canva & AI Auto-Fill',
      subtitle: 'Groq API ~ 1s (9 pól)',
      path: '/kreator-pomyslow',
      icon: Sparkles,
      color: 'hover:border-purple-400'
    },
    {
      id: 'step4',
      num: '4',
      title: 'Radar Dyrektora ROPS',
      subtitle: 'Trendy w 22 Powiatach',
      path: '/admin',
      icon: Activity,
      color: 'hover:border-red-400'
    }
  ];

  return (
    <aside aria-label="Szybka prezentacja dla Jury" className="bg-slate-950 text-white border-b-2 border-amber-500 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Belka tytułowa z przełącznikiem zwijania */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow">
              <Zap className="w-3 h-3 fill-slate-950" />
              Jury Fast-Track (1 Minuta)
            </span>
            <span className="text-xs text-slate-300 hidden md:inline">
              Szybka ścieżka demonstracyjna dla sędziów HackYeah 2026:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 text-slate-300 hover:text-white transition-colors"
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = location.pathname === s.path.split('?')[0];

              return (
                <button
                  key={s.id}
                  onClick={() => navigate(s.path)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all group overflow-hidden ${
                    isActive
                      ? 'bg-slate-800 border-amber-400/70 shadow-inner'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/90'
                  } ${s.color}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-amber-400 group-hover:text-amber-300 flex items-center justify-center text-xs font-black text-amber-400 transition-colors">
                    {s.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                      <Icon className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-300" aria-hidden="true" />
                      <span>{s.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
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
