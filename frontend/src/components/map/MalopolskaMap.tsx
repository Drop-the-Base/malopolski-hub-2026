import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RegionalChallenge } from '../../types';
import { MapPin, Users, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAccessibility } from '../../store/useAccessibilityStore';

interface MapProps {
  challenges: RegionalChallenge[];
  onSelectPowiat?: (powiatName: string) => void;
}

export const MalopolskaMap: React.FC<MapProps> = ({ challenges, onSelectPowiat }) => {
  const [selectedPowiat, setSelectedPowiat] = useState<RegionalChallenge | null>(null);
  const { etrMode } = useAccessibility();

  // Domyślny wybór po wczytaniu danych (powiat gorlicki – najwyższy odsetek seniorów w demo)
  useEffect(() => {
    if (!selectedPowiat && challenges.length) {
      setSelectedPowiat(challenges.find((c) => c.powiat_name === 'gorlicki') ?? challenges[0]);
    }
  }, [challenges, selectedPowiat]);

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
            <MapPin className="w-5 h-5 text-blue-600" aria-hidden="true" />
            {etrMode ? 'Powiaty Małopolski – gdzie pomagamy' : 'Wyzwania społeczne 22 powiatów Małopolski'}
          </h3>
          <p className="text-sm text-slate-600">
            {etrMode
              ? 'Wybierz swój powiat, aby zobaczyć, ilu ludzi tam mieszka i jakie są trudności.'
              : 'Wizualizacja diagnozy demograficznej i zapotrzebowania społecznego dla 22 powiatów regionu.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="Legenda">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <span className="px-1.5 rounded bg-rose-100 border border-rose-300 text-rose-900 font-bold">S+</span>
            seniorzy powyżej 25% mieszkańców
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <span className="px-1.5 rounded bg-sky-100 border border-sky-300 text-sky-900 font-bold">▲</span>
            wzrost liczby ludności
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kafelkowa Mapa Powiatów Małopolski */}
        <div className="lg:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Wybierz powiat:
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
                  <div className="font-bold truncate flex items-center gap-1">
                    <span>{c.powiat_name}</span>
                    {isHighSenior && <span className="text-[11px] font-black" title="Seniorzy powyżej 25%">S+</span>}
                    {isGrowth && <span className="text-[11px] font-black" title="Wzrost liczby ludności">▲</span>}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-blue-50' : 'text-slate-600'}`}>
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
                  <span className="text-xs text-slate-300">Aktywne innowacje</span>
                  <div className="text-xl font-black text-emerald-400">{selectedPowiat.active_innovations_count}</div>
                </div>
              </div>

              {/* Metryki powiatu */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    Liczba ludności
                  </div>
                  <div className="text-base font-bold">{selectedPowiat.population.toLocaleString('pl-PL')}</div>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
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

              <div className="text-xs text-slate-300 mb-4">
                Zgłoszone potrzeby mieszkańców (dane bazowe): <strong className="text-white">{selectedPowiat.reported_problems_count}</strong>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/matchmaking?powiat=${encodeURIComponent(selectedPowiat.powiat_name)}&q=${encodeURIComponent(selectedPowiat.key_social_challenge)}`}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs"
                >
                  Znajdź innowacje dla tego wyzwania
                </Link>
                <Link
                  to={`/middleman?powiat=${encodeURIComponent(selectedPowiat.powiat_name)}`}
                  className="border border-slate-500 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-lg text-xs"
                >
                  Wdrożenie w gminie
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-300 text-sm">
              Wybierz powiat z listy po lewej stronie, aby wyświetlić szczegółowe wskaźniki społeczne.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
