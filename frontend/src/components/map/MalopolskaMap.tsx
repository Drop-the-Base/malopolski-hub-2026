import React, { useState } from 'react';
import { RegionalChallenge } from '../../types';
import { MapPin, Users, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAccessibility } from '../../store/useAccessibilityStore';

interface MapProps {
  challenges: RegionalChallenge[];
  onSelectPowiat?: (powiatName: string) => void;
}

export const MalopolskaMap: React.FC<MapProps> = ({ challenges, onSelectPowiat }) => {
  const [selectedPowiat, setSelectedPowiat] = useState<RegionalChallenge | null>(challenges[4] || null); // domyślnie gorlicki
  const { etrMode } = useAccessibility();

  const handleSelect = (item: RegionalChallenge) => {
    setSelectedPowiat(item);
    if (onSelectPowiat) {
      onSelectPowiat(item.powiat_name);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            {etrMode ? 'Mapa Małopolski – Gdzie pomagamy' : 'Kondycja Małopolski i Mapa Wyzwań Społecznych'}
          </h3>
          <p className="text-sm text-slate-500">
            {etrMode
              ? 'Wybierz swój powiat, aby zobaczyć, ilu ludzi tam mieszka i jakie są trudności.'
              : 'Wizualizacja diagnozy demograficznej i zapotrzebowania społecznego dla 22 powiatów regionu.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
            Wysoki odsetek seniorów (depopulacja)
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-600 ml-2">
            <span className="w-3 h-3 rounded-full bg-sky-400 inline-block"></span>
            Wzrost populacji (wianuszek)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kafelkowa Mapa Powiatów Małopolski */}
        <div className="lg:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Wybierz powiat z listy lub kliknij kafelek:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {challenges.map((c) => {
              const isSelected = selectedPowiat?.powiat_code === c.powiat_code;
              const isHighSenior = c.senior_share_pct > 25;
              const isGrowth = c.demographic_trend.includes('wzrost');

              return (
                <button
                  key={c.powiat_code}
                  onClick={() => handleSelect(c)}
                  className={`text-left p-2.5 rounded-lg border transition-all text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold border-blue-700 shadow-md scale-[1.02]'
                      : isHighSenior
                      ? 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
                      : isGrowth
                      ? 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="font-bold truncate">{c.powiat_name}</div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    Seniorzy: {c.senior_share_pct}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Szczegółów Wybranego Powiatu */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-xl shadow-lg">
          {selectedPowiat ? (
            <div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400">
                    Powiat Małopolski
                  </span>
                  <h4 className="text-2xl font-black">{selectedPowiat.powiat_name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Aktywne innowacje</span>
                  <div className="text-xl font-black text-emerald-400">{selectedPowiat.active_innovations_count}</div>
                </div>
              </div>

              {/* Metryki powiatu */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    Liczba ludności
                  </div>
                  <div className="text-base font-bold">{selectedPowiat.population.toLocaleString('pl-PL')}</div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    {selectedPowiat.demographic_trend.includes('wzrost') ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    Wskaźnik seniorów
                  </div>
                  <div className="text-base font-bold text-amber-400">{selectedPowiat.senior_share_pct}%</div>
                </div>
              </div>

              {/* Diagnoza społeczna */}
              <div className="bg-slate-800/90 p-4 rounded-lg border border-slate-700 mb-4">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Kluczowe wyzwanie społeczne:
                </div>
                <p className="text-xs leading-relaxed text-slate-200">
                  {selectedPowiat.key_social_challenge}
                </p>
              </div>

              <div className="text-xs text-slate-400">
                Zgłoszone potrzeby mieszkańców: <strong className="text-white">{selectedPowiat.reported_problems_count}</strong>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Wybierz powiat z listy po lewej stronie, aby wyświetlić szczegółowe wskaźniki społeczne.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
