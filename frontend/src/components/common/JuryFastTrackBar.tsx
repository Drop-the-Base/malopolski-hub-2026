import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Building2,
  Accessibility,
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { useAccessibility } from '../../store/useAccessibilityStore';
import { RoadmapModal } from './RoadmapModal';

export const JuryFastTrackBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { etrMode, toggleEtrMode } = useAccessibility();
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  // Domyślnie zwinięty, żeby nie zasłaniał treści; wybór zapamiętywany w przeglądarce
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mhis_jury_collapsed') !== 'false';
    } catch {
      return true;
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

  // Stan Auto-Touru
  const [isAutoTourRunning, setIsAutoTourRunning] = useState(false);
  const [autoTourStep, setAutoTourStep] = useState(0);
  const [secondsLeftInStep, setSecondsLeftInStep] = useState(12);
  const tourIntervalRef = useRef<any>(null);

  const steps = [
    {
      id: 'step1',
      num: '1',
      title: 'Diagnoza Mieszkańca',
      subtitle: 'Kojarzenie potrzeb z innowacjami',
      path: '/matchmaking?q=Mój+82-letni+dziadek+w+Limanowej+ma+trudności+z+wchodzeniem+do+wanny+i+potrzebuje+adaptacji+łazienki&powiat=limanowski',
      icon: Compass,
      color: 'hover:border-amber-400'
    },
    {
      id: 'step2',
      num: '2',
      title: 'Middleman dla JST',
      subtitle: 'Projekt uchwały i kosztorys',
      path: '/middleman?auto=1',
      icon: Building2,
      color: 'hover:border-blue-400'
    },
    {
      id: 'step3',
      num: '3',
      title: 'Canwa & AI Auto-Fill',
      subtitle: 'Autouzupełnianie LLM (9 pól)',
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
      title: 'Panel ROPS',
      subtitle: 'Moderacja i trendy (logowanie)',
      path: '/admin',
      icon: Activity,
      color: 'hover:border-red-400'
    }
  ];

  // Obsługa Auto-Touru
  const executeStep = (index: number) => {
    const s = steps[index];
    if (s.isAction && s.action) {
      s.action();
    } else if (s.path) {
      navigate(s.path);
    }
  };

  const startAutoTour = () => {
    setCollapsed(false);
    setIsAutoTourRunning(true);
    setAutoTourStep(0);
    setSecondsLeftInStep(12);
    executeStep(0);
  };

  const pauseAutoTour = () => {
    setIsAutoTourRunning(false);
    clearInterval(tourIntervalRef.current);
  };

  const stopAutoTour = () => {
    setIsAutoTourRunning(false);
    setAutoTourStep(0);
    setSecondsLeftInStep(12);
    clearInterval(tourIntervalRef.current);
  };

  useEffect(() => {
    if (isAutoTourRunning) {
      tourIntervalRef.current = setInterval(() => {
        setSecondsLeftInStep((prev) => {
          if (prev <= 1) {
            // Przejdź do następnego kroku
            setAutoTourStep((curStep) => {
              const nextStep = curStep + 1;
              if (nextStep < steps.length) {
                executeStep(nextStep);
                return nextStep;
              } else {
                // Koniec touru -> pokaż modal z Roadmapą
                setIsAutoTourRunning(false);
                setIsRoadmapOpen(true);
                return 0;
              }
            });
            return 12;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(tourIntervalRef.current);
    }

    return () => clearInterval(tourIntervalRef.current);
  }, [isAutoTourRunning]);

  return (
    <>
      <aside aria-label="Szybka prezentacja dla Jury" className="bg-slate-950 text-white border-b-2 border-amber-500 shadow-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {/* Belka tytułowa z przełącznikiem zwijania i Auto-Tourem */}
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
              {/* Przycisk Auto-Touru */}
              {!isAutoTourRunning ? (
                <button
                  type="button"
                  onClick={startAutoTour}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3 py-1 rounded-lg text-xs shadow transition-all flex items-center gap-1.5"
                  title="Uruchom automatyczny 60-sekundowy pokaz hands-free"
                >
                  <Play className="w-3 h-3 fill-slate-950" />
                  <span>Auto-Tour (60s)</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400 px-2 py-0.5 rounded-lg text-xs">
                  <span className="text-amber-300 font-bold text-[11px] mr-1">
                    Krok {autoTourStep + 1}/5 ({secondsLeftInStep}s)
                  </span>
                  <button
                    type="button"
                    onClick={pauseAutoTour}
                    className="p-1 hover:text-amber-300 text-white"
                    title="Pauza"
                    aria-label="Wstrzymaj pokaz"
                  >
                    <Pause className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={stopAutoTour}
                    className="p-1 hover:text-red-400 text-white"
                    title="Zatrzymaj"
                    aria-label="Zatrzymaj pokaz"
                  >
                    <Square className="w-3 h-3" />
                  </button>
                </div>
              )}

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
                className="p-1 text-slate-300 hover:text-white transition-colors"
                title={collapsed ? 'Rozwiń pasek szybkiej ścieżki' : 'Zwiń pasek szybkiej ścieżki'}
                aria-label={collapsed ? 'Rozwiń pasek szybkiej ścieżki' : 'Zwiń pasek szybkiej ścieżki'}
                aria-expanded={!collapsed}
              >
                {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Siatka 5 kroków demonstracyjnych */}
          {!collapsed && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2 pt-2 border-t border-slate-800">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const isAutoActive = isAutoTourRunning && autoTourStep === idx;
                const isActive = s.path ? location.pathname === s.path.split('?')[0] : false;

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (isAutoTourRunning) pauseAutoTour();
                      executeStep(idx);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all group relative overflow-hidden ${
                      isAutoActive
                        ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                        : isActive
                        ? 'bg-slate-800 border-amber-400/70 shadow-inner'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/90'
                    } ${s.color}`}
                  >
                    {/* Wskaźnik postępu w kroku Auto-Tour */}
                    {isAutoActive && (
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-amber-400 transition-all duration-1000"
                        style={{ width: `${((12 - secondsLeftInStep) / 12) * 100}%` }}
                      />
                    )}

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

      {/* Modal Roadmapy & Architektury Skalowania */}
      <RoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
    </>
  );
};
