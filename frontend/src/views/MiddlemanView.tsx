import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { ServiceBlueprint } from '../types';
import {
  Building2,
  Sparkles,
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
  const initialPowiat = searchParams.get('powiat') || 'miechowski';
  const { etrMode } = useAccessibility();

  const [form, setForm] = useState({
    innovation_id: initialInn,
    municipality_name: 'Gmina Słaboszów',
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
    try {
      const result = await api.adaptService(form);
      setBlueprint(result);
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd podczas adaptacji usługi.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (searchParams.get('auto') === '1') {
      handleSubmit();
    }
  }, [searchParams]);

  const innovationsList = [
    { id: 'rops-inn-001', name: 'Mobilny Doradca Seniora' },
    { id: 'rops-inn-002', name: 'Modularna Łazienka Wytchnieniowa' },
    { id: 'rops-inn-003', name: 'koMIX Życiowy – Komiksy Terapeutyczne' },
    { id: 'rops-inn-004', name: 'Terapeuta Przestrzeni' },
    { id: 'rops-inn-006', name: 'Spółdzielnia Cyfrowa Senior+' }
  ];

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
    api.adaptService(updated).then(setBlueprint).catch(console.error);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Nagłówek */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Moduł VII: Middleman Innowacji dla Jednostek Samorządu (JST)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Dostosowanie Pomysłu do Twojej Gminy' : 'Asystent Adaptacji Innowacji do Usługi Publicznej'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Narzędzie dla wójtów, burmistrzów i dyrektorów Centrów Usług Społecznych (CUS/OPS). Wprowadź parametry gminy, a Asystent AI wygeneruje gotowy model operacyjny usługi (Service Blueprint), kalkulację budżetu oraz projekt uchwały rady gminy.
        </p>
      </div>

      {/* Szybkie profile gmin dla Jury */}
      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Szybkie profile małopolskich gmin (1 kliknięcie adaptuje usługę):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {municipalPresets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="text-xs bg-white hover:bg-indigo-50 hover:border-indigo-400 text-slate-800 font-semibold px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm transition-all"
            >
              🏛️ {p.name} ({p.pop.toLocaleString('pl-PL')} mieszk., {p.sen}% seniorów)
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Wybierz innowację z portfolio ROPS:
              </label>
              <select
                value={form.innovation_id}
                onChange={(e) => setForm({ ...form, innovation_id: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {innovationsList.map((inn) => (
                  <option key={inn.id} value={inn.id}>{inn.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nazwa Gminy / Miasta w Małopolsce:
              </label>
              <input
                type="text"
                required
                value={form.municipality_name}
                onChange={(e) => setForm({ ...form, municipality_name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Powiat:
              </label>
              <input
                type="text"
                required
                value={form.powiat}
                onChange={(e) => setForm({ ...form, powiat: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Liczba mieszkańców:
              </label>
              <input
                type="number"
                min="500"
                value={form.population}
                onChange={(e) => setForm({ ...form, population: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Odsetek seniorów 65+ (%):
              </label>
              <input
                type="number"
                step="0.5"
                value={form.senior_percentage}
                onChange={(e) => setForm({ ...form, senior_percentage: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
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
            <label htmlFor="has-cus" className="text-xs text-slate-700 font-medium">
              Gmina posiada przekształcony <strong>Centrum Usług Społecznych (CUS)</strong> (jeśli nie, usługa trafi do GOPS/MOPS).
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{loading ? 'Generowanie Pakietu Wdrożeniowego...' : 'Wygeneruj Pakiet Wdrożeniowy (Service Blueprint)'}</span>
          </button>
        </form>
      </div>

      {/* Wynik: Kompletny Service Blueprint dla Gminy */}
      {blueprint && (
        <section aria-live="polite" className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Oficjalny Pakiet Wdrożeniowy dla Samorządu
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {blueprint.title}
              </h2>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow self-start"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Drukuj / Pobierz PDF</span>
            </button>
          </div>

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
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
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
                  <strong className="text-indigo-950 font-bold">{blueprint.estimated_budget.miesieczny_koszt_utrzymania_pln.toLocaleString('pl-PL')} zł</strong>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 border-t border-indigo-200/60 pt-2">
                  <strong>Finansowanie:</strong> {blueprint.estimated_budget.rekomendowane_zrodlo}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-600" />
                Wymagania Kadrowe:
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed mb-3">
                {blueprint.staffing_requirements}
              </p>
              <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Mitygacja Ryzyk:
              </h4>
              <p className="text-[11px] text-slate-600">
                {blueprint.risk_mitigation[0]?.action}
              </p>
            </div>
          </div>

          {/* Szablon Uchwały Rady Gminy */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Gotowy Projekt Uchwały Rady Gminy:
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
                  Wirtualny Doradca Samorządowy ROPS Kraków ds. Wdrożeń
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Aktywny (Groq AI)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Zapytaj o procedury samorządowe, argumentację dla Radnych Gminy, montaż finansowy FEM 2021-2027 oraz kadrę dla {form.municipality_name}.
              </p>
            </div>
          </div>
        </div>

        {/* Sugerowane Pytania (Szybkie Prompty dla Wójta / Urzędnika / Jury) */}
        {suggestedFollowups.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              Szybkie pytania doradcze (kliknij, aby zapytać):
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
                  💬 {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Okno Rozmowy */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-96 overflow-y-auto space-y-3">
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
                  <span className="block text-[10px] text-slate-400 text-right font-mono">
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
          <input
            type="text"
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
