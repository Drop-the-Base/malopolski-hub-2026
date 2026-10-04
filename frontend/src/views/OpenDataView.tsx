import React, { useEffect, useState } from 'react';
import { Database, Download, FileJson, Webhook } from 'lucide-react';

const API = '/api/v1/open';

const RESOURCES = [
  {
    key: 'innovations',
    title: 'Katalog innowacji',
    description: 'Opublikowane innowacje społeczne: opis, grupy docelowe, gotowość, budżet, wersja łatwa do czytania.',
    params: 'page, page_size (1–100), category'
  },
  {
    key: 'challenges',
    title: 'Wyzwania powiatów',
    description: 'Wskaźniki i kluczowe wyzwanie każdego z 22 powiatów Małopolski (Mapa Wyzwań).',
    params: 'page, page_size (1–100)'
  },
  {
    key: 'needs',
    title: 'Potrzeby zagregowane',
    description: 'Liczba zgłoszeń per powiat i obszar. Tylko liczby – bez treści zgłoszeń i bez danych osobowych.',
    params: 'page, page_size (1–100)'
  }
];

const EXAMPLE = `const res = await fetch('${API}/innovations?page=1&page_size=20&category=seniorzy');
const { items, total, next } = await res.json();`;

/** Strona „Dla deweloperów / Otwarte dane” – opis otwartego API i webhooka. */
export const OpenDataView: React.FC = () => {
  const [totals, setTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    RESOURCES.forEach((r) => {
      fetch(`${API}/${r.key}?page_size=1`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setTotals((t) => ({ ...t, [r.key]: data.total })))
        .catch(() => undefined);
    });
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1.5">
          <Database className="w-4 h-4" aria-hidden="true" /> Dla deweloperów
        </p>
        <h1 className="text-3xl font-black text-slate-900 mb-3">Otwarte dane i integracje</h1>
        <p className="text-base text-slate-700 leading-relaxed max-w-prose">
          Dane z Hubu można pobrać do własnego systemu, arkusza albo serwisu gminy – bez logowania. API jest tylko do
          odczytu, zwraca JSON lub CSV, ma stronicowanie i działa z dowolnej domeny (CORS). W prototypie dane są
          demonstracyjne.
        </p>
      </div>

      <section aria-labelledby="resources-title" className="space-y-4">
        <h2 id="resources-title" className="text-2xl font-bold text-slate-900">Zasoby</h2>
        <ul className="space-y-3">
          {RESOURCES.map((r) => (
            <li key={r.key} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-900">{r.title}</h3>
                {totals[r.key] !== undefined && (
                  <span className="text-sm text-slate-700 tabular-nums">rekordów: {totals[r.key]}</span>
                )}
              </div>
              <p className="text-sm text-slate-700 mt-1">{r.description}</p>
              <p className="text-sm mt-2">
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">GET {API}/{r.key}</code>
                <span className="text-slate-600"> · parametry: {r.params}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <a href={`${API}/${r.key}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold border border-slate-300 hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg">
                  <FileJson className="w-4 h-4" aria-hidden="true" /> JSON<span className="sr-only">: {r.title} (otwiera się w nowej karcie)</span>
                </a>
                <a href={`${API}/${r.key}.csv`} download
                  className="inline-flex items-center gap-1.5 text-sm font-bold bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg">
                  <Download className="w-4 h-4" aria-hidden="true" /> Pobierz CSV<span className="sr-only">: {r.title}</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="usage-title" className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 id="usage-title" className="text-xl font-bold text-slate-900">Jak korzystać</h2>
        <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
          <li>Odpowiedź JSON ma pola <code>items</code>, <code>total</code>, <code>page</code>, <code>pages</code> oraz linki <code>next</code> i <code>previous</code>.</li>
          <li>Pliki CSV mają separator „;” i kodowanie UTF-8 – otworzysz je w Excelu lub LibreOffice.</li>
          <li>Spis zasobów: <code>GET {API}</code>. Pełna dokumentacja schematów: Swagger pod adresem <code>/docs</code> serwera API.</li>
        </ul>
        <pre tabIndex={0} role="region" aria-label="Przykład kodu: pobranie listy innowacji" className="bg-slate-900 text-slate-50 text-sm p-4 rounded-lg overflow-x-auto"><code>{EXAMPLE}</code></pre>
      </section>

      <section aria-labelledby="webhook-title" className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
        <h2 id="webhook-title" className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Webhook className="w-5 h-5 text-blue-700" aria-hidden="true" /> Powiadomienia do innych systemów (webhook)
        </h2>
        <p className="text-sm text-slate-800 max-w-prose">
          Administrator może ustawić adres <code>WEBHOOK_URL</code>. Wtedy przy każdej nowej fiszce pomysłu
          (<code>fiszka.created</code>) i nowym wpisie Rejestru Wyzwań (<code>problem_report.created</code>) Hub wysyła
          krótką wiadomość JSON, np. do systemu obiegu dokumentów albo komunikatora. Wiadomość nie zawiera imion ani adresów
          e-mail, może być podpisana (<code>X-MHIS-Signature</code>), a awaria odbiorcy nie blokuje zgłoszeń.
        </p>
      </section>
    </div>
  );
};
