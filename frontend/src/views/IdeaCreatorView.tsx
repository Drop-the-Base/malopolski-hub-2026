import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../services/api';
import { CanvasData, CanvasAudit, GrantApplication, GrantCall, FiszkaPublicStatus } from '../types';
import {
  Lightbulb,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Printer,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  ShieldCheck,
  Send,
  Copy,
  FlaskConical,
  ShieldAlert
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';
import { AUTHOR_TYPES, IMPLEMENTATION_STAGES, POWIATY, powiatLabel, formatPLN } from '../constants/domain';
import { OfficialGrantApplicationDocument } from '../components/documents/OfficialGrantApplicationDocument';
import { downloadPdfFromElement } from '../utils/pdfExport';

const EMPTY_CANVAS: CanvasData = {
  problem: '',
  target_group: '',
  value_proposition: '',
  barriers: '',
  resources: '',
  partners: '',
  testing_plan: '',
  metrics: '',
  scalability: ''
};

const canvasBlocks: Array<{ key: keyof CanvasData; label: string; hint: string; num: string }> = [
  { num: '01', key: 'problem', label: 'Problem społeczny', hint: 'Jaka niezaspokojona potrzeba dotyka mieszkańców?' },
  { num: '02', key: 'target_group', label: 'Grupa odbiorców', hint: 'Kto jest bezpośrednim odbiorcą innowacji?' },
  { num: '03', key: 'value_proposition', label: 'Wartość innowacji', hint: 'Co daje ta inicjatywa, czego brakuje w obecnych usługach?' },
  { num: '04', key: 'barriers', label: 'Bariery i ryzyka', hint: 'Jakie przeszkody mogą wystąpić i jak je pokonamy?' },
  { num: '05', key: 'resources', label: 'Lokalne zasoby', hint: 'Jakie zasoby (lokal, sprzęt, ludzie) wykorzystamy?' },
  { num: '06', key: 'partners', label: 'Partnerzy lokalni', hint: 'Np. GOPS/CUS, OSP, KGW, szkoła, NGO – podaj typy instytucji.' },
  { num: '07', key: 'testing_plan', label: 'Plan testów', hint: 'Ile osób, jak długo i jak przetestujesz prototyp?' },
  { num: '08', key: 'metrics', label: 'Mierniki sukcesu', hint: 'Mierzalne efekty: liczba osób, odsetek zadowolonych w ankiecie.' },
  { num: '09', key: 'scalability', label: 'Skalowanie', hint: 'Jak innowacja trafi do kolejnych gmin Małopolski?' }
];

// Tryb demonstracyjny (domyślnie włączony, VITE_DEMO_MODE=false wyłącza): dane kontaktowe wypełnione fikcyjnymi wartościami,
// aby jury mogło wysłać fiszkę bez wpisywania danych. W produkcji zgoda RODO musi być zaznaczana przez użytkownika.
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';
const DEMO_CONTACT = DEMO_MODE
  ? { author_name: 'Jan Przykładowy (dane demo)', author_email: 'jury.demo@example.org', author_type: 'mieszkaniec', rodo_consent: true }
  : { author_name: '', author_email: '', author_type: 'mieszkaniec', rodo_consent: false };

const juryPresets = [
  {
    label: 'Asystent seniora (Gorlice)',
    title: 'Sąsiedzka sieć asystentów seniora',
    summary: 'Seniorzy w odległych sołectwach powiatu gorlickiego mają trudności z dojazdem do ośrodka zdrowia i apteki. Chcemy stworzyć sieć przeszkolonych sąsiadów-asystentów, którzy pomagają w dojazdach i zakupach.',
    powiat: 'gorlicki',
    gmina: 'Sękowa',
    target: 'Seniorzy 70+ mieszkający samotnie i ich rodziny'
  },
  {
    label: 'Kawiarenka naprawcza (Miechów)',
    title: 'Międzypokoleniowa kawiarenka naprawcza',
    summary: 'Młodzież i seniorzy w gminie Miechów wspólnie naprawiają sprzęt codziennego użytku i rowery. To sposób na integrację pokoleń, mniejszą samotność seniorów i mniej elektrośmieci.',
    powiat: 'miechowski',
    gmina: 'Miechów',
    target: 'Seniorzy oraz młodzież szkolna'
  },
  {
    label: 'Strefa wytchnienia młodych (Oświęcim)',
    title: 'Klubowa strefa wytchnienia i mentoringu rówieśniczego',
    summary: 'Po pandemii młodzież w Oświęcimiu przeżywa kryzysy emocjonalne i nie ma bezpiecznego miejsca do rozmowy. Tworzymy strefę w domu kultury z dyżurem psychologa i mentoringiem rówieśniczym.',
    powiat: 'oświęcimski',
    gmina: 'Oświęcim',
    target: 'Młodzież 13–19 lat oraz ich rodzice'
  }
];

export const IdeaCreatorView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialProblem = searchParams.get('problem') || '';
  const initialPowiat = searchParams.get('powiat') || '';
  const { etrMode } = useAccessibility();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // KROK 1: Fiszka pomysłu
  const [step1Form, setStep1Form] = useState({
    title: '',
    summary: initialProblem,
    powiat: initialPowiat,
    gmina: '',
    target_audience: '',
    implementation_stage: 'pomysl',
    ...DEMO_CONTACT
  });
  const [fiszkaSubmitting, setFiszkaSubmitting] = useState(false);
  const [fiszkaResult, setFiszkaResult] = useState<FiszkaPublicStatus | null>(null);
  const [step1Error, setStep1Error] = useState('');

  // KROK 2: Canwa
  const [canvas, setCanvas] = useState<CanvasData>(EMPTY_CANVAS);
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [canvasNotice, setCanvasNotice] = useState('');
  const [audit, setAudit] = useState<CanvasAudit | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // KROK 3: Szkic wniosku
  const [calls, setCalls] = useState<GrantCall[]>([]);
  const [callId, setCallId] = useState('');
  const [grantBudget, setGrantBudget] = useState(30000);
  const [grantApplication, setGrantApplication] = useState<GrantApplication | null>(null);
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantError, setGrantError] = useState('');
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState('');
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .getGrantCalls()
      .then((list) => {
        setCalls(list);
        const open = list.find((c) => c.is_open);
        if (open) {
          setCallId(open.id);
          setGrantBudget(Math.min(open.max_budget_pln, Math.max(open.min_budget_pln, 30000)));
        }
      })
      .catch(() => undefined);
  }, []);

  const selectedCall = calls.find((c) => c.id === callId);

  const handleSelectPreset = (p: typeof juryPresets[0]) => {
    setStep1Form({ ...step1Form, title: p.title, summary: p.summary, powiat: p.powiat, gmina: p.gmina, target_audience: p.target });
  };

  // Wysłanie fiszki do ROPS (24/7)
  const handleSubmitFiszka = async () => {
    setStep1Error('');
    if (!step1Form.powiat) {
      setStep1Error('Wybierz powiat.');
      return;
    }
    setFiszkaSubmitting(true);
    try {
      const res = await api.submitFiszka({
        title: step1Form.title,
        summary: step1Form.summary,
        target_audience: step1Form.target_audience,
        implementation_stage: step1Form.implementation_stage,
        author_name: step1Form.author_name,
        author_email: step1Form.author_email,
        author_type: step1Form.author_type,
        powiat: step1Form.powiat,
        rodo_consent: step1Form.rodo_consent
      });
      setFiszkaResult(res);
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch {
        /* ignoruj */
      }
    } catch (err) {
      setStep1Error(apiErrorMessage(err, 'Nie udało się wysłać fiszki.'));
    } finally {
      setFiszkaSubmitting(false);
    }
  };

  const onStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitFiszka();
  };

  // Przejście do Kroku 2: autouzupełnienie Canwy przez LLM
  const handleProceedToStep2 = async () => {
    setCurrentStep(2);
    if (Object.values(canvas).some((v) => v.trim())) return; // nie nadpisuj edytowanej Canwy
    if (step1Form.summary.trim().length < 4) {
      setCanvasNotice('Wpisz opis pomysłu w kroku 1, aby AI mogła wypełnić Canwę – albo uzupełnij pola ręcznie.');
      return;
    }
    setCanvasLoading(true);
    setCanvasNotice('');
    try {
      const res = await api.autofillCanvas(step1Form.summary, step1Form.powiat || undefined, step1Form.target_audience || undefined);
      const { idea_title, ai_powered, latency_ms, ...fields } = res;
      setCanvas(fields);
      if (!step1Form.title.trim()) setStep1Form((f) => ({ ...f, title: idea_title }));
      setCanvasNotice(
        ai_powered
          ? `Pola wypełnił model językowy w ${(latency_ms / 1000).toFixed(1)} s. Sprawdź je – AI może się mylić.`
          : 'Model językowy jest niedostępny – pola wypełniono szablonem. Dostosuj je do swojego pomysłu.'
      );
    } catch (err) {
      setCanvasNotice(apiErrorMessage(err, 'Nie udało się wypełnić Canwy automatycznie. Uzupełnij pola ręcznie.'));
    } finally {
      setCanvasLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditLoading(true);
    try {
      setAudit(await api.evaluateCanvas(canvas));
    } catch (err) {
      setCanvasNotice(apiErrorMessage(err, 'Nie udało się sprawdzić Canwy.'));
    } finally {
      setAuditLoading(false);
    }
  };

  const generateGrant = async (budget = grantBudget, call = callId) => {
    setGrantLoading(true);
    setGrantError('');
    try {
      const app = await api.generateGrantApplication({
        call_id: call,
        idea_title: step1Form.title || 'Pomysł bez tytułu',
        summary: step1Form.summary,
        target_group: step1Form.target_audience || canvas.target_group || 'mieszkańcy',
        powiat: step1Form.powiat || undefined,
        gmina: step1Form.gmina || undefined,
        author_name: step1Form.author_name || undefined,
        requested_budget_pln: budget,
        canvas_data: canvas
      });
      setGrantApplication(app);
    } catch (err) {
      setGrantApplication(null);
      setGrantError(apiErrorMessage(err, 'Nie udało się przygotować szkicu wniosku.'));
    } finally {
      setGrantLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!documentRef.current || !grantApplication) return;
    setPdfExporting(true);
    setPdfSuccessMessage('');
    try {
      const sanitizedId = (grantApplication.application_id || '2026').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Wniosek_Grantowy_ROPS_${sanitizedId}.pdf`;
      await downloadPdfFromElement(documentRef.current, {
        filename,
        title: `Wniosek Grantowy ROPS - ${grantApplication.idea_title}`
      });
      setPdfSuccessMessage(`Pobrano oficjalny plik: ${filename}`);
      setTimeout(() => setPdfSuccessMessage(''), 6000);
    } catch (err) {
      console.error('Błąd generowania pliku PDF:', err);
      alert('Nie udało się bezpośrednio wygenerować pliku PDF. Możesz skorzystać z opcji "Drukuj wniosek (A4)", aby zapisać dokument jako PDF za pomocą systemowego dialogu.');
    } finally {
      setPdfExporting(false);
    }
  };

  const handleProceedToStep3 = () => {
    setCurrentStep(3);
    if (callId) generateGrant();
  };

  const stepButton = (n: 1 | 2 | 3, title: string) => (
    <button
      type="button"
      onClick={() => (n === 2 ? handleProceedToStep2() : n === 3 ? handleProceedToStep3() : setCurrentStep(1))}
      aria-current={currentStep === n ? 'step' : undefined}
      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
        currentStep === n ? 'bg-amber-50 border-amber-600 text-amber-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
      }`}
    >
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${currentStep === n ? 'bg-amber-600 text-white' : 'bg-slate-300 text-slate-800'}`}>
        {n}
      </span>
      <span>
        <span className="block text-xs font-bold text-slate-600">Krok {n}</span>
        <span className="block text-sm font-bold">{title}</span>
      </span>
    </button>
  );

  const inputCls = 'w-full text-sm p-3 rounded-xl border border-slate-300 text-slate-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 focus:outline-none';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <Lightbulb className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
          <span>Moduł III: Kreator Pomysłów</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Zgłoś swój pomysł' : 'Fiszka pomysłu, Canwa innowacji i szkic wniosku'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          {etrMode
            ? 'Opisz pomysł. Wyślij go do ROPS. Dostaniesz numer i odpowiedź e-mailem.'
            : 'Krok 1: wyślij fiszkę pomysłu do ROPS (24/7) i śledź jej status. Krok 2: rozwiń pomysł w 9-polowej Canwie (z autouzupełnianiem AI). Krok 3: przygotuj szkic wniosku na otwarty nabór.'}
        </p>

        <nav aria-label="Kroki kreatora" className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
          {stepButton(1, 'Fiszka pomysłu')}
          {stepButton(2, 'Canwa innowacji')}
          {stepButton(3, 'Szkic wniosku i wydruk')}
        </nav>
      </div>

      {/* KROK 1 */}
      {currentStep === 1 && (
        <div className="space-y-6 print:hidden">
          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-800">
              <Zap className="w-4 h-4 text-amber-700" aria-hidden="true" />
              <span>Przykładowe pomysły (wypełniają opis – dane kontaktowe podajesz sam/sama):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {juryPresets.map((pr) => (
                <button
                  key={pr.label}
                  type="button"
                  onClick={() => handleSelectPreset(pr)}
                  className="text-sm bg-white hover:bg-amber-50 hover:border-amber-500 text-slate-900 font-semibold px-3 py-1.5 rounded-xl border border-slate-300"
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {fiszkaResult ? (
            <div role="status" className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-black text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" aria-hidden="true" /> Fiszka wysłana do ROPS i modułu testowania
                </h2>
                <span className="text-xs bg-emerald-200 text-emerald-900 font-bold px-2.5 py-1 rounded-full">
                  ID: {fiszkaResult.id}
                </span>
              </div>

              <p className="text-sm text-emerald-950 leading-relaxed">
                Dziękujemy za zgłoszenie pomysłu <strong>„{fiszkaResult.title}”</strong>. Twój wniosek trafił natychmiast do bazy ROPS oraz 
                <strong> do modułu testowania i głosowania mieszkańców</strong>, gdzie inni użytkownicy mogą poprzeć Twoją innowację!
              </p>

              {/* Baner ulotności zgłoszenia */}
              <div className="bg-amber-100/80 border border-amber-300 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="leading-relaxed">
                  <strong>Ochrona prywatności i sesyjność:</strong> Szczegóły tego potwierdzenia są widoczne wyłącznie podczas tej aktywnej wizyty na podstronie. Jeśli przejdziesz do innego modułu lub odświeżysz okno, ze względów bezpieczeństwa powrót do formularza z tymi danymi nie będzie możliwy.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Link
                  to="/tester"
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 shadow"
                >
                  <FlaskConical className="w-4 h-4" aria-hidden="true" />
                  Przejdź do głosowania w Testerze →
                </Link>

                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm"
                >
                  Rozwiń pomysł w Canwie →
                </button>

                <Link
                  to={`/status/${fiszkaResult.id}`}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-3.5 py-2.5 rounded-xl text-sm"
                >
                  Śledź status
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setFiszkaResult(null);
                    setStep1Form({
                      title: '',
                      summary: '',
                      powiat: '',
                      gmina: '',
                      target_audience: '',
                      implementation_stage: 'pomysl',
                      ...DEMO_CONTACT
                    });
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 underline ml-auto py-2"
                >
                  Zgłoś kolejny pomysł
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <form onSubmit={onStep1Submit} className="space-y-5">
                <div>
                  <label htmlFor="f-title" className="block text-sm font-bold text-slate-900 mb-1">1. Tytuł roboczy pomysłu</label>
                  <input id="f-title" type="text" required minLength={3} maxLength={160} value={step1Form.title}
                    onChange={(e) => setStep1Form({ ...step1Form, title: e.target.value })}
                    placeholder="np. Sąsiedzka sieć asystentów seniora" className={inputCls} />
                </div>

                <div>
                  <label htmlFor="f-summary" className="block text-sm font-bold text-slate-900 mb-1">2. Opis problemu i pomysłu (1–3 zdania)</label>
                  <textarea id="f-summary" rows={3} required minLength={10} maxLength={4000} value={step1Form.summary}
                    onChange={(e) => setStep1Form({ ...step1Form, summary: e.target.value })}
                    aria-describedby="f-summary-count"
                    placeholder="Na czym polega problem mieszkańców, co chcesz zorganizować i jaki będzie efekt?" className={`${inputCls} resize-y`} />
                  <span id="f-summary-count" className="text-xs text-slate-600">{step1Form.summary.length}/4000 znaków</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="f-powiat" className="block text-sm font-bold text-slate-900 mb-1">3. Powiat</label>
                    <select id="f-powiat" required value={step1Form.powiat}
                      onChange={(e) => setStep1Form({ ...step1Form, powiat: e.target.value })} className={`${inputCls} bg-white`}>
                      <option value="">— wybierz —</option>
                      {POWIATY.map((p) => <option key={p} value={p}>{powiatLabel(p)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="f-gmina" className="block text-sm font-bold text-slate-900 mb-1">4. Gmina / miejscowość</label>
                    <input id="f-gmina" type="text" maxLength={120} value={step1Form.gmina}
                      onChange={(e) => setStep1Form({ ...step1Form, gmina: e.target.value })} placeholder="np. Sękowa" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="f-stage" className="block text-sm font-bold text-slate-900 mb-1">5. Etap realizacji</label>
                    <select id="f-stage" value={step1Form.implementation_stage}
                      onChange={(e) => setStep1Form({ ...step1Form, implementation_stage: e.target.value })} className={`${inputCls} bg-white`}>
                      {IMPLEMENTATION_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="f-target" className="block text-sm font-bold text-slate-900 mb-1">6. Odbiorcy (grupa docelowa)</label>
                  <input id="f-target" type="text" required minLength={2} maxLength={300} value={step1Form.target_audience}
                    onChange={(e) => setStep1Form({ ...step1Form, target_audience: e.target.value })}
                    placeholder="np. Seniorzy 70+ mieszkający samotnie" className={inputCls} />
                </div>

                <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <legend className="text-sm font-bold text-slate-900 mb-2">
                    7. Dane kontaktowe (widoczne tylko dla koordynatora ROPS)
                    {DEMO_MODE && <span className="ml-2 text-xs font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">wersja demo – wypełnione fikcyjnymi danymi</span>}
                  </legend>
                  <div>
                    <label htmlFor="f-author" className="block text-sm font-semibold text-slate-800 mb-1">Imię i nazwisko / nazwa organizacji</label>
                    <input id="f-author" type="text" required minLength={2} autoComplete="name" value={step1Form.author_name}
                      onChange={(e) => setStep1Form({ ...step1Form, author_name: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="f-email" className="block text-sm font-semibold text-slate-800 mb-1">E-mail</label>
                    <input id="f-email" type="email" required autoComplete="email" value={step1Form.author_email}
                      onChange={(e) => setStep1Form({ ...step1Form, author_email: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="f-type" className="block text-sm font-semibold text-slate-800 mb-1">Zgłaszam jako</label>
                    <select id="f-type" value={step1Form.author_type}
                      onChange={(e) => setStep1Form({ ...step1Form, author_type: e.target.value })} className={`${inputCls} bg-white`}>
                      {AUTHOR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </fieldset>

                <label className="flex items-start gap-2 text-sm text-slate-800">
                  <input type="checkbox" required checked={step1Form.rodo_consent}
                    onChange={(e) => setStep1Form({ ...step1Form, rodo_consent: e.target.checked })} className="mt-1" />
                  <span>
                    Wyrażam zgodę na przetwarzanie moich danych kontaktowych przez koordynatora Hubu w celu rozpatrzenia pomysłu i kontaktu ze mną (RODO).
                    Dane nie są publikowane. Zgodę mogę wycofać w każdej chwili.
                  </span>
                </label>

                {step1Error && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-200 p-3 rounded-lg">{step1Error}</p>}

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button type="button" onClick={handleProceedToStep2}
                    className="border border-slate-300 hover:bg-slate-100 text-slate-900 font-bold px-5 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                    Pomiń wysyłkę – przejdź do Canwy <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button type="submit" disabled={fiszkaSubmitting}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl shadow flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                    {fiszkaSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
                    Wyślij fiszkę do ROPS
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* KROK 2 */}
      {currentStep === 2 && (
        <div className="space-y-6 print:hidden">
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" aria-hidden="true" /> Canwa Innowacji Społecznej (9 pól)
              </h2>
              <p className="text-sm text-slate-200">Edytuj każde pole. „Sprawdź Canwę” uruchamia automatyczną checklistę (reguły, nie ocena eksperta).</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handleRunAudit} disabled={auditLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 disabled:opacity-60">
                {auditLoading ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="w-4 h-4" aria-hidden="true" />}
                Sprawdź Canwę
              </button>
              <button type="button" onClick={() => window.print()}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5">
                <Printer className="w-4 h-4" aria-hidden="true" /> Drukuj
              </button>
            </div>
          </div>

          <div aria-live="polite">
            {canvasLoading && <p className="text-sm text-slate-700 flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> AI wypełnia Canwę…</p>}
            {canvasNotice && !canvasLoading && <p className="text-sm bg-amber-50 border border-amber-200 text-amber-950 p-3 rounded-xl">{canvasNotice}</p>}
          </div>

          {audit && (
            <section aria-labelledby="audit-title" className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 id="audit-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-700" aria-hidden="true" /> Automatyczna checklista Canwy
                </h3>
                <span className="text-xl font-black text-indigo-800">{audit.overall_score} / 100</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <h4 className="text-emerald-950 font-bold mb-1">Spełnione kryteria</h4>
                  <ul className="list-disc pl-5 space-y-0.5 text-emerald-950">
                    {audit.strengths.length ? audit.strengths.map((s, i) => <li key={i}>{s}</li>) : <li>Brak – uzupełnij pola Canwy.</li>}
                  </ul>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <h4 className="text-amber-950 font-bold mb-1">Do poprawy</h4>
                  <ul className="list-disc pl-5 space-y-0.5 text-amber-950">
                    {audit.logic_gaps.concat(audit.coaching_tips).map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
                <h4 className="font-bold text-slate-900 mb-1">Opis do wizualizacji (wklej do generatora obrazów)</h4>
                <p className="text-slate-800">{audit.visual_concept_prompt}</p>
                <button type="button" className="mt-2 text-sm font-bold text-blue-700 flex items-center gap-1"
                  onClick={() => {
                    navigator.clipboard?.writeText(audit.visual_concept_prompt).then(() => setCopied(true)).catch(() => undefined);
                  }}>
                  <Copy className="w-4 h-4" aria-hidden="true" /> {copied ? 'Skopiowano' : 'Kopiuj opis'}
                </button>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {canvasBlocks.map((block) => (
              <div key={block.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                <div>
                  <label htmlFor={`canvas-${block.key}`} className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded">{block.num}</span>
                    <span className="text-sm font-bold text-slate-900">{block.label}</span>
                  </label>
                  <p id={`canvas-${block.key}-hint`} className="text-xs text-slate-600 mb-2 leading-tight">{block.hint}</p>
                </div>
                <textarea
                  id={`canvas-${block.key}`}
                  aria-describedby={`canvas-${block.key}-hint`}
                  rows={4}
                  value={canvas[block.key]}
                  onChange={(e) => setCanvas({ ...canvas, [block.key]: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:border-amber-600 focus:outline-none resize-y"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button type="button" onClick={() => setCurrentStep(1)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Wróć do fiszki
            </button>
            <button type="button" onClick={handleProceedToStep3}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-md">
              Przygotuj szkic wniosku <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* KROK 3 */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 print:hidden">
            <div>
              <h2 className="text-lg font-black text-white">Szkic wniosku na wybrany nabór</h2>
              <p className="text-sm text-slate-200">
                Generator działa tylko dla otwartych naborów i pilnuje ich limitów kwot. Szkic zbudowano z Twojej Canwy – braki są oznaczone „DO UZUPEŁNIENIA”.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="g-call" className="block text-xs font-bold text-slate-200 mb-1">Nabór</label>
                <select id="g-call" value={callId}
                  onChange={(e) => {
                    setCallId(e.target.value);
                    const c = calls.find((x) => x.id === e.target.value);
                    if (c) {
                      const b = Math.min(c.max_budget_pln, Math.max(c.min_budget_pln, grantBudget));
                      setGrantBudget(b);
                      if (c.is_open) generateGrant(b, c.id);
                    }
                  }}
                  className="bg-slate-800 text-white text-sm px-2 py-2 rounded border border-slate-600 max-w-xs">
                  {calls.map((c) => (
                    <option key={c.id} value={c.id} disabled={!c.is_open}>
                      {c.title}{c.is_open ? '' : ' – zamknięty'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="g-budget" className="block text-xs font-bold text-slate-200 mb-1">
                  Kwota (zł){selectedCall ? ` · limit ${formatPLN(selectedCall.min_budget_pln)}–${formatPLN(selectedCall.max_budget_pln)}` : ''}
                </label>
                <input id="g-budget" type="number" step={1000}
                  min={selectedCall?.min_budget_pln ?? 1000} max={selectedCall?.max_budget_pln ?? 1000000}
                  value={grantBudget} onChange={(e) => setGrantBudget(Number(e.target.value))}
                  className="bg-slate-800 text-white text-sm px-2 py-2 rounded border border-slate-600 w-36" />
              </div>
              <button type="button" onClick={() => generateGrant()} disabled={grantLoading || !selectedCall?.is_open}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-60">
                {grantLoading ? 'Przeliczanie…' : 'Przelicz szkic'}
              </button>
              <button type="button" onClick={() => setCurrentStep(2)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                ← Edytuj Canwę
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={!grantApplication || pdfExporting}
                aria-busy={pdfExporting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2 rounded-lg text-sm flex items-center gap-2 shadow-md hover:shadow-emerald-900/30 transition-all disabled:opacity-60"
              >
                {pdfExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Generowanie pliku PDF…</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>Pobierz oficjalny PDF (.pdf)</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!grantApplication}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow transition-all disabled:opacity-60"
              >
                <Printer className="w-4 h-4" aria-hidden="true" /> Drukuj wniosek (A4)
              </button>
            </div>
            {selectedCall && (
              <p className="text-xs text-slate-200">
                Nabór otwarty od {selectedCall.opens_on} do {selectedCall.closes_on}. Kryteria: {selectedCall.criteria.join('; ')}.
              </p>
            )}
            {pdfSuccessMessage && (
              <div role="status" className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs py-2 px-3 rounded-lg flex items-center gap-2 font-medium print:hidden">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{pdfSuccessMessage}</span>
              </div>
            )}
          </div>

          <div aria-live="polite">
            {grantError && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-200 p-3 rounded-lg print:hidden">{grantError}</p>}
          </div>

          {grantApplication && grantApplication.missing_elements.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-sm text-amber-950 print:hidden">
              <strong className="flex items-center gap-1.5 mb-1"><AlertCircle className="w-4 h-4" aria-hidden="true" /> Wniosek kompletny w {grantApplication.completeness_pct}% – uzupełnij:</strong>
              <ul className="list-disc pl-5">{grantApplication.missing_elements.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}

          {grantApplication && (
            <OfficialGrantApplicationDocument
              application={grantApplication}
              documentRef={documentRef}
            />
          )}
        </div>
      )}
    </div>
  );
};
