import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../services/api';
import { InnovationItem, ServiceBlueprint } from '../types';
import { POWIATY, SAMPLE_GMINA, powiatLabel, formatPLN } from '../constants/domain';
import {
  Building2,
  FileText,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertTriangle,
  Users,
  MessageSquare,
  Send,
  Bot,
  User,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  latencyMs?: number;
}

export const MiddlemanView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialInn = searchParams.get('inn') || 'rops-inn-001';
  const initialPowiat = POWIATY.includes(searchParams.get('powiat') || '') ? (searchParams.get('powiat') as string) : 'miechowski';
  const { etrMode } = useAccessibility();

  const [innovationsList, setInnovationsList] = useState<InnovationItem[]>([]);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    innovation_id: initialInn,
    municipality_name: SAMPLE_GMINA[initialPowiat] ?? 'Słaboszów',
    powiat: initialPowiat,
    population: 3800,
    senior_percentage: 28.5,
    annual_budget_pln: 80000,
    has_cus: false
  });

  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<ServiceBlueprint | null>(null);

  // Stan Czatu Doradcy Samorządowego AI
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: 'Dzień dobry! Jestem Wirtualnym Doradcą Samorządowym ROPS Kraków ds. Wdrożeń. Pomagam władzom gmin i dyrektorom CUS/OPS w praktycznej adaptacji innowacji: w kwestiach prawnych, uchwale rady gminy, montażu finansowym FEM 2021-2027 oraz kadrach. O co chciałbyś zapytać?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([
    'Jak przekonać Radnych Gminy do uchwały?',
    'Z jakich środków (FEM / PFRON) sfinansować wkład własny?',
    'Jakie są wymogi formalne dla kadry asystenckiej?',
    'Czy możemy zlecić usługę do OSP lub KGW?'
  ]);

  const handleSendChatMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg: ChatMsg = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: textToSend
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    if (!customText) setChatInput('');
    setChatLoading(true);

    try {
      const resp = await api.chatWithMiddlemanConsultant({
        messages: newHistory.map(m => ({ role: m.role, content: m.content })),
        innovation_id: form.innovation_id,
        municipality_name: form.municipality_name,
        powiat: form.powiat,
        population: form.population,
        senior_percentage: form.senior_percentage,
        has_cus: form.has_cus,
        annual_budget_pln: form.annual_budget_pln,
        blueprint_summary: blueprint?.summary
      });

      const assistantMsg: ChatMsg = {
        id: 'ast-' + Date.now(),
        role: 'assistant',
        content: resp.reply,
        latencyMs: resp.latency_ms
      };

      setChatMessages(prev => [...prev, assistantMsg]);
      if (resp.suggested_followups && resp.suggested_followups.length > 0) {
        setSuggestedFollowups(resp.suggested_followups);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'Przepraszam, wystąpił chwilowy błąd połączenia z serwerem doradcy. Proszę spróbować ponownie.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setFormError('');
    try {
      const result = await api.adaptService(form);
      setBlueprint(result);
    } catch (err) {
      setBlueprint(null);
      setFormError(apiErrorMessage(err, 'Nie udało się przygotować pakietu wdrożeniowego.'));
    } finally {
      setLoading(false);
    }
  };

  // Pełna lista innowacji z katalogu (deep link ?inn= działa dla każdej z nich)
  useEffect(() => {
    api
      .getInnovations()
      .then((items) => {
        setInnovationsList(items);
        if (!items.some((i) => i.id === initialInn)) {
          setFormError(`Nie znaleziono innowacji „${initialInn}” – wybierz innowację z listy.`);
          setForm((f) => ({ ...f, innovation_id: items[0]?.id ?? '' }));
        }
      })
      .catch((err) => setFormError(apiErrorMessage(err, 'Nie udało się wczytać listy innowacji.')));
  }, []);

  useEffect(() => {
    if (searchParams.get('auto') === '1') {
      handleSubmit();
    }
  }, [searchParams]);

  const municipalPresets = [
    { name: 'Gmina Słaboszów', powiat: 'miechowski', pop: 3800, sen: 28.5, inn: 'rops-inn-001', cus: false },
    { name: 'Gmina Miechów', powiat: 'miechowski', pop: 11800, sen: 24.0, inn: 'rops-inn-002', cus: true },
    { name: 'Gmina Sękowa', powiat: 'gorlicki', pop: 4900, sen: 23.0, inn: 'rops-inn-001', cus: false },
    { name: 'Gmina Krościenko n/D', powiat: 'nowotarski', pop: 6800, sen: 21.5, inn: 'rops-inn-004', cus: true },
  ];

  const handleSelectPreset = (p: typeof municipalPresets[0]) => {
    const updated = {
      innovation_id: p.inn,
      municipality_name: p.name,
      powiat: p.powiat,
      population: p.pop,
      senior_percentage: p.sen,
      annual_budget_pln: 85000,
      has_cus: p.cus
    };
    setForm(updated);
    setFormError('');
    api.adaptService(updated).then(setBlueprint).catch((err) => setFormError(apiErrorMessage(err)));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Nagłówek */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Dostosowanie pomysłu do Twojej gminy' : 'Generator pakietu wdrożeniowego dla gminy'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Narzędzie dla wójtów, burmistrzów i dyrektorów CUS/OPS. Podaj parametry gminy, a generator przygotuje plan wdrożenia,
          szacunkowy kosztorys i projekt uchwały na podstawie szablonu. Pytania szczegółowe zadasz doradcy AI poniżej.
          Dokumenty wymagają weryfikacji przez radcę prawnego gminy.
        </p>
      </div>

      {/* Szybkie profile gmin dla Jury */}
      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
        <p className="text-xs font-bold text-slate-700 mb-2">
          Przykładowe gminy – kliknij, aby wypełnić formularz:
        </p>
        <div className="flex flex-wrap gap-2">
          {municipalPresets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="text-xs bg-white hover:bg-indigo-50 hover:border-indigo-400 text-slate-800 font-semibold px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm transition-all"
            >
              {p.name} ({p.pop.toLocaleString('pl-PL')} mieszk., {p.sen}% seniorów)
            </button>
          ))}
        </div>
      </div>

      {/* Formularz Parametrów Gminy */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <h3 className="text-base font-bold text-slate-900 mb-2">Parametry wdrożenia i specyfika samorządu:</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mm-innovation" className="block text-sm font-bold text-slate-800 mb-1">
                Innowacja z katalogu
              </label>
              <select
                id="mm-innovation"
                value={form.innovation_id}
                onChange={(e) => setForm({ ...form, innovation_id: e.target.value })}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {innovationsList.map((inn) => (
                  <option key={inn.id} value={inn.id}>{inn.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mm-gmina" className="block text-sm font-bold text-slate-800 mb-1">
                Nazwa gminy (bez słowa „Gmina”)
              </label>
              <input
                id="mm-gmina"
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={form.municipality_name}
                onChange={(e) => setForm({ ...form, municipality_name: e.target.value })}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="mm-powiat" className="block text-sm font-bold text-slate-800 mb-1">
                Powiat
              </label>
              <select
                id="mm-powiat"
                value={form.powiat}
                onChange={(e) => setForm({ ...form, powiat: e.target.value, municipality_name: SAMPLE_GMINA[e.target.value] ?? form.municipality_name })}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                {POWIATY.map((p) => <option key={p} value={p}>{powiatLabel(p)}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="mm-population" className="block text-sm font-bold text-slate-800 mb-1">
                Liczba mieszkańców
              </label>
              <input
                id="mm-population"
                type="number"
                min={100}
                max={1000000}
                required
                value={form.population}
                onChange={(e) => setForm({ ...form, population: Number(e.target.value) })}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="mm-seniors" className="block text-sm font-bold text-slate-800 mb-1">
                Odsetek seniorów 65+ (%)
              </label>
              <input
                id="mm-seniors"
                type="number"
                step="0.5"
                min={0}
                max={100}
                required
                value={form.senior_percentage}
                onChange={(e) => setForm({ ...form, senior_percentage: Number(e.target.value) })}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="mm-budget" className="block text-sm font-bold text-slate-800 mb-1">
                Roczny budżet na usługę (zł)
              </label>
              <input
                id="mm-budget"
                type="number"
                step={1000}
                min={0}
                required
                value={form.annual_budget_pln}
                onChange={(e) => setForm({ ...form, annual_budget_pln: Number(e.target.value) })}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="has-cus"
              checked={form.has_cus}
              onChange={(e) => setForm({ ...form, has_cus: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="has-cus" className="text-sm text-slate-800 font-medium">
              Gmina ma <strong>Centrum Usług Społecznych (CUS)</strong> – realizatorem i adresatem uchwały będzie dyrektor CUS (w przeciwnym razie kierownik GOPS).
            </label>
          </div>

          {formError && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-200 p-3 rounded-lg">{formError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-xs disabled:opacity-50"
          >
            <span>{loading ? 'Generowanie…' : 'Wygeneruj projekt pakietu wdrożeniowego'}</span>
          </button>
        </form>
      </div>

      {/* Wynik: Kompletny Service Blueprint dla Gminy */}
      {blueprint && (
        <section aria-live="polite" className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-800">
                Projekt pakietu wdrożeniowego (dokument roboczy)
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {blueprint.title}
              </h2>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow self-start print:hidden"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Drukuj / Zapisz PDF</span>
            </button>
          </div>

          <p className="text-sm bg-amber-50 border border-amber-300 text-amber-950 p-3 rounded-xl" role="note">
            <strong>Uwaga: </strong>{blueprint.disclaimer}
          </p>

          {/* Podsumowanie */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <strong className="block text-slate-900 font-bold mb-1">Założenia Wdrożeniowe:</strong>
            {blueprint.summary}
          </div>

          {/* Harmonogram Kroków Operacyjnych */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Harmonogram Operacyjny (Etapy 1-6):
            </h3>
            <div className="space-y-2">
              {blueprint.operational_steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budżet i Kadry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
              <h3 className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                Szacunkowy Kosztorys Wdrożenia:
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Koszt uruchomienia:</span>
                  <strong className="text-indigo-950 font-bold">{blueprint.estimated_budget.koszt_uruchomienia_pln.toLocaleString('pl-PL')} zł</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Miesięczne utrzymanie:</span>
                  <strong className="text-indigo-950 font-bold">{formatPLN(blueprint.estimated_budget.miesieczny_koszt_utrzymania_pln)}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Utrzymanie rocznie:</span>
                  <strong className="text-indigo-950 font-bold">{formatPLN(blueprint.estimated_budget.roczny_koszt_utrzymania_pln)}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Efektywność:</span>
                  <strong className="text-indigo-950 font-bold text-right">{blueprint.estimated_budget.wskaznik_efektywnosci_kosztowej}</strong>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 border-t border-indigo-200/60 pt-2">
                  <strong>Finansowanie:</strong> {blueprint.estimated_budget.rekomendowane_zrodlo}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-600" />
                Wymagania Kadrowe:
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed mb-3">
                {blueprint.staffing_requirements}
              </p>
              <h4 className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                Ryzyka i działania:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-800">
                {blueprint.risk_mitigation.map((r, i) => (
                  <li key={i}><strong>{r.risk}</strong> – {r.action}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Szablon Uchwały Rady Gminy */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Projekt uchwały Rady Gminy (do weryfikacji prawnej):
            </h3>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-72 border border-slate-800">
              {blueprint.resolution_draft}
            </pre>
          </div>
        </section>
      )}

      {/* Sekcja: Wirtualny Doradca Samorządowy ROPS Kraków ds. Wdrożeń (Czat AI) */}
      <section className="bg-white rounded-2xl border border-indigo-200 shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  Doradca wdrożeniowy
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Odpowiedzi AI mają charakter pomocniczy. Zapytaj o procedury samorządowe, argumentację dla Radnych Gminy, montaż finansowy FEM 2021-2027 oraz kadrę dla {form.municipality_name}.
              </p>
            </div>
          </div>
        </div>

        {/* Sugerowane Pytania (Szybkie Prompty dla Wójta / Urzędnika / Jury) */}
        {suggestedFollowups.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              Przykładowe pytania (kliknij, aby zapytać):
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedFollowups.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChatMessage(q)}
                  disabled={chatLoading}
                  className="text-xs bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 font-medium px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors disabled:opacity-50 text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Okno Rozmowy */}
        <div role="log" aria-live="polite" aria-label="Rozmowa z doradcą" className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-96 overflow-y-auto space-y-3">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none space-y-1'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.latencyMs && (
                  <span className="block text-xs text-slate-600 text-right font-mono">
                    odpowiedź w {msg.latencyMs}ms
                  </span>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 p-3 rounded-xl border border-indigo-100 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Doradca ROPS analizuje zapytanie w kontekście {form.municipality_name}...</span>
            </div>
          )}
        </div>

        {/* Pole Wprowadzania Wiadomości */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChatMessage();
          }}
          className="flex items-center gap-2 pt-1"
        >
          <label htmlFor="mm-chat" className="sr-only">Pytanie do doradcy</label>
          <input
            id="mm-chat"
            type="text"
            maxLength={4000}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`Zadaj pytanie doradcy (np. Jak sfinansować wdrożenie w ${form.municipality_name}?)...`}
            className="flex-1 text-xs p-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || chatLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all disabled:opacity-50 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Wyślij</span>
          </button>
        </form>
      </section>
    </div>
  );
};
