import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, MapPin, Users } from 'lucide-react';
import { KeywordHighlight, SimilarReportGroup } from '../../types';
import { formatDateTime } from '../../constants/domain';

/** 1 zgłoszenie, 2–4 zgłoszenia, 5+ zgłoszeń (z wyjątkiem 12–14). */
export const pluralReports = (n: number) => {
  if (n === 1) return 'zgłoszenie';
  const lastTwo = n % 100;
  const last = n % 10;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'zgłoszenia' : 'zgłoszeń';
};

/**
 * Opis użytkownika z zaznaczonymi słowami kluczowymi. <mark> jest pogrubiony i podkreślony,
 * więc wyróżnienie nie opiera się wyłącznie na kolorze (WCAG 1.4.1).
 */
export const HighlightedQuery: React.FC<{ text: string; highlights: KeywordHighlight[] }> = ({ text, highlights }) => {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  [...highlights]
    .sort((a, b) => a.start - b.start)
    .forEach((h, idx) => {
      if (h.start < cursor || h.end > text.length) return;
      if (h.start > cursor) parts.push(text.slice(cursor, h.start));
      parts.push(
        <mark
          key={`${h.start}-${idx}`}
          className="bg-amber-300 text-slate-950 font-bold underline decoration-2 underline-offset-2 rounded-sm px-0.5"
        >
          {text.slice(h.start, h.end)}
        </mark>
      );
      cursor = h.end;
    });
  if (cursor < text.length) parts.push(text.slice(cursor));

  const reasons = new Map<string, string[]>();
  highlights.forEach((h) => {
    const key = h.text.toLowerCase();
    if (!reasons.has(key)) reasons.set(key, h.reasons);
  });

  return (
    <section aria-labelledby="query-evidence-title" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
      <h2 id="query-evidence-title" className="text-lg font-bold text-slate-900">Twój opis – co z niego zrozumieliśmy</h2>
      <p className="text-base leading-relaxed text-slate-900 whitespace-pre-line">{parts}</p>
      {highlights.length > 0 ? (
        <>
          <p className="text-sm text-slate-700">
            <mark className="bg-amber-300 text-slate-950 font-bold underline decoration-2 underline-offset-2 rounded-sm px-0.5">Pogrubione i podkreślone</mark>{' '}
            słowa zdecydowały o wyniku. Dane osobowe (jeśli były) zostały zamaskowane przed analizą.
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-blue-700 underline underline-offset-2">Dlaczego te słowa?</summary>
            <ul className="mt-2 space-y-1 text-slate-800">
              {Array.from(reasons.entries()).map(([word, why]) => (
                <li key={word}>
                  <strong>{word}</strong> – {why.join('; ')}
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : (
        <p className="text-sm text-slate-700">
          Nie rozpoznaliśmy w opisie słów, które łączą się z innowacjami z katalogu. Spróbuj napisać, kogo dotyczy problem
          (np. seniorzy, młodzież, opiekunowie) i czego brakuje (np. dojazd, opieka, pomoc psychologiczna).
        </p>
      )}
    </section>
  );
};

/** Sekcja „Podobne zgłoszenia z regionu” – dane zagregowane per powiat, bez treści zgłoszeń mieszkańców. */
export const SimilarReports: React.FC<{ groups: SimilarReportGroup[]; total: number }> = ({ groups, total }) => (
  <section aria-labelledby="similar-title" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
    <div>
      <h2 id="similar-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-700" aria-hidden="true" />
        Podobne zgłoszenia z regionu
      </h2>
      <p className="text-sm text-slate-700 mt-1">
        {total > 0
          ? `Podobny problem zgłoszono już ${total} ${total === 1 ? 'raz' : 'razy'}. Pokazujemy tylko liczby i powiaty – bez treści zgłoszeń mieszkańców i bez danych osobowych.`
          : 'Nie ma jeszcze podobnych zgłoszeń – Twoje jest pierwsze. Zgłoszenie (bez danych osobowych) pomoże ROPS zobaczyć tę potrzebę.'}
      </p>
    </div>
    {groups.length > 0 && (
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {groups.map((g) => (
          <li
            key={g.powiat ?? 'brak'}
            className={`rounded-xl border p-4 text-sm ${g.is_user_powiat ? 'border-blue-600 border-2 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <span className="font-bold text-slate-900 flex flex-wrap items-center gap-1.5 min-w-0">
                <MapPin className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                {g.powiat_label}
                {g.is_user_powiat && <span className="text-xs font-semibold text-blue-800">(Twój powiat)</span>}
              </span>
              <span className="font-black text-slate-900 tabular-nums whitespace-nowrap">
                {g.count} {pluralReports(g.count)}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-1">
              {g.registry_count > 0 ? `w tym ${g.registry_count} z Rejestru Wyzwań gmin` : 'anonimowe zapytania mieszkańców'}
              {g.last_reported_at && ` · ostatnie: ${formatDateTime(g.last_reported_at)}`}
            </p>
            {g.example_titles.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-slate-800 space-y-0.5">
                {g.example_titles.map((t) => <li key={t}>{t}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    )}
  </section>
);

const ANALYSIS_STEPS = [
  'Maskujemy dane osobowe',
  'Rozpoznajemy potrzeby w opisie',
  'Porównujemy z katalogiem innowacji',
  'Przygotowujemy uzasadnienie'
];

/** Postęp analizy – kroki odpowiadają kolejnym etapom przetwarzania na serwerze (czas jest przybliżony). */
export const AnalysisProgress: React.FC = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <p role="status" aria-live="polite" className="text-sm font-bold text-slate-900 mb-3">
        Analizujemy opis: {ANALYSIS_STEPS[step].toLowerCase()}…
      </p>
      <ol className="space-y-2 text-sm">
        {ANALYSIS_STEPS.map((label, idx) => {
          const done = idx < step;
          const current = idx === step;
          return (
            <li key={label} className={`flex items-center gap-2 ${done || current ? 'text-slate-900' : 'text-slate-600'}`}>
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              ) : current ? (
                <Loader2 className="w-4 h-4 text-blue-700 animate-spin" aria-hidden="true" />
              ) : (
                <Circle className="w-4 h-4" aria-hidden="true" />
              )}
              <span className={current ? 'font-bold' : ''}>{label}</span>
              <span className="sr-only">{done ? '(gotowe)' : current ? '(w toku)' : '(czeka)'}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
