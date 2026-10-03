import React, { useState } from 'react';
import { CanvasData, CanvasAudit } from '../../types';
import { api } from '../../services/api';
import { Sparkles, CheckCircle2, AlertCircle, Zap, RefreshCw, ArrowRight } from 'lucide-react';
import { useAccessibility } from '../../store/useAccessibilityStore';

interface CanvasProps {
  initialData?: Partial<CanvasData>;
  onSave?: (data: CanvasData) => void;
}

export const SocialInnovationCanvas: React.FC<CanvasProps> = ({ initialData, onSave }) => {
  const { etrMode } = useAccessibility();
  const [canvas, setCanvas] = useState<CanvasData>({
    problem: initialData?.problem || 'Starsze osoby w małych wsiach są odcięte od opieki zdrowotnej i leków.',
    target_group: initialData?.target_group || 'Seniorzy 70+ mieszkający samotnie w gospodarstwach wiejskich.',
    value_proposition: initialData?.value_proposition || 'Sąsiedzka sieć mobilnego wsparcia lekowego i teleopieki.',
    barriers: initialData?.barriers || 'Brak zasięgu komórkowego w dolinach i nieufność osób starszych.',
    resources: initialData?.resources || 'Lokalna remiza OSP, wolontariusze z liceum, samochód sołtysa.',
    partners: initialData?.partners || 'Gminny Ośrodek Pomocy Społecznej (GOPS), Koło Gospodyń Wiejskich.',
    testing_plan: initialData?.testing_plan || '1-miesięczny test z 15 seniorami w 2 sołectwach.',
    metrics: initialData?.metrics || 'Liczba 50 dowiezionych recept, 100% zadowolenia w ankiecie SUS.',
    scalability: initialData?.scalability || 'Rozszerzenie na cały powiat po włączeniu do programu CUS.'
  });

  const [loading, setLoading] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [generationInfo, setGenerationInfo] = useState<{ title: string; latencyMs: number; aiPowered: boolean } | null>(null);
  const [audit, setAudit] = useState<CanvasAudit | null>(null);

  const presets = [
    { label: '☕ Kawiarenka Naprawcza (Nowy Sącz)', prompt: 'Kawiarenka naprawcza dla seniorów i młodzieży w Nowym Sączu' },
    { label: '🚐 Asystent Seniora (Podhale)', prompt: 'Mobilny asystent seniora i transport medyczny w gminach tatrzańskich' },
    { label: '⚡ Spółdzielnia Energetyczna (Miechów)', prompt: 'Sąsiedzka spółdzielnia energetyczna i walka z ubóstwem energetycznym w Miechowie' }
  ];

  const handleAutofill = async (customPrompt?: string) => {
    const textToUse = customPrompt || promptInput;
    if (!textToUse.trim()) return;

    setAutofilling(true);
    try {
      const res = await api.autofillCanvas(textToUse);
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
      setGenerationInfo({
        title: res.idea_title,
        latencyMs: res.latency_ms,
        aiPowered: res.ai_powered
      });
      if (customPrompt) setPromptInput(customPrompt);
    } catch (err) {
      console.error(err);
      alert('Nie udało się wygenerować Canwy z AI.');
    } finally {
      setAutofilling(false);
    }
  };

  const handleChange = (field: keyof CanvasData, value: string) => {
    setCanvas((prev) => ({ ...prev, [field]: value }));
  };

  const handleAudit = async () => {
    setLoading(true);
    try {
      const result = await api.evaluateCanvas(canvas);
      setAudit(result);
      if (onSave) onSave(canvas);
    } catch (err) {
      console.error(err);
      alert('Nie udało się przeprowadzić audytu AI.');
    } finally {
      setLoading(false);
    }
  };

  const fields: Array<{ key: keyof CanvasData; label: string; etrLabel: string; hint: string }> = [
    { key: 'problem', label: '1. Problem Społeczny', etrLabel: 'Co jest nie tak?', hint: 'Jaka trudność dotyka mieszkańców?' },
    { key: 'target_group', label: '2. Grupa Docelowa', etrLabel: 'Komu pomagamy?', hint: 'Dla kogo tworzysz to rozwiązanie?' },
    { key: 'value_proposition', label: '3. Wartość Innowacji', etrLabel: 'Jakie jest rozwiązanie?', hint: 'Co konkretnie zmieni ta innowacja?' },
    { key: 'barriers', label: '4. Bariery i Ryzyka', etrLabel: 'Co może pójść nie tak?', hint: 'Czego się obawiasz?' },
    { key: 'resources', label: '5. Lokalne Zasoby', etrLabel: 'Co już mamy na miejscu?', hint: 'Budynki, sprzęt, zaufanie sąsiadów' },
    { key: 'partners', label: '6. Partnerzy', etrLabel: 'Kto nam pomoże?', hint: 'Gmina, szkoła, OSP, Koło Gospodyń' },
    { key: 'testing_plan', label: '7. Plan Testowania', etrLabel: 'Jak to sprawdzimy?', hint: 'Jak przetestujesz prototyp w mikroskali?' },
    { key: 'metrics', label: '8. Mierniki Sukcesu', etrLabel: 'Po czym poznamy, że działa?', hint: 'Liczby, ankiety zadowolenia, wskaźniki' },
    { key: 'scalability', label: '9. Skalowanie', etrLabel: 'Jak pomóc większej liczbie ludzi?', hint: 'Czy pomysł da się przenieść do innych gmin?' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Sekcja AI Fast-Track: Uzupełnianie z 1 zdania */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 p-5 rounded-2xl border-2 border-amber-400/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm">
              <Zap className="w-4 h-4 fill-white" />
            </span>
            <div>
              <h4 className="text-sm font-black text-slate-900 tracking-tight">
                AI Auto-Fill Canwy (1-Click Groq Fast-Track dla Jury)
              </h4>
              <p className="text-xs text-slate-600">
                Wpisz 1 zdanie o pomyśle lub kliknij gotowy scenariusz – model wypełni wszystkie 9 pól Canwy ROPS w ~1s.
              </p>
            </div>
          </div>

          {generationInfo && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-bold self-start md:self-auto border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {generationInfo.aiPowered ? '⚡ Groq AI (openai/gpt-oss-20b)' : '⚡ Błyskawiczny Silnik Lokalny'}: {generationInfo.latencyMs}ms
              </span>
            </div>
          )}
        </div>

        {/* Gotowe presety dla Jury */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[11px] font-bold text-slate-500 self-center mr-1">Szybkie scenariusze:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAutofill(p.prompt)}
              disabled={autofilling}
              className="text-xs bg-white hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm transition-all flex items-center gap-1"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input z przyciskiem generowania */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAutofill()}
            placeholder="Wpisz dowolny pomysł, np. Mobilna opieka wytchnieniowa dla opiekunów osób niesamodzielnych..."
            className="flex-1 text-xs sm:text-sm p-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
          <button
            type="button"
            onClick={() => handleAutofill()}
            disabled={autofilling || !promptInput.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-black font-black px-5 py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {autofilling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generowanie...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generuj Canwę (AI ~1s)</span>
              </>
            )}
          </button>
        </div>

        {generationInfo && (
          <p className="text-xs font-semibold text-amber-900 mt-2">
            Wygenerowany tytuł: <strong className="text-slate-950 font-black">"{generationInfo.title}"</strong>
          </p>
        )}
      </div>

      {/* Nagłówek Canwy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200 pt-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-amber-500 text-white flex items-center justify-center text-xs font-black">9</span>
            {etrMode ? 'Tabela Twojego Pomysłu (9 Pól)' : 'Canwa Innowacji Społecznych ROPS Kraków'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Przejrzyj pola poniżej, a następnie kliknij audyt AI, aby sprawdzić spójność logiczną i wygenerować prompt wizualizatora.
          </p>
        </div>

        <button
          onClick={handleAudit}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          {loading ? 'Audytowanie Canwy...' : 'Audytuj z Asystentem AI'}
        </button>
      </div>

      {/* Siatka 9 pól Canwy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {fields.map((f) => (
          <div
            key={f.key}
            className={`bg-slate-50 border rounded-xl p-3.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all ${
              generationInfo ? 'border-amber-300 shadow-sm' : 'border-slate-200'
            }`}
          >
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {etrMode ? f.etrLabel : f.label}
            </label>
            <p className="text-[11px] text-slate-500 mb-2 leading-tight">{f.hint}</p>
            <textarea
              rows={4}
              value={canvas[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
              placeholder={`Wpisz treść...`}
            />
          </div>
        ))}
      </div>

      {/* Wyniki Audytu Asystenta AI */}
      {audit && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-900 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800 pb-4 mb-4">
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Raport Audytora AI ROPS</span>
              <h4 className="text-xl font-black">Ocena Gotowości Innowacji</h4>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300">Wynik spójności logicznej:</span>
              <span className="text-3xl font-black text-amber-400">{audit.overall_score} / 100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Mocne strony */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Mocne strony Canwy:
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {audit.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Luki logiczne */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Luki logiczne do poprawy:
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {audit.logic_gaps.map((g, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Koncept wizualizatora prototypu */}
          <div className="bg-indigo-900/60 p-4 rounded-xl border border-indigo-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Koncepcja Wizualna Prototypu (Prompt dla Generatora Grafik / Wizualizatora):
              </h5>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(audit.visual_concept_prompt);
                  alert('Skopiowano prompt wizualizatora prototypu do schowka!');
                }}
                className="bg-indigo-800 hover:bg-indigo-700 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-indigo-600 transition-colors flex items-center gap-1"
                title="Kopiuj prompt do schowka"
              >
                <span>Kopiuj Prompt AI</span>
              </button>
            </div>
            <p className="text-xs text-slate-200 italic leading-relaxed">
              "{audit.visual_concept_prompt}"
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-800 text-[11px]">
              <span className="bg-indigo-950 px-2 py-0.5 rounded text-indigo-300">Poziom dojrzałości: TRL 4 (Prototyp w skali laboratoryjnej/mikrospołecznej)</span>
              <span className="bg-indigo-950 px-2 py-0.5 rounded text-emerald-300">Zgodność: Inkubator Włączenia Społecznego ROPS Kraków</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
