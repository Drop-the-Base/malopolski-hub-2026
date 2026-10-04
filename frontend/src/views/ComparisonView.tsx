import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Printer, X } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { ComparisonItem, ComparisonResponse } from '../types';
import { formatPLN, powiatLabel } from '../constants/domain';
import { COMPARE_MAX, compareFolder, useCompareFolder } from '../utils/compareFolder';

const NO_DATA = 'brak danych';

const ratingsWord = (n: number) => {
  if (n === 1) return 'ocena';
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'oceny' : 'ocen';
};

interface Row {
  key: string;
  label: string;
  value: (i: ComparisonItem) => React.ReactNode;
}

const ROWS: Row[] = [
  { key: 'problem', label: 'Jaki problem rozwiązuje', value: (i) => i.problem_statement || NO_DATA },
  { key: 'target', label: 'Dla kogo', value: (i) => (i.target_groups.length ? i.target_groups.join(', ') : NO_DATA) },
  { key: 'bracket', label: 'Przedział kosztu', value: (i) => i.budget_bracket || NO_DATA },
  {
    key: 'setup',
    label: 'Koszt uruchomienia (szacunek)',
    value: (i) => (i.setup_cost_pln != null ? <span className="tabular-nums">ok. {formatPLN(i.setup_cost_pln)}</span> : NO_DATA)
  },
  {
    key: 'monthly',
    label: 'Koszt utrzymania miesięcznie (szacunek)',
    value: (i) => (i.monthly_cost_pln != null ? <span className="tabular-nums">ok. {formatPLN(i.monthly_cost_pln)}</span> : NO_DATA)
  },
  { key: 'staff', label: 'Kto jest potrzebny (kadry)', value: (i) => i.staff_needs || NO_DATA },
  { key: 'readiness', label: 'Gotowość', value: (i) => i.readiness_level || NO_DATA },
  { key: 'where', label: 'Gdzie sprawdzona', value: (i) => (i.origin_poviat ? powiatLabel(i.origin_poviat) : NO_DATA) },
  {
    key: 'rating',
    label: 'Średnia ocen użytkowników',
    value: (i) =>
      i.average_rating != null && i.ratings_count > 0 ? (
        <span className="tabular-nums">
          {i.average_rating.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} na 5 ({i.ratings_count}{' '}
          {ratingsWord(i.ratings_count)})
        </span>
      ) : (
        'brak ocen'
      )
  }
];

const PackageLink: React.FC<{ item: ComparisonItem }> = ({ item }) => (
  <Link
    to={`/middleman?inn=${encodeURIComponent(item.id)}`}
    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold print:hidden"
  >
    <Building2 className="w-4 h-4" aria-hidden="true" /> Przygotuj pakiet wdrożeniowy
    <span className="sr-only">: {item.title}</span>
  </Link>
);

const RemoveButton: React.FC<{ item: ComparisonItem }> = ({ item }) => (
  <button
    type="button"
    onClick={() => compareFolder.remove(item.id)}
    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-100 print:hidden"
  >
    <X className="w-4 h-4" aria-hidden="true" /> Usuń z teczki<span className="sr-only">: {item.title}</span>
  </button>
);

