import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { MatchmakingResult } from '../types';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Building2,
  Lightbulb,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';

export const MatchmakingView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { etrMode } = useAccessibility();

  const [problemDescription, setProblemDescription] = useState(initialQuery);
  const [selectedPowiat, setSelectedPowiat] = useState('gorlicki');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchmakingResult | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!problemDescription.trim()) return;

    setLoading(true);
    try {
      const data = await api.matchProblem(problemDescription, selectedPowiat, selectedCategory);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd podczas kojarzenia potrzeb.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSubmit();
    }
  }, [initialQuery]);

  const categories = [
    { value: '', label: 'Wszystkie obszary' },
    { value: 'seniorzy', label: 'Seniorzy i usługi opiekuńcze' },
    { value: 'zdrowie_psychiczne', label: 'Zdrowie psychiczne i młodzież' },
    { value: 'dostepnosc', label: 'Dostępność i usuwanie barier' },
    { value: 'wykluczenie_cyfrowe', label: 'Wykluczenie cyfrowe' },
    { value: 'integracja', label: 'Integracja sąsiedzka' }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Nagłówek Modułu */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Moduł I: Matchmaking Społeczny (Obligatoryjny)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Powiedz, co jest problemem – znajdziemy rozwiązanie' : 'Inteligentny Matchmaker Społeczny RAG'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          {etrMode
            ? 'Opisz swoimi słowami, co sprawia trudność w Twojej miejscowości. System automatycznie wyszuka najlepsze rozwiązanie z bazy ROPS Kraków.'
            : 'Hybrydowy rurociąg wektorowo-leksykalny kojarzy zgłaszane potrzeby z portfolio ponad 200 innowacji społecznych. Automatycznie usuwa dane wrażliwe (Zero PII) i generuje dwuzdaniowe uzasadnienie dopasowania.'}
        </p>
      </div>

      {/* Formularz Zgłoszenia */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="problem-input" className="block text-sm font-bold text-slate-900 mb-1.5">
              {etrMode ? 'Co się dzieje? Opisz problem:' : 'Opis problemu społecznego w języku naturalnym:'}
            </label>
            <textarea
              id="problem-input"
              rows={4}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Wpisz treść (np. W naszej wsi w powiecie gorlickim osoby starsze nie mają jak dojechać do lekarza, brakuje transportu, a sąsiedzi rzadko ich odwiedzają...)"
              className="w-full text-sm p-4 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-y text-slate-900 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="powiat-select" className="block text-xs font-bold text-slate-700 mb-1">
                Lokalizacja (Powiat w Małopolsce):
              </label>
              <select
                id="powiat-select"
                value={selectedPowiat}
                onChange={(e) => setSelectedPowiat(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="gorlicki">Powiat gorlicki</option>
                <option value="miechowski">Powiat miechowski</option>
                <option value="tarnowski">Powiat tarnowski</option>
                <option value="nowosądecki">Powiat nowosądecki</option>
                <option value="wielicki">Powiat wielicki</option>
                <option value="m. Kraków">m. Kraków</option>
                <option value="oświęcimski">Powiat oświęcimski</option>
                <option value="wadowicki">Powiat wadowicki</option>
                <option value="proszowicki">Powiat proszowicki</option>
                <option value="dąbrowski">Powiat dąbrowski</option>
              </select>
            </div>

            <div>
              <label htmlFor="category-select" className="block text-xs font-bold text-slate-700 mb-1">
                Kategoria tematyczna:
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
              Automatyczna filtracja PESEL i danych wrażliwych aktywna.
            </span>
            <button
              type="submit"
              disabled={loading || !problemDescription.trim()}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 text-sm"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Przeszukiwanie portfolio ROPS...' : 'Kojarz potrzeby i innowacje'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sekcja Wyników */}
      {result && (
        <section aria-live="polite" className="space-y-6 animate-fadeIn">
          {/* Alerty i Podsumowanie Zapytania */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                Wynik Analizy Semantycznej
              </div>
              <div className="text-sm text-slate-200">
                Wykryte wątki problemowe: <strong className="text-white">{result.detected_topics.join(', ')}</strong> | Powiat: <strong className="text-white">{result.powiat || 'Cała Małopolska'}</strong>
              </div>
            </div>
            {result.trend_alert && (
              <div className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-lg max-w-md">
                📊 {result.trend_alert}
              </div>
            )}
          </div>

          {/* Karty Dopasowanych Innowacji */}
          <div className="grid grid-cols-1 gap-5">
            {result.matches.map((match, idx) => (
              <article
                key={match.innovation_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                        #{idx + 1} Dopasowanie
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {Math.round(match.match_score * 100)}% trafności
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {match.readiness_level}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-slate-400">
                      ID: {match.innovation_id}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {match.title}
                  </h3>
                  <p className="text-xs font-semibold text-blue-600 mb-3">
                    {match.tagline}
                  </p>

                  {/* Uzasadnienie AI */}
                  <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-xl mb-4 text-xs text-blue-950 leading-relaxed">
                    <strong className="text-blue-800 font-bold block mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Dlaczego system rekomenduje to rozwiązanie:
                    </strong>
                    {match.why_matched}
                  </div>

                  {/* Wersja Prosty Język (ETR) */}
                  {etrMode && match.etr_summary && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 text-xs text-amber-950 flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">Wersja łatwa do zrozumienia:</strong>
                        {match.etr_summary}
                      </div>
                    </div>
                  )}

                  {/* Tagi grupy docelowej */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {match.target_groups.map((tg, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Akcje pod innowacją */}
                <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={`/baza-wiedzy?id=${match.innovation_id}`}
                    className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1"
                  >
                    Szczegóły innowacji i wideo <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to={`/middleman?inn=${match.innovation_id}&powiat=${selectedPowiat}`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Wdróż w gminie (Middleman AI)
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Opcja "Nie znalazłem rozwiązania" -> Kreator pomysłów */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                Nie znalazłeś odpowiedniej innowacji?
              </h4>
              <p className="text-xs text-slate-600">
                Stwórz fiszkę nowego pomysłu! Asystent AI pomoże Ci opracować 9 bloków Canwy Innowacji Społecznej.
              </p>
            </div>
            <Link
              to={`/kreator-pomyslow?problem=${encodeURIComponent(problemDescription)}&powiat=${selectedPowiat}`}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              Przejdź do Kreatora Pomysłów <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};
