import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../services/api';
import { MatchmakingResult } from '../types';
import { CATEGORIES, POWIATY, powiatLabel } from '../constants/domain';
import {
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Building2,
  Lightbulb,
  ExternalLink,
  BookOpen,
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  PackageCheck,
  MessageSquare,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';
import { AnalysisProgress, HighlightedQuery, SimilarReports } from '../components/matchmaking/MatchEvidence';

export const MatchmakingView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialPowiat = searchParams.get('powiat') || '';
  const { etrMode } = useAccessibility();

  const [problemDescription, setProblemDescription] = useState(initialQuery);
  const [selectedPowiat, setSelectedPowiat] = useState(initialPowiat);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchmakingResult | null>(null);
  const [error, setError] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  // Stan nagrywania głosu (Groq Whisper)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceBadge, setVoiceBadge] = useState<{ model: string; latencyMs: number } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Przykładowe opisy – kliknięcie wstawia tekst i od razu uruchamia dopasowanie
  const scenarios = [
    {
      label: 'Samotni seniorzy na wsi',
      text: 'Starsi ludzie w naszej wsi są samotni, dzieci wyjechały za granicę, a nikt ich nie odwiedza. Autobus do miasta jeździ rzadko.',
      powiat: 'nowosądecki'
    },
    {
      label: 'Lęk i kryzysy u młodzieży',
      text: 'Młodzież w szkole w Oświęcimiu doświadcza lęków i kryzysów emocjonalnych po pandemii, a terminy u psychologa NFZ wynoszą 8 miesięcy.',
      powiat: 'oświęcimski'
    },
    {
      label: 'Seniorzy i e-recepta',
      text: 'Seniorzy w gminie Miechów nie potrafią obsłużyć e-recepty ani bankowości internetowej i czują się bezradni wobec cyfryzacji urzędu.',
      powiat: 'miechowski'
    },
    {
      label: 'Brak dojazdu do lekarza',
      text: 'W naszej wsi w powiecie gorlickim osoby starsze nie mają jak dojechać do ośrodka zdrowia, bus komunalny jeździ raz w tygodniu.',
      powiat: 'gorlicki'
    },
    {
      label: 'Opiekun osoby z niepełnosprawnością',
      text: 'Mama opiekuje się dorosłym synem na wózku z niepełnosprawnością, jest wyczerpana i nie ma nikogo, kto by ją zastąpił choć na kilka dni.',
      powiat: 'limanowski'
    },
    {
      label: 'Łazienka po udarze (82 lata)',
      text: 'Mój 82-letni dziadek w Limanowej ma trudności z wchodzeniem do wanny i potrzebuje adaptacji łazienki, a GOPS jest daleko.',
      powiat: 'limanowski'
    }
  ];

  const handleSelectScenario = (sc: typeof scenarios[0]) => {
    setProblemDescription(sc.text);
    setSelectedPowiat(sc.powiat);
    setSelectedCategory('');
    triggerMatch(sc.text, sc.powiat);
  };

  const length = problemDescription.trim().length;
  const lengthHint =
    length === 0
      ? 'Napisz 1–3 zdania: kogo dotyczy problem, gdzie i czego brakuje.'
      : length < 40
        ? 'Dodaj kilka słów więcej – np. kogo dotyczy problem i czego brakuje. Im więcej szczegółów, tym trafniejsze dopasowanie.'
        : 'Dobrze – taki opis wystarczy do dopasowania.';

  const triggerMatch = async (text: string, powiat: string, category?: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.matchProblem(text, powiat, category);
      setResult(data);
      // Fokus dla czytników ekranu bez przewijania widoku (aria-live ogłasza wyniki)
      requestAnimationFrame(() => resultsRef.current?.focus({ preventScroll: true }));
    } catch (err) {
      setResult(null);
      setError(apiErrorMessage(err, 'Nie udało się dopasować innowacji. Spróbuj ponownie za chwilę.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerMatch(problemDescription, selectedPowiat, selectedCategory);
  };

  // Obsługa parametrów z URL (np. z Jury Fast Track Bar)
  useEffect(() => {
    const q = searchParams.get('q');
    const p = searchParams.get('powiat');
    if (p) setSelectedPowiat(p);
    if (q) {
      setProblemDescription(q);
      triggerMatch(q, p || selectedPowiat, selectedCategory);
    }
  }, [searchParams]);

  // Rozpoczęcie nagrywania mikrofonem
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await processAudioTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Brak dostępu do mikrofonu, włączanie trybu symulacji audio:', err);
      // Symulacja nagrania głosu dla prezentacji bez uprawnień mikrofonowych
      simulateVoiceInput();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const processAudioTranscription = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const res = await api.transcribeVoice(blob);
      setProblemDescription(res.text);
      setVoiceBadge({ model: res.is_fallback ? 'przykładowe nagranie (brak transkrypcji)' : res.model, latencyMs: res.latency_ms });
      triggerMatch(res.text, selectedPowiat, selectedCategory);
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się przetworzyć nagrania. Wpisz opis na klawiaturze.'));
    } finally {
      setTranscribing(false);
    }
  };

  const simulateVoiceInput = async () => {
    setTranscribing(true);
    // Symulacja wysłania syntetycznego głosu seniora
    setTimeout(() => {
      const text = 'Mój 82-letni dziadek w Limanowej ma trudności z wchodzeniem do wanny i potrzebuje adaptacji łazienki, a GOPS jest daleko.';
      setProblemDescription(text);
      setSelectedPowiat('limanowski');
      setVoiceBadge({ model: 'przykładowa wypowiedź (symulacja)', latencyMs: 0 });
      setTranscribing(false);
      triggerMatch(text, 'limanowski');
    }, 900);
  };

  const categories = [{ value: '', label: 'Wszystkie obszary (zalecane)' }, ...CATEGORIES];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Nagłówek Modułu */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Powiedz, co jest problemem – znajdziemy rozwiązanie' : 'Kojarzenie potrzeb z innowacjami społecznymi'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          {etrMode
            ? 'Opisz swoimi słowami, co sprawia trudność w Twojej miejscowości. Możesz napisać na klawiaturze lub powiedzieć do mikrofonu.'
            : 'Opisz problem własnymi słowami lub głosem. System rozpoznaje potrzeby (np. samotność, bariery w mieszkaniu, dojazd), porównuje je z katalogiem innowacji i pokazuje tylko trafne dopasowania z uzasadnieniem. Dane osobowe są maskowane przed analizą.'}
        </p>
      </div>

      {/* Formularz Zgłoszenia */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="problem-input" className="block text-sm font-bold text-slate-900">
                {etrMode ? 'Co się dzieje? Opisz problem:' : 'Opis problemu społecznego w języku naturalnym lub głosem:'}
              </label>

              {voiceBadge && (
                <span className="text-xs text-slate-700">
                  Wypowiedź rozpoznana{voiceBadge.latencyMs ? ` (${(voiceBadge.latencyMs / 1000).toFixed(1)} s)` : ''}
                </span>
              )}
            </div>

            <div className="relative">
              <textarea
                id="problem-input"
                rows={4}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Wpisz treść lub kliknij mikrofon poniżej (np. W naszej wsi w powiecie gorlickim osoby starsze nie mają jak dojechać do lekarza...)"
                className="w-full text-sm p-4 pb-14 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-y text-slate-900 placeholder:text-slate-500"
                maxLength={4000}
                aria-describedby="problem-hint problem-length"
                minLength={5}
                required
              />

              {/* Pasek wsparcia głosowego (Voice Input Whisper) */}
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow animate-pulse"
                    title="Zatrzymaj nagrywanie"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Zatrzymaj ({recordingSeconds}s)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={transcribing}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-colors disabled:opacity-50"
                    title="Nagraj wypowiedź głosem"
                  >
                    {transcribing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Rozpoznawanie...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>Mów głosem</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Podpowiedź długości i licznik znaków */}
            <div className="flex flex-wrap items-start justify-between gap-2 text-sm mt-1.5">
              <span id="problem-length" className={length > 0 && length < 40 ? 'text-slate-900 font-semibold' : 'text-slate-700'}>
                {lengthHint}
              </span>
              <span className="text-xs text-slate-600 tabular-nums whitespace-nowrap" aria-hidden="true">
                {problemDescription.length} / 4000 znaków
              </span>
            </div>

            {/* Przykłady do kliknięcia */}
            <div className="mt-3">
              <p id="examples-label" className="text-sm font-semibold text-slate-800 mb-1.5">
                Nie wiesz, od czego zacząć? Kliknij przykład – od razu pokażemy wynik:
              </p>
              <ul aria-labelledby="examples-label" className="flex flex-wrap gap-2">
                {scenarios.map((sc) => (
                  <li key={sc.label}>
                    <button
                      type="button"
                      onClick={() => handleSelectScenario(sc)}
                      disabled={loading}
                      className="text-sm bg-white hover:bg-blue-50 hover:border-blue-600 text-slate-900 font-semibold px-3 py-1.5 rounded-full border border-slate-300 transition-colors disabled:opacity-50"
                    >
                      {sc.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Informacja o ułatwieniu dla seniorów */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 mt-3">
              <span id="problem-hint">Możesz mówić zamiast pisać. Nie podawaj imion, adresów ani numerów telefonu.</span>
              <button
                type="button"
                onClick={simulateVoiceInput}
                className="text-blue-700 hover:underline font-semibold"
              >
                Przykładowa wypowiedź seniora
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="powiat-select" className="block text-xs font-bold text-slate-700 mb-1">
                Powiat (opcjonalnie):
              </label>
              <select
                id="powiat-select"
                value={selectedPowiat}
                onChange={(e) => setSelectedPowiat(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="">Nie wiem / cała Małopolska</option>
                {POWIATY.map((p) => (
                  <option key={p} value={p}>{powiatLabel(p)}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category-select" className="block text-xs font-bold text-slate-700 mb-1">
                Obszar (opcjonalnie – zawęża wyniki):
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              PESEL, telefony, e-maile, adresy i typowe imiona z nazwiskami są maskowane przed analizą (filtr automatyczny).
            </span>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Przeszukiwanie bazy innowacji...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Znajdź innowację</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-xl text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Postęp analizy (kroki przetwarzania) */}
      {loading && <AnalysisProgress />}

      {/* Prezentacja Wyników Matchmakingu */}
      {result && (
        <div ref={resultsRef} tabIndex={-1} aria-live="polite" className="space-y-6 animate-fadeIn focus:outline-none scroll-mt-28">
          {/* Alerty i podsumowanie analizy */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
            <div>
              <h2 className="text-lg font-black text-white">
                {result.no_match
                  ? 'Brak wystarczająco trafnych innowacji w katalogu'
                  : `Dopasowane innowacje: ${result.matches.length}`}
              </h2>
              <p className="text-xs text-slate-200 mt-1">
                Rozpoznane potrzeby: <strong className="text-amber-300">{result.detected_topics.join(', ')}</strong>
                {(result.similar_reports_total ?? 0) > 0 && ` · Podobnych zgłoszeń w regionie: ${result.similar_reports_total}`}
              </p>
            </div>

            {result.trend_alert && (
              <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 max-w-sm">
                <strong className="block font-bold mb-0.5">Sygnał z regionu:</strong>
                {result.trend_alert}
              </div>
            )}
          </div>

          {/* Opis użytkownika z zaznaczonymi słowami, które zdecydowały o wyniku */}
          <HighlightedQuery text={result.clean_query} highlights={result.highlights ?? []} />

          {/* Styl Ceneo: Inteligentny Koszyk Rozwiązań z empatyczną diagnozą */}
          {result.ceneo_intro && (
            <div className="bg-amber-50 rounded-2xl border border-amber-300 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-amber-900">
                    {result.no_match ? 'Co dalej?' : result.ai_generated ? 'Podsumowanie doradcy (wygenerowane automatycznie)' : 'Podsumowanie doradcy'}
                  </h3>
                  <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                    {result.ceneo_intro}
                  </p>
                </div>
              </div>

              {/* Uzasadnienie Komplementarnego Koszyka (Bundle Rationale) */}
              <div className="bg-white/95 rounded-xl p-4 border border-amber-200 text-xs sm:text-sm text-slate-800 space-y-1.5 shadow-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{result.no_match ? 'Nasza propozycja:' : 'Dlaczego te rozwiązania pasują razem:'}</span>
                </div>
                <p className="leading-relaxed text-slate-700">
                  {result.ceneo_bundle_rationale}
                </p>
              </div>

              {/* 3 Kroki Działania */}
              {result.action_steps && result.action_steps.length > 0 && (
                <div className="pt-1">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Twój plan działania (3 kroki):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {result.action_steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="bg-white/90 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 flex items-start gap-2 shadow-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug font-medium">{step.replace(/^Krok \d+:\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {result.no_match && (
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <p className="text-sm text-slate-800 font-semibold">Nie mamy jeszcze sprawdzonego rozwiązania dla tego problemu – pomóż nam je stworzyć.</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/problemy" className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold px-4 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" /> Zgłoś problem do ROPS
                </Link>
                <Link to="/kreator-pomyslow" className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold px-4 py-2 rounded-lg">
                  <Lightbulb className="w-4 h-4" aria-hidden="true" /> Zaproponuj pomysł
                </Link>
              </div>
            </div>
          )}

          {/* Karty Dopasowanych Innowacji */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.matches.map((item, index) => (
              <div
                key={item.innovation_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Wskaźnik Match Score */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {item.category_label}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{item.title}</h3>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-2xl font-black text-amber-700">
                      {Math.round(item.match_score * 100)}%
                    </span>
                    <span className="block text-xs text-slate-600 font-bold">trafność<span className="sr-only"> dopasowania, pozycja {index + 1}</span></span>
                  </div>
                </div>

                <p className="text-sm text-slate-700 mb-3">{item.tagline}</p>

                {(item.matched_keywords ?? []).length > 0 && (
                  <div className="mb-3 text-sm">
                    <span id={`kw-${item.innovation_id}`} className="font-bold text-slate-900">Dopasowano, bo w opisie jest:</span>
                    <ul aria-labelledby={`kw-${item.innovation_id}`} className="flex flex-wrap gap-1.5 mt-1">
                      {(item.matched_keywords ?? []).map((kw) => (
                        <li key={kw}>
                          <mark className="bg-amber-300 text-slate-950 font-bold underline decoration-2 underline-offset-2 px-2 py-0.5 rounded-full text-xs">
                            {kw}
                          </mark>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.matched_needs.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 mb-3" aria-label="Dopasowane potrzeby">
                    {item.matched_needs.map((need) => (
                      <li key={need} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
                        ✓ {need}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Sekcja: Dlaczego dopasowano */}
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 mb-4">
                  <span className="text-xs font-bold text-amber-950 mb-1 flex items-center gap-1">
                    Dlaczego to pasuje{result.ai_generated ? ' (AI)' : ''}:
                  </span>
                  <p className="text-sm text-amber-950 leading-relaxed">{item.why_matched}</p>
                </div>

                {/* Tekst ETR jeśli włączony */}
                {etrMode && item.etr_summary && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 text-xs text-emerald-900">
                    <strong className="block mb-1 font-bold">Wersja w prostym języku (ETR):</strong>
                    {item.etr_summary}
                  </div>
                )}

                {/* Stopka karty z akcjami */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-auto">
                  <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
                    Gotowość: {item.readiness_level}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/baza-wiedzy/${item.innovation_id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold border border-slate-300 hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      Szczegóły<span className="sr-only">: {item.title}</span>
                    </Link>
                    <Link
                      to={`/middleman?inn=${item.innovation_id}${selectedPowiat ? `&powiat=${encodeURIComponent(selectedPowiat)}` : ''}`}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                      Adaptuj dla gminy
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Podobne zgłoszenia z regionu (zagregowane, bez danych osobowych) */}
          <SimilarReports groups={result.similar_reports ?? []} total={result.similar_reports_total ?? 0} />

          {!result.no_match && (
            <p className="text-sm text-slate-700 text-center">
              Żadne z rozwiązań nie pasuje?{' '}
              <Link to="/problemy" className="font-bold text-blue-700 underline">Zgłoś problem do ROPS</Link>
              {' '}albo{' '}
              <Link to="/kreator-pomyslow" className="font-bold text-blue-700 underline">zaproponuj własny pomysł</Link>.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
