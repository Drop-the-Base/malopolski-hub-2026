import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { CanvasData, CanvasAudit, GrantApplication } from '../types';
import {
  Lightbulb,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Printer,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  Building2,
  Users,
  ShieldCheck,
  MapPin,
  DollarSign
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';

export const IdeaCreatorView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialProblem = searchParams.get('problem') || '';
  const initialPowiat = searchParams.get('powiat') || 'gorlicki';
  const { etrMode } = useAccessibility();

  // Aktywny krok w kreatorze (1 -> 2 -> 3)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // KROK 1: Inicjacja Pomysłu
  const [step1Form, setStep1Form] = useState({
    title: 'Mobilna Sąsiedzka Sieć Wsparcia Seniorów',
    summary: initialProblem || 'Osoby starsze w sołectwach wiejskich są odcięte od podstawowej opieki i leków z powodu braku transportu publicznego. Sąsiedzi chcą zorganizować rotacyjną pomoc i teleopiekę.',
    powiat: initialPowiat,
    gmina: 'Gmina Sękowa',
    target_audience: 'Seniorzy 70+ z ograniczoną sprawnością ruchową oraz ich opiekunowie faktyczni',
    author_name: 'Jan Kowalski (Koordynator Wolontariatu)',
    author_email: 'kontakt@malopolska-innowacje.pl',
    author_type: 'mieszkaniec'
  });

  // KROK 2: Canwa Innowacji 3x3
  const [canvas, setCanvas] = useState<CanvasData>({
    problem: initialProblem || 'Starsze osoby w małych wsiach są odcięte od opieki zdrowotnej i leków.',
    target_group: 'Seniorzy 70+ mieszkający samotnie w gospodarstwach wiejskich.',
    value_proposition: 'Sąsiedzka sieć mobilnego wsparcia lekowego, doraźnej opieki i teleopieki.',
    barriers: 'Brak zasięgu komórkowego w dolinach i nieufność osób starszych do obcych.',
    resources: 'Lokalna remiza OSP, wolontariusze z liceum, samochód sołtysa, świetlica wiejska.',
    partners: 'Gminny Ośrodek Pomocy Społecznej (GOPS), Koło Gospodyń Wiejskich, ROPS Kraków.',
    testing_plan: '3-miesięczny pilotaż w 2 sołectwach z udziałem 15 seniorów i ankietami zadowolenia.',
    metrics: 'Liczba 50 dowiezionych recept, 100% zrealizowanych wizyt wsparcia, SUS > 80 pkt.',
    scalability: 'Włączenie procedury do standardu Centrum Usług Społecznych (CUS) w całym powiecie.'
  });
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [audit, setAudit] = useState<CanvasAudit | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [generationLatency, setGenerationLatency] = useState<number | null>(null);

  // KROK 3: Wniosek o Dofinansowanie
  const [grantBudget, setGrantBudget] = useState(50000);
  const [grantApplication, setGrantApplication] = useState<GrantApplication | null>(null);
  const [grantLoading, setGrantLoading] = useState(false);

  // Szybkie presety dla Jury
  const juryPresets = [
    {
      label: '👵 Asystent Seniora (Gorlice)',
      title: 'Mobilny Asystent Seniora i Teleopieka Sąsiedzka',
      summary: 'Seniorzy w odległych sołectwach powiatu gorlickiego mają trudności z dojazdem do ośrodka zdrowia i apteki. Inicjatywa tworzy sieć przeszkolonych sąsiadów-asystentów dysponujących prostą aplikacją dyspozytorską.',
      powiat: 'gorlicki',
      gmina: 'Gmina Sękowa',
      target: 'Seniorzy 70+ mieszkający samotnie i ich rodziny'
    },
    {
      label: '☕ Kawiarenka Naprawcza (Miechów)',
      title: 'Międzypokoleniowa Kawiarenka Naprawcza i Eko-Warsztat',
      summary: 'Młodzież i seniorzy w gminie Miechów wspólnie naprawiają sprzęt codziennego użytku i rowery. Pozwala to na integrację pokoleniową, walkę z samotnością seniorów-rzemieślników i redukcję elektrośmieci.',
      powiat: 'miechowski',
      gmina: 'Gmina Miechów',
      target: 'Seniorzy-emeryci oraz młodzież szkolna i studenci'
    },
    {
      label: '🧠 Strefa Wytchnienia Młodych (Oświęcim)',
      title: 'Klubowa Strefa Wytchnienia i Mentoringu Rówieśniczego',
      summary: 'Kryzysy emocjonalne młodzieży po pandemii i brak bezpiecznej przestrzeni dialogu w mieście. Tworzymy przyjazną strefę chilloutu w domu kultury z bezpłatnym dyżurem psychologa i koMIXami terapeutycznymi.',
      powiat: 'oświęcimski',
      gmina: 'm. Oświęcim',
      target: 'Młodzież 13-19 lat oraz ich rodzice'
    }
  ];

  const handleSelectPreset = (p: typeof juryPresets[0]) => {
    setStep1Form({
      ...step1Form,
      title: p.title,
      summary: p.summary,
      powiat: p.powiat,
      gmina: p.gmina,
      target_audience: p.target
    });
  };

  // Przejście z Kroku 1 do Kroku 2: Generowanie Canwy przez Groq AI
  const handleProceedToStep2 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCanvasLoading(true);
    setCurrentStep(2);
    try {
      const res = await api.autofillCanvas(step1Form.summary, step1Form.powiat, step1Form.target_audience);
      setCanvas({
        problem: res.problem,
        target_group: res.target_group,
        value_proposition: res.value_proposition,
        barriers: res.barriers,
        resources: res.resources,
        partners: res.partners,
        testing_plan: res.testing_plan,
        metrics: res.metrics,
        scalability: res.scalability
      });
      setGenerationLatency(res.latency_ms);
    } catch (err) {
      console.error('Błąd generowania Canwy z AI:', err);
    } finally {
      setCanvasLoading(false);
    }
  };

  // Audyt Canwy w Kroku 2
  const handleRunAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await api.evaluateCanvas(canvas);
      setAudit(res);
    } catch (err) {
      console.error('Błąd audytu logicznego:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Przejście z Kroku 2 do Kroku 3: Generowanie Wniosku Grantowego
  const handleProceedToStep3 = async () => {
    setGrantLoading(true);
    setCurrentStep(3);
    try {
      const app = await api.generateGrantApplication({
        idea_title: step1Form.title,
        summary: step1Form.summary,
        target_group: step1Form.target_audience,
        powiat: step1Form.powiat,
        gmina: step1Form.gmina,
        author_name: step1Form.author_name,
        requested_budget_pln: grantBudget,
        canvas_data: canvas
      });
      setGrantApplication(app);
    } catch (err) {
      console.error('Błąd generowania wniosku:', err);
      alert('Nie udało się wygenerować wniosku grantowego.');
    } finally {
      setGrantLoading(false);
    }
  };

  // Przeliczenie budżetu w Kroku 3
  const handleBudgetChange = async (newBudget: number) => {
    setGrantBudget(newBudget);
    try {
      const app = await api.generateGrantApplication({
        idea_title: step1Form.title,
        summary: step1Form.summary,
        target_group: step1Form.target_audience,
        powiat: step1Form.powiat,
        gmina: step1Form.gmina,
        author_name: step1Form.author_name,
        requested_budget_pln: newBudget,
        canvas_data: canvas
      });
      setGrantApplication(app);
    } catch (err) {
      console.error('Błąd aktualizacji budżetu:', err);
    }
  };

  // 9 pól Canwy do edycji
  const canvasBlocks: Array<{ key: keyof CanvasData; label: string; hint: string; num: string }> = [
    { num: '01', key: 'problem', label: 'Problem Społeczny', hint: 'Jaka niezaspokojona potrzeba dotyka mieszkańców?' },
    { num: '02', key: 'target_group', label: 'Grupa Odbiorców', hint: 'Kto jest bezpośrednim beneficjentem innowacji?' },
    { num: '03', key: 'value_proposition', label: 'Wartość Innowacji', hint: 'Co unikalnego daje ta inicjatywa, czego brak w OPS?' },
    { num: '04', key: 'barriers', label: 'Bariery i Ryzyka', hint: 'Jakie przeszkody mogą wystąpić i jak je pokonamy?' },
    { num: '05', key: 'resources', label: 'Lokalne Zasoby', hint: 'Jakie zasoby (remizy, sprzęt, ludzie) wykorzystamy?' },
    { num: '06', key: 'partners', label: 'Partnerzy Lokalni', hint: 'Kto wspiera projekt: CUS, GOPS, OSP, KGW, NGO?' },
    { num: '07', key: 'testing_plan', label: 'Plan Pilotażu / Testów', hint: 'Jak przetestujesz prototyp w 3-miesięcznym teście?' },
    { num: '08', key: 'metrics', label: 'Mierniki Sukcesu (KPI)', hint: 'Mierzalne efekty: liczba osób, ankieta SUS > 80.' },
    { num: '09', key: 'scalability', label: 'Ścieżka Skalowania', hint: 'W jaki sposób innowacja trafi do kolejnych gmin Małopolski?' }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Nagłówek i Stepper Postępu */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
          <span>Moduł III: 3-Krokowy Kreator Innowacji Społecznej</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Kreator Pomysłu: Od Zgłoszenia do Wniosku o Grant' : 'Inkubator Pomysłów i Generator Wniosków ROPS'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Kompleksowa ścieżka projektowania innowacji: wprowadź zwięzły zarys pomysłu, przeanalizuj model w 9-polowej Canwie z Asystentem AI,
          a następnie pobierz oficjalny, gotowy do druku wniosek o dofinansowanie w naborach ROPS Kraków.
        </p>

        {/* Wskaźnik Kroków (Stepper 1 -> 2 -> 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              currentStep === 1
                ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 1 ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              1
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-slate-500">Krok 1</div>
              <div className="text-xs font-bold">Inicjacja i Zarys Pomysłu</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              currentStep === 2
                ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 2 ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              2
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-slate-500">Krok 2</div>
              <div className="text-xs font-bold">Canwa Innowacji 3x3 z AI</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              currentStep === 3
                ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 3 ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              3
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-slate-500">Krok 3</div>
              <div className="text-xs font-bold">Wniosek Grantowy i Druk PDF</div>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* KROK 1: FORMULARZ INICJACJI POMYSŁU                            */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn print:hidden">
          {/* Szybkie Scenariusze dla Jury */}
          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
              <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Szybkie scenariusze testowe dla Jury (1 kliknięcie uzupełnia formularz):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {juryPresets.map((pr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(pr)}
                  className="text-xs bg-white hover:bg-amber-50 hover:border-amber-400 text-slate-800 font-semibold px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm transition-all"
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <form onSubmit={handleProceedToStep2} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  1. Temat / Tytuł roboczy innowacji społecznej:
                </label>
                <input
                  type="text"
                  required
                  value={step1Form.title}
                  onChange={(e) => setStep1Form({ ...step1Form, title: e.target.value })}
                  placeholder="np. Mobilna Sąsiedzka Sieć Wsparcia Seniorów w gminie Sękowa"
                  className="w-full text-sm p-3 rounded-xl border border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-900">
                    2. Krótki opis problemu i pomysłu (1-3 zwięzłe zdania):
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {step1Form.summary.length} znaków
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={step1Form.summary}
                  onChange={(e) => setStep1Form({ ...step1Form, summary: e.target.value })}
                  placeholder="Opisz w 1-3 zdaniach: na czym polega problem mieszkańców, co chcesz zorganizować i jaki rezultat osiągniesz..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    3. Powiat w Małopolsce:
                  </label>
                  <select
                    value={step1Form.powiat}
                    onChange={(e) => setStep1Form({ ...step1Form, powiat: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500"
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
                    <option value="nowotarski">Powiat nowotarski</option>
                    <option value="myślenicki">Powiat myślenicki</option>
                    <option value="chrzanowski">Powiat chrzanowski</option>
                    <option value="olkuski">Powiat olkuski</option>
                    <option value="bocheński">Powiat bocheński</option>
                    <option value="brzeski">Powiat brzeski</option>
                    <option value="krakowski">Powiat krakowski</option>
                    <option value="suski">Powiat suski</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    4. Gmina / Miejscowość docelowa:
                  </label>
                  <input
                    type="text"
                    required
                    value={step1Form.gmina}
                    onChange={(e) => setStep1Form({ ...step1Form, gmina: e.target.value })}
                    placeholder="np. Gmina Sękowa, sołectwa Ropica Górna i Bodaki"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  5. Odbiorcy innowacji (Grupa docelowa):
                </label>
                <input
                  type="text"
                  required
                  value={step1Form.target_audience}
                  onChange={(e) => setStep1Form({ ...step1Form, target_audience: e.target.value })}
                  placeholder="np. Seniorzy 70+ z niepełnosprawnościami oraz ich opiekunowie faktyczni"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Imię i nazwisko autora / lidera:
                  </label>
                  <input
                    type="text"
                    value={step1Form.author_name}
                    onChange={(e) => setStep1Form({ ...step1Form, author_name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail do kontaktu i mentoringu:
                  </label>
                  <input
                    type="email"
                    value={step1Form.author_email}
                    onChange={(e) => setStep1Form({ ...step1Form, author_email: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  ⚡ Model AI (Groq ~1s) w następnym kroku wypełni 9 pól Canwy Innowacji na podstawie tego zarysu.
                </span>

                <button
                  type="submit"
                  disabled={canvasLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-xl shadow flex items-center gap-2 text-xs transition-all disabled:opacity-50"
                >
                  {canvasLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generowanie Canwy...</span>
                    </>
                  ) : (
                    <>
                      <span>Przejdź do Kroku 2: Generuj Canvę 3x3 z AI</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* KROK 2: CANWA INNOWACJI SPOŁECZNEJ 3x3 (EDYCJA + AUDYT AI)      */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn print:hidden">
          {/* Pasek statusu AI */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>9-Polowa Canwa Innowacji Społecznej ROPS Kraków</span>
                  {generationLatency && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">
                      Groq API: {generationLatency}ms
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300">
                  Możesz swobodnie edytować każde pole. Kliknij &quot;Audyt Logiczny AI&quot; lub przejdź od razu do wniosku grantowego.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunAudit}
                disabled={auditLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
              >
                {auditLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Audyt Logiczny AI</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToStep3}
                disabled={grantLoading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
              >
                <span>Krok 3: Generuj Wniosek</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Wynik Audytu Logicznego AI */}
          {audit && (
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Ocena Spójności Logicznej Canwy przez Mentora AI:
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-indigo-600">{audit.overall_score} / 100 pkt</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <strong className="block text-emerald-900 font-bold mb-1">Mocne strony koncepcji:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                    {audit.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <strong className="block text-amber-900 font-bold mb-1">Zalecenia i wskazówki do dopracowania:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                    {audit.logic_gaps.concat(audit.coaching_tips).slice(0, 3).map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Siatka 3x3 Canwy Innowacji */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {canvasBlocks.map((block) => (
              <div
                key={block.key}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between hover:border-amber-400 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      BLOK {block.num}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">{block.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2 leading-tight">{block.hint}</p>
                </div>

                <textarea
                  rows={4}
                  value={canvas[block.key]}
                  onChange={(e) => setCanvas({ ...canvas, [block.key]: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none transition-all resize-y"
                />
              </div>
            ))}
          </div>

          {/* Dolny pasek nawigacyjny Kroku 2 */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Wróć do Kroku 1</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToStep3}
              disabled={grantLoading}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {grantLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Kompilacja wniosku...</span>
                </>
              ) : (
                <>
                  <span>Przejdź do Kroku 3: Generuj Wniosek o Grant</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* KROK 3: WNIOSEK O DOFINANSOWANIE & EKSPORT DO PDF / DRUKU        */}
      {/* ============================================================== */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Pasek kontrolny akcji Kroku 3 (niewidoczny na wydruku) */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Krok 3: Oficjalny Wniosek o Powierzenie Grantu</span>
              </div>
              <h2 className="text-lg font-black text-white">
                Wniosek gotowy do złożenia i eksportu do formatu PDF
              </h2>
              <p className="text-xs text-slate-300">
                Poniższy dokument spełnia oficjalne wytyczne naboru ROPS Kraków (Program FEM 2021-2027).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Wybór kwoty grantu */}
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Wnioskowana kwota:</span>
                <select
                  value={grantBudget}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  className="bg-slate-900 text-amber-300 font-bold px-2 py-1 rounded border border-slate-600 focus:outline-none"
                >
                  <option value={30000}>30 000 zł</option>
                  <option value={50000}>50 000 zł (Rekomendowana)</option>
                  <option value={80000}>80 000 zł</option>
                  <option value={100000}>100 000 zł (Maksymalna)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                ← Edytuj Canvę
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Pobierz / Wydrukuj Wniosek (PDF)</span>
              </button>
            </div>
          </div>

          {/* DOKUMENT WNIOSKU: Zoptymalizowany dla formatu A4 i druku */}
          {grantApplication && (
            <div className="bg-white rounded-2xl border border-slate-300 shadow-xl p-8 sm:p-12 space-y-8 print:p-0 print:border-none print:shadow-none print:rounded-none max-w-4xl mx-auto">
              {/* Oficjalny Nagłówek ROPS Kraków */}
              <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">
                    Regionalny Ośrodek Polityki Społecznej w Krakowie
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                    WNIOSEK O POWIERZENIE GRANTU
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Inkubator Dostępności i Innowacji Społecznych ROPS Kraków 2026
                  </p>
                </div>

                <div className="sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200 print:bg-transparent print:border-none text-xs">
                  <div>
                    <span className="text-slate-500">Numer ewidencyjny:</span>{' '}
                    <strong className="font-mono text-slate-900">{grantApplication.application_id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Data złożenia:</span>{' '}
                    <strong className="text-slate-900">{grantApplication.submission_date}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Status wniosku:</span>{' '}
                    <span className="font-bold text-amber-700">Weryfikacja formalna 24/7</span>
                  </div>
                </div>
              </div>

              {/* Sekcja A: Metryka Wnioskodawcy i Inicjatywy */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 rounded mb-3 print:bg-slate-200">
                  Część A. Metryka Inicjatywy i Wnioskodawcy
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Tytuł innowacji:</span>
                    <strong className="text-slate-900 text-sm">{grantApplication.idea_title}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Wnioskodawca / Lider:</span>
                    <strong className="text-slate-900">{grantApplication.applicant_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Lokalizacja wdrożenia:</span>
                    <strong className="text-slate-900">
                      {grantApplication.gmina || 'Gmina docelowa'}, Powiat {grantApplication.powiat} (Małopolska)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Grupa docelowa (Odbiorcy):</span>
                    <strong className="text-slate-900">{grantApplication.target_group}</strong>
                  </div>
                </div>
              </div>

              {/* Sekcja B: Streszczenie i Diagnoza Problemu */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 rounded mb-3 print:bg-slate-200">
                  Część B. Diagnoza Wyzwania Społecznego i Propozycja Wartości
                </h3>
                <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                  <div>
                    <strong className="block text-slate-950 mb-1">Streszczenie koncepcji:</strong>
                    <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 print:bg-transparent">
                      {grantApplication.executive_summary}
                    </p>
                  </div>
                  <div>
                    <strong className="block text-slate-950 mb-1">Diagnoza problemu i uzasadnienie potrzeby:</strong>
                    <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 print:bg-transparent">
                      {grantApplication.problem_diagnosis}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sekcja C: Metodyka i Plan Pilotażu */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 rounded mb-3 print:bg-slate-200">
                  Część C. Plan Pilotażu i Współpraca Środowiskowa
                </h3>
                <p className="text-xs leading-relaxed text-slate-800 p-3 bg-slate-50 rounded-lg border border-slate-200 print:bg-transparent">
                  {grantApplication.detailed_methodology}
                </p>
              </div>

              {/* Sekcja D: Tabela Kosztorysu Projektu */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 rounded mb-3 print:bg-slate-200">
                  Część D. Szacunkowy Kosztorys Wdrożenia Prototypu (Budżet Grantowy)
                </h3>
                <table className="w-full text-xs border border-slate-300 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-900 print:bg-slate-200">
                    <tr>
                      <th className="p-2.5 text-left font-bold border-b border-slate-300">Kategoria kosztów</th>
                      <th className="p-2.5 text-right font-bold border-b border-slate-300 w-36">Kwota (PLN)</th>
                      <th className="p-2.5 text-right font-bold border-b border-slate-300 w-24">Udział</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {Object.entries(grantApplication.budget_breakdown).map(([category, amount], idx) => {
                      const share = Math.round((amount / grantApplication.total_budget_pln) * 100);
                      return (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium">{category}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{amount.toLocaleString('pl-PL')} zł</td>
                          <td className="p-2.5 text-right text-slate-500">{share}%</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-amber-50 font-black text-slate-950 print:bg-slate-100">
                      <td className="p-2.5">ŁĄCZNA WNIOSKOWANA KWOTA GRANTU</td>
                      <td className="p-2.5 text-right font-mono text-sm">{grantApplication.total_budget_pln.toLocaleString('pl-PL')} zł</td>
                      <td className="p-2.5 text-right">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sekcja E: Wskaźniki Sukcesu (KPI) */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 rounded mb-3 print:bg-slate-200">
                  Część E. Mierzalne Wskaźniki Rezultatu (KPI)
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
                  {grantApplication.monitoring_indicators.map((ind, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 print:bg-transparent">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sekcja F: Zarządzanie Ryzykiem */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 rounded mb-3 print:bg-slate-200">
                  Część F. Analiza Ryzyk i Działania Zapobiegawcze
                </h3>
                <div className="space-y-2 text-xs">
                  {grantApplication.risk_assessment.map((r, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 print:bg-transparent">
                      <span className="font-bold text-amber-900">⚠️ Ryzyko: </span>
                      <span className="text-slate-800">{r.risk}</span>
                      <div className="mt-1 text-slate-600">
                        <strong className="text-emerald-800">Działanie mitygujące: </strong>
                        {r.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sekcja G: Oświadczenia Formalne i Podpisy */}
              <div className="pt-4 border-t-2 border-slate-200 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 rounded print:bg-slate-200">
                  Część G. Oświadczenia Wnioskodawcy i Zgody Formalne
                </h3>
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  {grantApplication.declarations.map((dec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-slate-900 shrink-0">[{idx + 1}]</span>
                      <span>{dec}</span>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
                  <div className="border-t border-slate-400 pt-2">
                    <span className="text-slate-500 block">Miejscowość i data</span>
                    <strong className="text-slate-900">{grantApplication.gmina || 'Kraków'}, {grantApplication.submission_date}</strong>
                  </div>

                  <div className="border-t border-slate-400 pt-2">
                    <span className="text-slate-500 block">Podpis Wnioskodawcy / Lidera</span>
                    <span className="font-mono text-slate-400 italic">...................................................</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
