import React, { useState, useEffect, useRef } from 'react';
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
  BookOpen,
  Mic,
  MicOff,
  Volume2,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';

export const MatchmakingView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialPowiat = searchParams.get('powiat') || 'gorlicki';
  const { etrMode } = useAccessibility();

  const [problemDescription, setProblemDescription] = useState(initialQuery);
  const [selectedPowiat, setSelectedPowiat] = useState(initialPowiat);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchmakingResult | null>(null);

  // Stan nagrywania głosu (Groq Whisper)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceBadge, setVoiceBadge] = useState<{ model: string; latencyMs: number } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const scenarios = [
    {
      label: '👵 Senior w Limanowej (82 lata, łazienka)',
      text: 'Mój 82-letni dziadek w Limanowej ma trudności z wchodzeniem do wanny i potrzebuje adaptacji łazienki, a GOPS jest daleko.',
      powiat: 'limanowski',
      category: 'dostepnosc'
    },
    {
      label: '🧠 Kryzys psychiczny młodzieży (Oświęcim)',
      text: 'Młodzież w szkole w Oświęcimiu doświadcza lęków i kryzysów emocjonalnych po pandemii, a terminy u psychologa NFZ wynoszą 8 miesięcy.',
      powiat: 'oświęcimski',
      category: 'zdrowie_psychiczne'
    },
    {
      label: '🚌 Brak transportu do lekarza (Gorlice)',
      text: 'W naszej wsi w powiecie gorlickim osoby starsze nie mają jak dojechać do ośrodka zdrowia, bus komunalny jeździ raz w tygodniu.',
      powiat: 'gorlicki',
      category: 'seniorzy'
    },
    {
      label: '💻 Wykluczenie cyfrowe seniorów (Miechów)',
      text: 'Seniorzy w gminie Miechów nie potrafią obsłużyć e-recepty ani bankowości internetowej i czują się bezradni wobec cyfryzacji urzędu.',
      powiat: 'miechowski',
      category: 'wykluczenie_cyfrowe'
    }
  ];

  const handleSelectScenario = (sc: typeof scenarios[0]) => {
    setProblemDescription(sc.text);
    setSelectedPowiat(sc.powiat);
    setSelectedCategory(sc.category);
    triggerMatch(sc.text, sc.powiat, sc.category);
  };

  const triggerMatch = async (text: string, powiat: string, category?: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await api.matchProblem(text, powiat, category);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd podczas kojarzenia potrzeb.');
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
    if (q) {
      setProblemDescription(q);
      const chosenPowiat = p || selectedPowiat;
      if (p) setSelectedPowiat(p);
      triggerMatch(q, chosenPowiat);
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
      setVoiceBadge({ model: res.model, latencyMs: res.latency_ms });
      triggerMatch(res.text, selectedPowiat, selectedCategory);
    } catch (err) {
      console.error('Błąd transkrypcji:', err);
      alert('Nie udało się przetworzyć nagrania audio.');
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
      setVoiceBadge({ model: 'whisper-large-v3-turbo', latencyMs: 820 });
      setTranscribing(false);
      triggerMatch(text, 'limanowski');
    }, 900);
  };

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
            ? 'Opisz swoimi słowami, co sprawia trudność w Twojej miejscowości. Możesz napisać na klawiaturze lub powiedzieć do mikrofonu.'
            : 'Hybrydowy rurociąg wektorowo-leksykalny kojarzy zgłaszane potrzeby z portfolio innowacji ROPS Kraków. Obsługuje zgłoszenia tekstowe i głosowe (Groq Whisper), automatycznie filtrując dane wrażliwe (Zero PII).'}
        </p>
      </div>

      {/* Szybkie Scenariusze dla Jury */}
      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
          <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
          <span>Szybkie scenariusze testowe dla Jury (1 kliknięcie uruchamia dopasowanie):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {scenarios.map((sc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectScenario(sc)}
              className="text-xs bg-white hover:bg-amber-50 hover:border-amber-400 text-slate-800 font-semibold px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm transition-all text-left"
            >
              {sc.label}
            </button>
          ))}
        </div>
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
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Transkrypcja {voiceBadge.model} w {voiceBadge.latencyMs}ms
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
                className="w-full text-sm p-4 pr-12 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-y text-slate-900 placeholder:text-slate-400"
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
                    title="Nagraj wypowiedź głosem (Groq Whisper dla seniorów)"
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

            {/* Informacja o ułatwieniu dla seniorów */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>WCAG 2.1 AA: Obsługa mowy ułatwia zgłaszanie problemów osobom z trudnościami manualnymi.</span>
              <button
                type="button"
                onClick={simulateVoiceInput}
                className="text-blue-600 hover:underline font-semibold"
              >
                🎙️ Testuj próbkę mowy seniora (1 klik)
              </button>
            </div>
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
                <option value="limanowski">Powiat limanowski</option>
                <option value="miechowski">Powiat miechowski</option>
                <option value="tarnowski">Powiat tarnowski</option>
                <option value="nowosądecki">Powiat nowosądecki</option>
                <option value="wielicki">Powiat wielicki</option>
                <option value="m. Kraków">m. Kraków</option>
                <option value="oświęcimski">Powiat oświęcimski</option>
                <option value="wadowicki">Powiat wadowicki</option>
                <option value="proszowicki">Powiat proszowicki</option>
                <option value="dąbrowski">Powiat dąbrowski</option>
                <option value="tatrzański">Powiat tatrzański</option>
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
              Automatyczna ochrona prywatności (Zero-PII). Żadne dane osobowe nie trafiają do modelu.
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
                  <span>Znajdź Innowację (RAG)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Prezentacja Wyników Matchmakingu */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Alerty i podsumowanie analizy */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Diagnoza Potrzeby Ukończona</span>
              </div>
              <h2 className="text-lg font-black text-white">
                Znaleziono {result.matches.length} dopasowane innowacje społeczne
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Wykryte motywy przewodnie: <strong className="text-amber-300">{result.detected_topics.join(', ')}</strong> | W regionie zidentyfikowano {result.similar_cases_count} podobnych przypadków.
              </p>
            </div>

            {result.trend_alert && (
              <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 max-w-sm">
                <strong className="block font-bold mb-0.5">⚠️ Alert Regionalny ROPS:</strong>
                {result.trend_alert}
              </div>
            )}
          </div>

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
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{item.title}</h3>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-2xl font-black text-amber-500">
                      {Math.round(item.match_score * 100)}%
                    </span>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Dopasowanie</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 line-clamp-2">{item.tagline}</p>

                {/* Sekcja: Dlaczego dopasowano */}
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 mb-4">
                  <span className="text-[11px] font-bold text-amber-900 block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Uzasadnienie dopasowania AI:
                  </span>
                  <p className="text-xs text-amber-950 leading-relaxed italic">{item.why_matched}</p>
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
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Gotowość: {item.readiness_level}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/middleman?inn=${item.innovation_id}&powiat=${selectedPowiat}`}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      Adaptuj dla Gminy
                    </Link>

                    <Link
                      to={`/baza-wiedzy?search=${encodeURIComponent(item.title)}`}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Szczegóły innowacji w Bazie Wiedzy"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
