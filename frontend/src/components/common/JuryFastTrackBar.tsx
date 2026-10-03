import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  FileSpreadsheet,
  Building2,
  Accessibility,
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { useAccessibility } from '../../store/useAccessibilityStore';
import { RoadmapModal } from './RoadmapModal';

export const JuryFastTrackBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { etrMode, toggleEtrMode, contrastMode, toggleHighContrast } = useAccessibility();
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
      title: 'Canwa & AI Auto-Fill',
      subtitle: 'Groq API ~1s (9 pól)',
      path: '/kreator-pomyslow',
      icon: Sparkles,
      color: 'hover:border-purple-400'
    },
    {
      id: 'step4',
      num: '4',
      title: 'WCAG 2.1 AA & ETR',
      subtitle: etrMode ? 'Tryb ETR: Włączony' : 'Testuj Tekst Łatwy (ETR)',
      isAction: true,
      action: () => toggleEtrMode(),
      icon: Accessibility,
      color: 'hover:border-emerald-400'
    },
    {
      id: 'step5',
      num: '5',
      title: 'Radar Dyrektora ROPS',
      subtitle: 'Trendy w 22 Powiatach',
      path: '/admin',
      icon: Activity,
      color: 'hover:border-red-400'
    }
  ];

  return (
    <>
      <aside aria-label="Szybka prezentacja dla Jury" className="bg-slate-950 text-white border-b-2 border-amber-500 shadow-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {/* Belka tytułowa z przełącznikiem zwijania */}
          <div className="flex items-center justify-between">
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
                onClick={() => setIsRoadmapOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Roadmapa & TCO 2026-2027</span>
                <span className="sm:hidden">Roadmapa</span>
              </button>

              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title={collapsed ? 'Rozwiń pasek szybkiej ścieżki' : 'Zwiń pasek szybkiej ścieżki'}
              >
                {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Siatka 5 kroków demonstracyjnych */}
          {!collapsed && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2 pt-2 border-t border-slate-800">
              {steps.map((s) => {
                const Icon = s.icon;
                const isActive = s.path ? location.pathname === s.path.split('?')[0] : false;

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (s.isAction && s.action) {
                        s.action();
                      } else if (s.path) {
                        navigate(s.path);
                      }
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all group ${
                      isActive
                        ? 'bg-slate-800 border-amber-400 shadow-inner'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/90'
                    } ${s.color}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-amber-400 group-hover:text-amber-300 flex items-center justify-center text-xs font-black text-amber-400 transition-colors">
                      {s.num}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300" />
                        <span>{s.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
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

      {/* Modal Roadmapy & Architektury Skalowania */}
      <RoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
    </>
  );
};
