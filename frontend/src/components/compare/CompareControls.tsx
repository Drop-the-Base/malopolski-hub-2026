import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, FolderPlus, Columns3 } from 'lucide-react';
import { COMPARE_MAX, compareFolder, useCompareFolder } from '../../utils/compareFolder';

interface CompareToggleProps {
  id: string;
  title: string;
  className?: string;
}

/** Przycisk „Dodaj do teczki porównania” na liście i karcie innowacji (aria-pressed + komunikat o limicie). */
export const CompareToggle: React.FC<CompareToggleProps> = ({ id, title, className = '' }) => {
  const entries = useCompareFolder();
  const [message, setMessage] = useState('');
  const inFolder = entries.some((e) => e.id === id);

  const toggle = () => {
    if (inFolder) {
      compareFolder.remove(id);
      setMessage(`Usunięto z teczki: ${title}.`);
      return;
    }
    if (!compareFolder.add({ id, title })) {
      setMessage(`Teczka jest pełna (${COMPARE_MAX} innowacje). Usuń jedną, żeby dodać tę.`);
      return;
    }
    const count = compareFolder.list().length;
    setMessage(`Dodano do teczki: ${title}. W teczce: ${count} z ${COMPARE_MAX}.`);
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={inFolder}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold ${
          inFolder ? 'bg-blue-50 border-blue-600 text-blue-900' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
        } ${className}`}
      >
        {inFolder ? <Check className="w-4 h-4" aria-hidden="true" /> : <FolderPlus className="w-4 h-4" aria-hidden="true" />}
        {inFolder ? 'W teczce porównania' : 'Dodaj do porównania'}
        <span className="sr-only">: {title}</span>
      </button>
      <span role="status" className={message ? 'text-xs text-slate-700' : 'sr-only'}>
        {message}
      </span>
    </span>
  );
};

/** Pasek z licznikiem teczki i przejściem do strony porównania. */
export const CompareFolderBar: React.FC = () => {
  const entries = useCompareFolder();
  return (
    <section
      aria-labelledby="compare-bar-title"
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div>
        <h2 id="compare-bar-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Columns3 className="w-5 h-5 text-blue-700" aria-hidden="true" />
          Teczka porównania: <span className="tabular-nums">{entries.length} z {COMPARE_MAX}</span>
        </h2>
        <p className="text-sm text-slate-700">
          {entries.length === 0
            ? 'Dodaj 2 lub 3 innowacje i zobacz je obok siebie: koszt, kadry, gotowość. Wydrukujesz to dla rady gminy.'
            : entries.map((e) => e.title).join(' · ')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => compareFolder.clear()}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Opróżnij teczkę
          </button>
        )}
        <Link
          to="/porownanie"
          className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold"
        >
          Porównaj{entries.length ? ` (${entries.length})` : ''}
        </Link>
      </div>
    </section>
  );
};
