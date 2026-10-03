import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TrendRadarData } from '../types';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Layers,
  FileCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useAccessibility } from '../store/useAccessibilityStore';

export const AdminDashboardView: React.FC = () => {
  const { etrMode } = useAccessibility();
  const [radar, setRadar] = useState<TrendRadarData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mockowa kolejka moderacji fiszek dla ROPS
  const [submissions, setSubmissions] = useState([
    {
      id: 'fiszka-001',
      title: 'Międzypokoleniowa Spółdzielnia Sadzonek',
      author: 'Koło Gospodyń Wiejskich w Słaboszowie',
      powiat: 'miechowski',
      status: 'submitted',
      summary: 'Wymiana rozsad i nasion połączona z nauką tradycyjnego przetwórstwa dla młodzieży.'
    },
    {
      id: 'fiszka-002',
      title: 'Mobilna Grupa Asekuracyjna dla Samotnych Matek',
      author: 'Stowarzyszenie "Nadzieja"',
      powiat: 'gorlicki',
      status: 'submitted',
      summary: 'Sieć wolontariatu oferująca doraźną opiekę nad dziećmi podczas wizyt lekarskich matek.'
    }
  ]);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      const data = await api.getTrendRadar();
      setRadar(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = (id: string, newStatus: 'approved' | 'rejected') => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: newStatus } : sub))
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Nagłówek */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Moduł VI: Panel Administratora i Koordynatora ROPS Kraków</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Dla Pracownika ROPS – Dane i Sprawdzanie Pomysłów' : 'Radar Trendów Społecznych i Moderacja Zgłoszeń'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Moduł analityczny agregujący potrzeby mieszkańców ze wszystkich zapytań Matchmakingu w 22 powiatach. Pozwala identyfikować dynamiczne wzrosty problemów społecznych, luki systemowe oraz zarządzać kolejką nadsyłanych fiszek pomysłów.
        </p>
      </div>

      {radar && (
        <div className="space-y-6">
          {/* Kluczowe KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Przeanalizowane Zgłoszenia i Zapytania
              </span>
              <div className="text-3xl font-black text-blue-600">
                {radar.total_problems_analyzed.toLocaleString('pl-PL')}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +18.4% w tym kwartale
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Oczekujące Fiszki Pomysłów
              </span>
              <div className="text-3xl font-black text-amber-500">
                {submissions.filter((s) => s.status === 'submitted').length}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Wymagają weryfikacji merytorycznej
              </span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Powiaty z Alertem Krytycznym
              </span>
              <div className="text-3xl font-black text-rose-600">
                {radar.poviat_breakdown.filter((p) => p.alert_level === 'high_critical').length}
              </div>
              <span className="text-[11px] text-rose-600 font-semibold block mt-1">
                Wskaźnik starzenia &gt; 26%
              </span>
            </div>
          </div>

          {/* Wykres Recharts: Rozkład Zgłoszeń w Powiatach */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Natężenie Zgłoszeń i Potrzeb Społecznych per Powiat
                </h3>
                <p className="text-xs text-slate-500">Liczba zarejestrowanych zapytań z podziałem na powiaty Małopolski.</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={radar.poviat_breakdown.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="powiat" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="reported_cases_count" name="Liczba zgłoszeń" fill="#034EA2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Najbardziej Palące Wyzwania Społeczne */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Radar Trendów Społecznych – Najostrzejsze Wyzwania w Małopolsce
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {radar.most_acute_challenges.map((c, i) => (
                <div key={i} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-bold text-amber-400 uppercase tracking-wider">Poziom Wpływu</span>
                      <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-black text-xs">
                        {c.impact_score}/100
                      </span>
                    </div>
                    <h4 className="font-bold text-sm mb-2 leading-snug">{c.category}</h4>
                    <p className="text-[11px] text-slate-400 mb-3">
                      <strong>Hotspoty:</strong> {c.hotspot_powiaty.join(', ')}
                    </p>
                  </div>
                  <div className="border-t border-slate-700/80 pt-2 text-[11px] text-slate-300">
                    <strong className="text-emerald-400 block mb-0.5">Rekomendacja ROPS:</strong>
                    {c.suggested_action}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-4">
              <strong className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                Zdiagnozowane Luki Systemowe (White Spots):
              </strong>
              <ul className="space-y-1 text-xs text-slate-300">
                {radar.systemic_gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Kolejka Moderacji Fiszek */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              Kolejka Weryfikacji Nadesłanych Fiszek Pomysłów
            </h3>

            <div className="space-y-3">
              {submissions.map((sub) => (
                <div key={sub.id} className="border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="font-bold text-slate-900">{sub.title}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">Powiat {sub.powiat}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sub.status === 'approved' ? 'Zatwierdzona' : sub.status === 'rejected' ? 'Odrzucona' : 'Oczekuje'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{sub.summary}</p>
                    <div className="text-[11px] text-slate-400 mt-1">Autor: {sub.author}</div>
                  </div>

                  {sub.status === 'submitted' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleModerate(sub.id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Zatwierdź
                      </button>
                      <button
                        onClick={() => handleModerate(sub.id, 'rejected')}
                        className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Odrzuć
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
