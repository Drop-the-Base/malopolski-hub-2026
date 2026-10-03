import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, Search, XCircle } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { FiszkaPublicStatus } from '../types';
import { formatDateTime, IMPLEMENTATION_STAGES } from '../constants/domain';

const STEPS = [
  { key: 'submitted', label: 'Złożona' },
  { key: 'in_review', label: 'W weryfikacji ROPS' },
  { key: 'decision', label: 'Decyzja i mentor' }
];

export const FiszkaStatusView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lookup, setLookup] = useState(id || '');
  const [status, setStatus] = useState<FiszkaPublicStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    api
      .getFiszkaStatus(id)
      .then(setStatus)
      .catch((err) => {
        setStatus(null);
        setError(apiErrorMessage(err, 'Nie udało się pobrać statusu.'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const stepIndex = !status
    ? -1
    : status.status === 'submitted'
    ? 0
    : status.status === 'in_review' || status.status === 'needs_changes'
    ? 1
    : 2;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Status zgłoszonego pomysłu</h1>
        <p className="text-sm text-slate-600 mb-4">Wpisz numer fiszki z e-maila potwierdzającego (np. fiszka-1a2b3c4d).</p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (lookup.trim()) navigate(`/status/${encodeURIComponent(lookup.trim())}`);
          }}
        >
          <label htmlFor="fiszka-id" className="sr-only">Numer fiszki</label>
          <input
            id="fiszka-id"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            className="flex-1 text-sm p-2.5 rounded-lg border border-slate-300"
            placeholder="fiszka-…"
          />
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 rounded-lg text-sm flex items-center gap-1.5">
            <Search className="w-4 h-4" aria-hidden="true" /> Sprawdź
          </button>
        </form>
      </div>

      <div aria-live="polite">
        {loading && <p className="text-sm text-slate-600">Wczytywanie…</p>}
        {error && <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-sm">{error}</p>}
        {status && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{status.id}</p>
              <h2 className="text-xl font-black text-slate-900">{status.title}</h2>
              <p className="text-sm text-slate-600">
                Etap realizacji: {IMPLEMENTATION_STAGES.find((s) => s.value === status.implementation_stage)?.label ?? status.implementation_stage}
                {' · '}złożona {formatDateTime(status.created_at)}
              </p>
            </div>

            <ol className="grid grid-cols-3 gap-2" aria-label="Postęp rozpatrywania">
              {STEPS.map((s, i) => {
                const done = i <= stepIndex;
                const rejected = i === 2 && status.status === 'rejected';
                return (
                  <li key={s.key} className={`p-3 rounded-xl border text-sm font-semibold flex items-center gap-2 ${done ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    {rejected ? <XCircle className="w-4 h-4 text-rose-700" aria-hidden="true" /> : done ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <Circle className="w-4 h-4" aria-hidden="true" />}
                    <span>{i === 2 && stepIndex === 2 ? status.status_label : s.label}</span>
                    <span className="sr-only">{done ? '(ukończono)' : '(oczekuje)'}</span>
                  </li>
                );
              })}
            </ol>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800">
              <strong className="block mb-1">Aktualny status: {status.status_label}</strong>
              {status.admin_notes ? (
                <p className="whitespace-pre-line"><span className="font-semibold">Komentarz koordynatora:</span> {status.admin_notes}</p>
              ) : (
                <p>Koordynator nie dodał jeszcze komentarza. Odpowiedź otrzymasz także e-mailem.</p>
              )}
              {status.mentor_name && <p className="mt-2"><span className="font-semibold">Przydzielony mentor:</span> {status.mentor_name}</p>}
              {status.updated_at && <p className="mt-2 text-slate-600">Ostatnia zmiana: {formatDateTime(status.updated_at)}</p>}
            </div>

            <Link to="/dialog" className="inline-block text-sm font-bold text-blue-700 underline">
              Masz pytanie? Napisz w module Dialog i Mentorzy
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
