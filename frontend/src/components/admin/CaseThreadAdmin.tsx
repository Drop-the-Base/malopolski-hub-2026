import React, { useId, useState } from 'react';
import { CheckCheck, MessageSquare, Send } from 'lucide-react';
import { api, apiErrorMessage } from '../../services/api';
import { CaseMessage, FiszkaAdminItem } from '../../types';
import { formatDateTime } from '../../constants/domain';
import { caseSenderLabel } from '../../utils/caseSender';

/** Zdarzenie odświeżające licznik „wymaga uwagi” w nawigacji po akcji koordynatora. */
export const INBOX_CHANGED_EVENT = 'mhis:inbox-changed';
export const notifyInboxChanged = () => window.dispatchEvent(new Event(INBOX_CHANGED_EVENT));

interface CaseThreadAdminProps {
  fiszka: FiszkaAdminItem;
  isNew: boolean;
  unread: number;
  onChanged: (message: string) => void;
}

/** Panel ROPS: potwierdzenie przyjęcia fiszki i rozmowa z autorem (pytania autora ↔ odpowiedzi koordynatora). */
export const CaseThreadAdmin: React.FC<CaseThreadAdminProps> = ({ fiszka, isNew, unread, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CaseMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const uid = useId();

  const acknowledge = async () => {
    setBusy(true);
    try {
      await api.acknowledgeSubmission(fiszka.id);
      notifyInboxChanged();
      onChanged(`Potwierdzono przyjęcie „${fiszka.title}”. Autor dostał e-mail, a na jego osi czasu pojawiła się data.`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się potwierdzić przyjęcia.'));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setError('');
      try {
        setMessages(await api.getCaseMessagesAdmin(fiszka.id));
        if (unread > 0) notifyInboxChanged();
      } catch (err) {
        setError(apiErrorMessage(err, 'Nie udało się wczytać rozmowy.'));
      }
    }
  };

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.trim().length < 3) {
      setError('Odpowiedź jest za krótka.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      setMessages(await api.replyToAuthor(fiszka.id, draft.trim()));
      setDraft('');
      notifyInboxChanged();
      onChanged(`Wysłano odpowiedź do autora „${fiszka.title}” (e-mail i strona statusu).`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się wysłać odpowiedzi.'));
    } finally {
      setBusy(false);
    }
  };

  const panelId = `${uid}-thread`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {isNew && (
          <>
            <span className="text-xs font-bold bg-rose-700 text-white px-2 py-1 rounded">Nowa – nieprzyjęta</span>
            <button
              type="button"
              onClick={acknowledge}
              disabled={busy}
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-400 inline-flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" /> Potwierdź przyjęcie
            </button>
          </>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="bg-white hover:bg-slate-100 text-blue-800 font-bold text-xs px-3 py-1.5 rounded-lg border border-blue-300 inline-flex items-center gap-1"
        >
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          Rozmowa z autorem
          {unread > 0 && (
            <span className="ml-1 bg-rose-700 text-white rounded-full px-1.5">
              {unread}<span className="sr-only"> nieprzeczytane</span>
            </span>
          )}
        </button>
      </div>

      {error && <p role="alert" className="text-xs text-rose-900 bg-rose-50 border border-rose-200 p-2 rounded-lg">{error}</p>}

      {open && (
        <div id={panelId} className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3 text-sm">
          {messages === null ? (
            <p>Wczytywanie…</p>
          ) : messages.length === 0 ? (
            <p className="text-slate-700">Autor nie zadał jeszcze pytań. Możesz napisać pierwszy – autor dostanie e-mail.</p>
          ) : (
            <ol className="space-y-2" aria-label={`Rozmowa z autorem: ${fiszka.title}`}>
              {messages.map((m) => (
                <li key={m.id} className={`p-2.5 rounded-lg border ${m.sender === 'rops' ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-300'}`}>
                  <p className="text-xs text-slate-700">
                    <strong>{caseSenderLabel(m, `Autor (${fiszka.author_name})`)}</strong> ·{' '}
                    <time dateTime={m.created_at}>{formatDateTime(m.created_at)}</time>
                    {m.sender === 'author' && !m.read_by_rops && <strong className="ml-1 text-rose-800">· nowe</strong>}
                  </p>
                  <p className="whitespace-pre-line text-slate-900">{m.body}</p>
                </li>
              ))}
            </ol>
          )}
          <form onSubmit={reply} className="space-y-2">
            <label htmlFor={`${uid}-reply`} className="block text-xs font-bold text-slate-800">
              Odpowiedź do autora (trafi e-mailem i na stronę statusu)
            </label>
            <textarea
              id={`${uid}-reply`}
              rows={3}
              maxLength={4000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full text-sm p-2 rounded-lg border border-slate-300 bg-white"
            />
            <button type="submit" disabled={busy} className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs px-3 py-2 rounded-lg inline-flex items-center gap-1">
              <Send className="w-3.5 h-3.5" aria-hidden="true" /> Wyślij odpowiedź
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
