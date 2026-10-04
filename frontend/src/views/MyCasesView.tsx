import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { TimelineStep } from '../types';
import { formatDateTime } from '../constants/domain';
import { CaseTimeline } from '../components/cases/CaseTimeline';
import { caseKind, forgetCase, loadRecentCases, rememberCase } from '../utils/recentCases';

interface CaseSummary {
  id: string;
  kind: 'fiszka' | 'problem';
  title: string;
  statusLabel: string;
  createdAt: string;
  timeline: TimelineStep[];
  replyPreview?: string | null;
}

type CaseState = { loading: true } | { error: string } | { data: CaseSummary };

const loadCase = async (id: string): Promise<CaseSummary> => {
  if (caseKind(id) === 'problem') {
    const p = await api.getProblemStatus(id);
    return { id, kind: 'problem', title: p.title || 'Zgłoszenie wyzwania', statusLabel: p.status_label, createdAt: p.created_at, timeline: p.timeline };
  }
  const s = await api.getFiszkaStatus(id);
  return {
    id, kind: 'fiszka', title: s.title, statusLabel: s.status_label, createdAt: s.created_at,
    timeline: s.timeline ?? [], replyPreview: s.admin_notes
  };
};

/** „Moje sprawy”: lista zgłoszeń, których numery pamięta ta przeglądarka, z krótką osią czasu każdej sprawy. */
export const MyCasesView: React.FC = () => {
  const [ids, setIds] = useState<string[]>(() => loadRecentCases());
  const [cases, setCases] = useState<Record<string, CaseState>>({});
  const [input, setInput] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    ids.forEach((id) => {
      if (cases[id]) return;
      setCases((prev) => ({ ...prev, [id]: { loading: true } }));
      loadCase(id)
        .then((data) => setCases((prev) => ({ ...prev, [id]: { data } })))
        .catch((err) => setCases((prev) => ({ ...prev, [id]: { error: apiErrorMessage(err, 'Nie udało się pobrać statusu.') } })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const numbers = input.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
    if (numbers.length === 0) {
      setFormError('Wpisz numer zgłoszenia.');
      return;
    }
    const invalid = numbers.filter((n) => !caseKind(n));
    if (invalid.length) {
      setFormError(`Nie rozpoznajemy numeru: ${invalid.join(', ')}. Numer zaczyna się od „fiszka-” albo „prob-”.`);
      return;
    }
    numbers.forEach((n) => rememberCase(n));
    // stan w pamięci jest nadrzędny – lista działa nawet bez dostępu do localStorage
    setIds(Array.from(new Set([...numbers.reverse(), ...ids])).slice(0, 10));
    setInput('');
    setNotice(numbers.length === 1 ? `Dodano sprawę ${numbers[0]}.` : `Dodano sprawy: ${numbers.length}.`);
  };

  const remove = (id: string) => {
    forgetCase(id);
    setIds(ids.filter((x) => x !== id));
    setNotice(`Usunięto ${id} z listy na tym urządzeniu. Samo zgłoszenie nie zostało usunięte.`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-2">
          <FolderOpen className="w-7 h-7 text-blue-700" aria-hidden="true" /> Moje sprawy
        </h1>
        <p className="text-base text-slate-700 mb-4">
          Tu sprawdzisz, co dzieje się z Twoimi zgłoszeniami. Wpisz numer z e-maila potwierdzającego. Możesz wpisać kilka
          numerów oddzielonych przecinkiem.
        </p>
        <form onSubmit={add} className="space-y-2" noValidate>
          <label htmlFor="case-numbers" className="block text-sm font-bold text-slate-900">Numer zgłoszenia</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="case-numbers"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="np. fiszka-1a2b3c4d"
              autoComplete="off"
              aria-invalid={!!formError}
              aria-describedby={formError ? 'case-numbers-error' : 'case-numbers-hint'}
              className="flex-1 text-base p-2.5 rounded-lg border border-slate-400"
            />
            <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg inline-flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" aria-hidden="true" /> Dodaj do listy
            </button>
          </div>
          {formError ? (
            <p id="case-numbers-error" role="alert" className="text-sm text-rose-900">{formError}</p>
          ) : (
            <p id="case-numbers-hint" className="text-sm text-slate-600">
              Numery zapamiętamy tylko na tym urządzeniu. Nie zapisujemy Twojego e-maila.
            </p>
          )}
        </form>
      </div>

      <p aria-live="polite" className="sr-only">{notice}</p>

      {ids.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-base text-slate-700 space-y-2">
          <p>Nie masz jeszcze zapisanych spraw na tym urządzeniu.</p>
          <p>
            Masz pomysł? <Link to="/kreator-pomyslow" className="font-bold text-blue-700 underline">Zgłoś go w Kreatorze pomysłów</Link>.
            Po wysłaniu numer pojawi się tutaj sam.
          </p>
        </div>
      ) : (
        <ul className="space-y-4" aria-label="Lista moich spraw">
          {ids.map((id) => {
            const state = cases[id];
            return (
              <li key={id} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-bold text-slate-600">
                      {id} · {caseKind(id) === 'problem' ? 'zgłoszenie wyzwania' : 'fiszka pomysłu'}
                    </p>
                    {state && 'data' in state ? (
                      <h2 className="text-lg font-black text-slate-900">{state.data.title}</h2>
                    ) : (
                      <h2 className="text-lg font-black text-slate-900">Sprawa {id}</h2>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    className="text-sm font-semibold text-slate-700 hover:text-rose-800 inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" /> Usuń z listy<span className="sr-only"> {id}</span>
                  </button>
                </div>

                {!state || 'loading' in state ? (
                  <p className="text-slate-700">Wczytywanie…</p>
                ) : 'error' in state ? (
                  <p className="text-rose-900 bg-rose-50 border border-rose-200 p-3 rounded-lg">{state.error}</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-base">
                      Teraz: <strong>{state.data.statusLabel}</strong>
                      <span className="text-slate-600"> · zgłoszono {formatDateTime(state.data.createdAt)}</span>
                    </p>
                    {state.data.timeline.length > 0 && (
                      <CaseTimeline steps={state.data.timeline} label={`Przebieg sprawy ${id}`} compact />
                    )}
                    {state.data.replyPreview && (
                      <p className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-slate-800 whitespace-pre-line">
                        <strong>Koordynator ROPS:</strong> {state.data.replyPreview}
                      </p>
                    )}
                    <Link to={`/status/${encodeURIComponent(id)}`} className="inline-block font-bold text-blue-700 underline">
                      {state.data.kind === 'fiszka' ? 'Szczegóły i rozmowa z koordynatorem' : 'Szczegóły sprawy'}
                      <span className="sr-only"> – {id}</span>
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <aside className="bg-slate-100 border border-slate-300 rounded-2xl p-5 text-base text-slate-800 flex gap-3">
        <Bell className="w-6 h-6 text-blue-700 shrink-0" aria-hidden="true" />
        <p>
          Chcesz wiedzieć o nowych naborach na granty albo nowych rozwiązaniach w Twoim powiecie?{' '}
          <Link to="/powiadomienia" className="font-bold text-blue-700 underline">Zapisz się na powiadomienia e-mail</Link>.
        </p>
      </aside>
    </div>
  );
};