/** Teczka wdrożeń dla JST (G16): 2–3 innowacje obok siebie, wydruk / PDF dla rady gminy. */
export const ComparisonView: React.FC = () => {
  const entries = useCompareFolder();
  const ids = useMemo(() => entries.map((e) => e.id), [entries]);
  const idsKey = ids.join(',');
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ids.length) {
      setData(null);
      return;
    }
    setLoading(true);
    setError('');
    api
      .compareInnovations(ids)
      .then((res) => {
        setData(res);
        // Innowacje zdjęte z katalogu znikają z teczki
        res.missing_ids.forEach((id) => compareFolder.remove(id));
      })
      .catch((err) => setError(apiErrorMessage(err, 'Nie udało się wczytać porównania.')))
      .finally(() => setLoading(false));
  }, [idsKey]);

  const items = (data?.items ?? []).filter((i) => ids.includes(i.id));
  const today = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto space-y-6 print:space-y-3">
      <style>{'@media print { @page { size: A4 landscape; margin: 12mm; } }'}</style>

      <header className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-0 print:shadow-none print:p-0">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Teczka wdrożeń: porównanie innowacji</h1>
        <p className="text-base text-slate-700 max-w-3xl print:hidden">
          Zobacz do {COMPARE_MAX} rozwiązań obok siebie: jaki problem rozwiązują, ile kosztują, kogo trzeba zatrudnić i gdzie
          już działają. Wydrukuj albo zapisz jako PDF i pokaż radzie gminy.
        </p>
        <p className="hidden print:block text-sm text-slate-800">
          Zestawienie przygotowane w Małopolskim Hubie Innowacji Społecznych, {today}. Prototyp – dane demonstracyjne.
        </p>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold"
            >
              <Printer className="w-4 h-4" aria-hidden="true" /> Drukuj / zapisz PDF dla rady gminy
            </button>
            <Link
              to="/baza-wiedzy"
              className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Dodaj inne innowacje z biblioteki
            </Link>
          </div>
        )}
      </header>

      <div aria-live="polite">
        {loading && <p className="text-base text-slate-700">Wczytywanie porównania…</p>}
        {error && <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl">{error}</p>}
      </div>

      {!ids.length && (
        <section className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Teczka jest pusta</h2>
          <p className="text-base text-slate-700">
            W Bibliotece innowacji kliknij „Dodaj do porównania” przy 2 lub 3 rozwiązaniach, a potem wróć tutaj.
          </p>
          <Link to="/baza-wiedzy" className="inline-block bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold">
            Przejdź do Biblioteki innowacji
          </Link>
        </section>
      )}

      {items.length === 1 && (
        <p className="bg-blue-50 border border-blue-200 text-slate-900 p-4 rounded-xl text-sm print:hidden">
          W teczce jest jedna innowacja. Dodaj jeszcze jedną lub dwie, żeby porównać je obok siebie.{' '}
          <Link to="/baza-wiedzy" className="font-bold text-blue-700 underline">Wybierz z biblioteki</Link>
        </p>
      )}

      {items.length > 0 && (
        <>
          {/* Szeroki ekran i wydruk: prawdziwa tabela z nagłówkami kolumn i wierszy */}
          <div className="hidden md:block print:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto print:border-0 print:shadow-none print:overflow-visible">
            <table className="w-full text-sm text-left border-collapse">
              <caption className="sr-only">
                Porównanie innowacji: {items.map((i) => i.title).join(', ')}. Wiersze to cechy, kolumny to innowacje.
              </caption>
              <thead>
                <tr className="border-b-2 border-slate-300 align-top">
                  <td className="p-4 w-48 print:p-2" />
                  {items.map((i) => (
                    <th key={i.id} scope="col" className="p-4 print:p-2 align-top">
                      <span className="block text-lg font-extrabold text-slate-900">{i.title}</span>
                      <span className="block text-sm font-normal text-slate-700 mt-1">{i.category_label} · {i.tagline}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-slate-200 align-top">
                    <th scope="row" className="p-4 print:p-2 font-bold text-slate-900 bg-slate-50 print:bg-transparent">{row.label}</th>
                    {items.map((i) => (
                      <td key={i.id} className="p-4 print:p-2 text-slate-800 leading-relaxed">{row.value(i)}</td>
                    ))}
                  </tr>
                ))}
                <tr className="align-top print:hidden">
                  <th scope="row" className="p-4 font-bold text-slate-900 bg-slate-50">Następny krok</th>
                  {items.map((i) => (
                    <td key={i.id} className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <PackageLink item={i} />
                        <Link to={`/baza-wiedzy/${encodeURIComponent(i.id)}`} className="inline-flex items-center px-3 py-2 text-sm font-bold text-blue-700 underline">
                          Karta innowacji<span className="sr-only">: {i.title}</span>
                        </Link>
                        <RemoveButton item={i} />
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Telefon: każda innowacja jako osobna karta z listą cech */}
          <ul className="md:hidden print:hidden space-y-4" aria-label="Porównywane innowacje">
            {items.map((i) => (
              <li key={i.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h2 className="text-lg font-extrabold text-slate-900">{i.title}</h2>
                <p className="text-sm text-slate-700 mb-3">{i.category_label} · {i.tagline}</p>
                <dl className="space-y-3 text-sm">
                  {ROWS.map((row) => (
                    <div key={row.key} className="border-t border-slate-200 pt-2">
                      <dt className="font-bold text-slate-900">{row.label}</dt>
                      <dd className="text-slate-800 leading-relaxed">{row.value(i)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-2 mt-4">
                  <PackageLink item={i} />
                  <RemoveButton item={i} />
                </div>
              </li>
            ))}
          </ul>

          {data?.cost_basis && (
            <p className="text-sm text-slate-700 max-w-3xl">
              <strong>Jak liczymy koszty:</strong> {data.cost_basis} Dane z katalogu demonstracyjnego prototypu – przed decyzją
              sprawdź je z ROPS. „{NO_DATA}” oznacza, że karta innowacji nie zawiera tej informacji.
            </p>
          )}
        </>
      )}
    </div>
  );
};
