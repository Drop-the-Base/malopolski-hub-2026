import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FolderOpen, MessageSquare, Search, Send } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { CaseMessage, FiszkaPublicStatus, ProblemPublicStatus } from '../types';
import { formatDateTime, IMPLEMENTATION_STAGES, powiatLabel } from '../constants/domain';
import { CaseTimeline } from '../components/cases/CaseTimeline';
import { caseKind, rememberCase } from '../utils/recentCases';
import { caseSenderLabel } from '../utils/caseSender';

const fieldCls = 'w-full text-base p-2.5 rounded-lg border border-slate-400 bg-white';

/** Rozmowa autora z koordynatorem ROPS – dostęp po podaniu e-maila ze zgłoszenia (e-mail nie jest nigdzie zapisywany). */
const CaseConversation: React.FC<{ fiszkaId: string; onStatus: (s: FiszkaPublicStatus) => void }> = ({ fiszkaId, onStatus }) => {
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(false);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const openCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const view = await api.openMyCase(fiszkaId, email.trim());
      setMessages(view.messages);
      onStatus(view.status);
      setVerified(true);
      setNotice(view.messages.length ? `Rozmowa otwarta. Wiadomości: ${view.messages.length}.` : 'Rozmowa otwarta. Nie ma jeszcze wiadomości.');
      setTimeout(() => draftRef.current?.focus(), 0);
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się otworzyć rozmowy.'));
    } finally {
      setBusy(false);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.trim().length < 3) {
      setError('Napisz co najmniej 3 znaki.');
      draftRef.current?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      const view = await api.sendCaseMessage(fiszkaId, email.trim(), draft.trim());
      setMessages(view.messages);
      onStatus(view.status);
      setDraft('');
      setNotice('Wysłano. Koordynator ROPS dostał powiadomienie. Odpowiedź pojawi się tutaj i przyjdzie e-mailem.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się wysłać wiadomości.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="conv-title" className="border-t border-slate-200 pt-5 space-y-4">
      <h3 id="conv-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-700" aria-hidden="true" /> Rozmowa z koordynatorem ROPS i mentorem
      </h3>

      <p aria-live="polite" className={notice ? 'text-sm text-emerald-900 bg-emerald-50 border border-emerald-300 p-3 rounded-lg' : 'sr-only'}>
        {notice}
      </p>
      {error && (
        <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-300 p-3 rounded-lg">
          {error}
        </p>
      )}

      {!verified ? (
        <form onSubmit={openCase} className="space-y-3">
          <p className="text-sm text-slate-700">
            Chcesz o coś zapytać albo coś dopisać? Podaj adres e-mail, który wpisałeś przy zgłoszeniu. Dzięki temu tylko Ty
            zobaczysz rozmowę.
          </p>
          <div>
            <label htmlFor="case-email" className="block text-sm font-bold text-slate-900 mb-1">
              Twój adres e-mail ze zgłoszenia
            </label>
            <input
              id="case-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldCls}
            />
          </div>
          <button type="submit" disabled={busy} className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-lg">
            {busy ? 'Sprawdzanie…' : 'Pokaż rozmowę'}
          </button>
        </form>
      ) : (
        <>
          {messages.length === 0 ? (
            <p className="text-sm text-slate-700">Nie ma jeszcze wiadomości. Możesz napisać pierwszą.</p>
          ) : (
            <ol className="space-y-3" aria-label="Wiadomości w sprawie">
              {messages.map((m) => {
                const mine = m.sender === 'author';
                return (
                  <li
                    key={m.id}
                    className={`p-3 rounded-xl border text-sm ${mine ? 'bg-white border-slate-300 ml-0 sm:ml-10' : 'bg-blue-50 border-blue-200 mr-0 sm:mr-10'}`}
                  >
                    <p className="font-bold text-slate-900">
                      {caseSenderLabel(m, 'Ty')}{' '}
                      <span className="font-normal text-slate-600">
                        · <time dateTime={m.created_at}>{formatDateTime(m.created_at)}</time>
                      </span>
                    </p>
                    <p className="whitespace-pre-line text-slate-800 mt-1">{m.body}</p>
                  </li>
                );
              })}
            </ol>
          )}
          <form onSubmit={send} className="space-y-2">
            <label htmlFor="case-reply" className="block text-sm font-bold text-slate-900">
              Twoja wiadomość do koordynatora
            </label>
            <textarea
              id="case-reply"
              ref={draftRef}
              rows={4}
              maxLength={2000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-describedby="case-reply-hint"
              className={fieldCls}
            />
            <p id="case-reply-hint" className="text-sm text-slate-600">
              Nie wpisuj numeru PESEL ani danych o zdrowiu. Maksymalnie 2000 znaków.
            </p>
            <button type="submit" disabled={busy} className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-2">
              <Send className="w-4 h-4" aria-hidden="true" /> {busy ? 'Wysyłanie…' : 'Wyślij wiadomość'}
            </button>
          </form>
        </>
      )}
    </section>
  );
};

export const FiszkaStatusView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lookup, setLookup] = useState(id || '');
  const [status, setStatus] = useState<FiszkaPublicStatus | null>(null);
  const [problem, setProblem] = useState<ProblemPublicStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLookup(id || '');
    setStatus(null);
    setProblem(null);
    if (!id) return;
    setLoading(true);
    setError('');
    const request = caseKind(id) === 'problem'
      ? api.getProblemStatus(id).then((p) => setProblem(p))
      : api.getFiszkaStatus(id).then((s) => setStatus(s));
    request
      .then(() => rememberCase(id))
      .catch((err) => setError(apiErrorMessage(err, 'Nie udało się pobrać statusu.')))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Status zgłoszenia</h1>
        <p className="text-base text-slate-700 mb-4">
          Wpisz numer z e-maila potwierdzającego, na przykład <span className="font-mono">fiszka-1a2b3c4d</span> albo{' '}
          <span className="font-mono">prob-1a2b3c4d</span>.
        </p>
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (lookup.trim()) navigate(`/status/${encodeURIComponent(lookup.trim())}`);
          }}
        >
          <label htmlFor="fiszka-id" className="sr-only">Numer zgłoszenia</label>
          <input
            id="fiszka-id"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            className="flex-1 text-base p-2.5 rounded-lg border border-slate-400"
            placeholder="fiszka-…"
            autoComplete="off"
          />
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5">
            <Search className="w-4 h-4" aria-hidden="true" /> Sprawdź
          </button>
        </form>
        <p className="mt-3 text-sm">
          <Link to="/moje-sprawy" className="font-bold text-blue-700 underline inline-flex items-center gap-1">
            <FolderOpen className="w-4 h-4" aria-hidden="true" /> Zobacz wszystkie moje sprawy
          </Link>
        </p>
      </div>

      <div aria-live="polite">
        {loading && <p className="text-base text-slate-700">Wczytywanie…</p>}
        {error && <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl">{error}</p>}

        {status && (
          <article aria-labelledby="case-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <header>
              <p className="text-sm font-mono font-bold text-slate-600">{status.id}</p>
              <h2 id="case-title" className="text-xl font-black text-slate-900">{status.title}</h2>
              <p className="text-sm text-slate-700">
                Etap pomysłu: {IMPLEMENTATION_STAGES.find((s) => s.value === status.implementation_stage)?.label ?? status.implementation_stage}
                {status.powiat ? ` · ${powiatLabel(status.powiat)}` : ''}
              </p>
              <p className="mt-3 inline-block bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-base">
                Teraz: <strong>{status.status_label}</strong>
              </p>
            </header>

            {status.timeline && status.timeline.length > 0 && (
              <section aria-labelledby="timeline-title">
                <h3 id="timeline-title" className="text-lg font-bold text-slate-900 mb-3">Co się dzieje z Twoim zgłoszeniem</h3>
                <CaseTimeline steps={status.timeline} />
              </section>
            )}

            {status.mentor_name && (
              <p className="text-base text-slate-800">
                <span className="font-semibold">Twój mentor:</span> {status.mentor_name}
              </p>
            )}

            <CaseConversation fiszkaId={status.id} onStatus={setStatus} />
          </article>
        )}

        {problem && (
          <article aria-labelledby="problem-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <header>
              <p className="text-sm font-mono font-bold text-slate-600">{problem.id} · zgłoszenie z rejestru wyzwań gmin</p>
              <h2 id="problem-title" className="text-xl font-black text-slate-900">{problem.title || 'Zgłoszenie wyzwania'}</h2>
              <p className="text-sm text-slate-700">
                {problem.powiat ? powiatLabel(problem.powiat) : 'Małopolska'}
                {problem.gmina ? ` · gmina ${problem.gmina}` : ''} · zgłoszono {formatDateTime(problem.created_at)}
              </p>
              <p className="mt-3 inline-block bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-base">
                Teraz: <strong>{problem.status_label}</strong>
              </p>
            </header>
            <section aria-labelledby="ptimeline-title">
              <h3 id="ptimeline-title" className="text-lg font-bold text-slate-900 mb-3">Przebieg sprawy</h3>
              <CaseTimeline steps={problem.timeline} />
            </section>
            {problem.assigned_innovation_id && (
              <p className="text-base">
                Wskazane rozwiązanie:{' '}
                <Link to={`/baza-wiedzy/${problem.assigned_innovation_id}`} className="font-bold text-blue-700 underline">
                  {problem.assigned_innovation_title || problem.assigned_innovation_id}
                </Link>
              </p>
            )}
            <p className="text-sm text-slate-700">
              Sprawę prowadzi urzędnik gminy razem z ROPS. Pytania możesz zadać w module{' '}
              <Link to="/dialog" className="font-bold text-blue-700 underline">Dialog i mentorzy</Link>.
            </p>
          </article>
        )}
      </div>
    </div>
  );
};
