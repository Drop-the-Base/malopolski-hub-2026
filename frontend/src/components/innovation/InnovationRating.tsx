import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { api, apiErrorMessage } from '../../services/api';
import { InnovationRatingSummary } from '../../types';
import { TESTER_ROLES } from '../../constants/domain';
import { useAccessibility } from '../../store/useAccessibilityStore';

const SCALE = [
  { value: 1, label: 'Słabo' },
  { value: 2, label: 'Raczej słabo' },
  { value: 3, label: 'Średnio' },
  { value: 4, label: 'Dobrze' },
  { value: 5, label: 'Bardzo dobrze' }
];

const MAX_PROPOSAL = 1000;

/** „1 ocena”, „2 oceny”, „5 ocen” */
export const ratingsCountLabel = (n: number) => {
  if (n === 1) return '1 ocena';
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? `${n} oceny` : `${n} ocen`;
};

const fmtAvg = (v: number) => v.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Średnia ocena: gwiazdki tylko jako ozdoba, treść podana tekstem. */
export const RatingBadge: React.FC<{ summary?: InnovationRatingSummary | null; className?: string }> = ({ summary, className = '' }) => {
  if (!summary || !summary.ratings_count || summary.average_rating == null) {
    return <span className={`text-sm text-slate-600 ${className}`}>Brak ocen</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 text-sm text-slate-800 ${className}`}>
      <Star className="w-4 h-4 text-amber-400 fill-amber-400" aria-hidden="true" />
      <strong className="tabular-nums">{fmtAvg(summary.average_rating)}</strong>
      <span className="sr-only">na 5</span>
      <span className="text-slate-600">({ratingsCountLabel(summary.ratings_count)})</span>
    </span>
  );
};

const storageKey = (id: string) => `mhis_rated_${id}`;

interface Props {
  innovationId: string;
  innovationTitle: string;
  onRated?: (summary: InnovationRatingSummary) => void;
}

/** Tester z karty innowacji: ocena 1–5 (grupa przycisków radiowych) i krótka propozycja usprawnienia. */
export const InnovationRating: React.FC<Props> = ({ innovationId, innovationTitle, onRated }) => {
  const { etrMode } = useAccessibility();
  const [summary, setSummary] = useState<InnovationRatingSummary | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [role, setRole] = useState('mieszkaniec');
  const [showProposal, setShowProposal] = useState(false);
  const [proposal, setProposal] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [thanks, setThanks] = useState('');
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    setRating(null);
    setProposal('');
    setShowProposal(false);
    setError('');
    setThanks('');
    try {
      setAlreadyRated(sessionStorage.getItem(storageKey(innovationId)) === '1');
    } catch {
      setAlreadyRated(false);
    }
    api
      .getInnovationRating(innovationId)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [innovationId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!rating) {
      setError('Wybierz ocenę od 1 do 5.');
      return;
    }
    setSending(true);
    try {
      const res = await api.rateInnovation(innovationId, {
        rating,
        improvement_proposal: showProposal ? proposal.trim() : '',
        author_role: role
      });
      setSummary(res.summary);
      onRated?.(res.summary);
      setThanks(res.message);
      setAlreadyRated(true);
      try {
        sessionStorage.setItem(storageKey(innovationId), '1');
      } catch {
        /* brak dostępu do storage – nic się nie dzieje */
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się wysłać oceny. Spróbuj ponownie.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-labelledby={`rate-${innovationId}`} className="border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h3 id={`rate-${innovationId}`} className="text-lg font-bold text-slate-900">
          {etrMode ? 'Oceń ten pomysł' : 'Oceń innowację'}
        </h3>
        <RatingBadge summary={summary} />
      </div>

      {/* Komunikaty o wyniku (WCAG 4.1.3) */}
      <div aria-live="polite">
        {thanks && (
          <p className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg p-3 text-sm font-semibold">{thanks}</p>
        )}
      </div>

      {alreadyRated && !thanks && (
        <p className="text-sm text-slate-600">Ta innowacja ma już Twoją ocenę z tej sesji. Dziękujemy!</p>
      )}

      {!alreadyRated && (
        <form onSubmit={submit} noValidate className="space-y-4">
          <fieldset>
            <legend className="text-sm font-semibold text-slate-800 mb-2">
              {etrMode ? 'Czy to dobry pomysł? Wybierz jedną odpowiedź.' : 'Jak oceniasz to rozwiązanie? (1 – słabo, 5 – bardzo dobrze)'}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {SCALE.map((o) => {
                const checked = rating === o.value;
                return (
                  <label
                    key={o.value}
                    className={`cursor-pointer flex sm:flex-col items-center gap-2 sm:gap-0.5 px-3 py-2 rounded-lg border text-sm transition-colors focus-within:ring-2 focus-within:ring-amber-400 ${
                      checked ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`rating-${innovationId}`}
                      value={o.value}
                      checked={checked}
                      onChange={() => setRating(o.value)}
                      className="w-4 h-4 accent-amber-400"
                    />
                    <span className="text-lg font-extrabold tabular-nums" aria-hidden="true">{o.value}</span>
                    <span className="font-semibold">
                      <span className="sr-only">{o.value} – </span>
                      {o.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div>
              <label htmlFor={`rate-role-${innovationId}`} className="block text-sm font-semibold text-slate-800 mb-1">
                Kim jesteś?
              </label>
              <select
                id={`rate-role-${innovationId}`}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full sm:w-64 text-sm p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                {TESTER_ROLES.filter((r) => r.value !== 'mlodziez').map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              aria-expanded={showProposal}
              aria-controls={`proposal-${innovationId}`}
              onClick={() => setShowProposal((v) => !v)}
              className="text-sm font-bold text-blue-700 underline underline-offset-4 hover:text-blue-900 py-2.5 text-left"
            >
              {showProposal ? 'Nie dodawaj propozycji' : 'Zaproponuj usprawnienie'}
            </button>
          </div>

          {showProposal && (
            <div id={`proposal-${innovationId}`}>
              <label htmlFor={`proposal-text-${innovationId}`} className="block text-sm font-semibold text-slate-800 mb-1">
                {etrMode ? 'Co można zrobić lepiej?' : 'Twoja propozycja usprawnienia'}
                <span className="font-normal text-slate-600"> (nieobowiązkowe)</span>
              </label>
              <textarea
                id={`proposal-text-${innovationId}`}
                rows={3}
                maxLength={MAX_PROPOSAL}
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                aria-describedby={`proposal-hint-${innovationId}`}
                placeholder="Na przykład: dodać numer telefonu dla osób bez internetu"
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 text-slate-900"
              />
              <p id={`proposal-hint-${innovationId}`} className="text-sm text-slate-600 mt-1">
                Nie wpisuj danych osobowych. Propozycja trafi do koordynatora ROPS. {proposal.length}/{MAX_PROPOSAL} znaków.
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-900 rounded-lg p-3 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="bg-blue-600 hover:bg-blue-800 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-lg text-sm"
          >
            {sending ? 'Wysyłanie…' : 'Wyślij ocenę'}
            <span className="sr-only">: {innovationTitle}</span>
          </button>
        </form>
      )}
    </section>
  );
};
