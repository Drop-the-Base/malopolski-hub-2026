import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, LogOut, MessageSquare, UserCheck, FileText } from 'lucide-react';
import axios from 'axios';
import { api, apiErrorMessage } from '../services/api';
import { mentorApi } from '../services/mentorApi';
import { MentorDashboard, MentorFiszkaItem, MentorItem, MentorThreadItem } from '../types';
import { IMPLEMENTATION_STAGES, PARTICIPANT_ROLES, formatDateTime, powiatLabel } from '../constants/domain';
import { caseSenderLabel } from '../utils/caseSender';
import { FeedbackComposer, FeedbackTemplate, TemplatesEditor, loadTemplates } from '../components/mentor/FeedbackComposer';

const DEMO_CODE = 'mentor-demo-2026';

// Terminy konsultacji są zapisane w czasie lokalnym (Europe/Warsaw) – bez przeliczania stref
const formatLocal = (iso: string) => {
  const [date, time = ''] = iso.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).toLocaleDateString('pl-PL', { weekday: 'long' });
  return `${weekday}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}, godz. ${time.slice(0, 5)}`;
};

const stageLabel = (v: string) => IMPLEMENTATION_STAGES.find((s) => s.value === v)?.label ?? v;

/** Logowanie demonstracyjne: wybór mentora z bazy + kod dostępu. */
const MentorLogin: React.FC<{ onLoggedIn: () => void }> = ({ onLoggedIn }) => {
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [mentorId, setMentorId] = useState('');
  const [code, setCode] = useState(DEMO_CODE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMentors()
      .then((list) => {
        setMentors(list);
        setMentorId((current) => current || list[0]?.id || '');
      })
      .catch((err) => setError(apiErrorMessage(err, 'Nie udało się wczytać listy mentorów.')));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await mentorApi.login(mentorId, code);
      onLoggedIn();
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się zalogować.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
      <h1 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-2">
        <UserCheck className="w-6 h-6 text-blue-700" aria-hidden="true" /> Panel mentora
      </h1>
      <p className="text-base text-slate-700 mb-4">
        Dla ekspertów i mentorów ROPS. Zobaczysz pomysły przydzielone do Ciebie, pytania gmin i organizacji oraz swoje konsultacje.
      </p>
      <p className="text-sm text-slate-800 bg-slate-100 border border-slate-300 rounded-lg p-3 mb-4">
        Wersja demonstracyjna: wybierz mentora z listy. Kod dostępu jest już wpisany ({DEMO_CODE}).
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="mentor-select" className="block text-sm font-bold text-slate-900 mb-1">Kim jesteś?</label>
          <select
            id="mentor-select"
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
            required
            className="w-full text-base p-2.5 rounded-lg border border-slate-400 bg-white"
          >
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name} – {m.specialization}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mentor-code" className="block text-sm font-bold text-slate-900 mb-1">Kod dostępu</label>
          <input
            id="mentor-code"
            type="password"
            autoComplete="current-password"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full text-base p-2.5 rounded-lg border border-slate-400 bg-white"
          />
        </div>
        {error && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-300 p-3 rounded-lg">{error}</p>}
        <button
          type="submit"
          disabled={busy || !mentorId}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg"
        >
          {busy ? 'Logowanie…' : 'Wejdź do panelu mentora'}
        </button>
      </form>
      <p className="text-sm text-slate-700 mt-4">
        Szukasz mentora? Przejdź do <Link to="/dialog" className="font-bold text-blue-700 underline">Dialogu i mentorów</Link>.
      </p>
    </div>
  );
};

const FiszkaCard: React.FC<{
  fiszka: MentorFiszkaItem;
  templates: FeedbackTemplate[];
  onSent: (f: MentorFiszkaItem, msg: string) => void;
}> = ({ fiszka, templates, onSent }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const titleId = `fiszka-${fiszka.id}-title`;

  const send = async (body: string) => {
    setBusy(true);
    setError('');
    try {
      const updated = await mentorApi.sendFeedback(fiszka.id, body);
      onSent(updated, `Wysłano opinię do autora pomysłu „${fiszka.title}”. Autor dostał e-mail, a opinia jest w jego sprawie.`);
      return true;
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się wysłać opinii.'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <li>
      <article aria-labelledby={titleId} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <header>
          <p className="text-sm text-slate-600">
            <span className="font-mono">{fiszka.id}</span> · {powiatLabel(fiszka.powiat)} · zgłoszono {formatDateTime(fiszka.created_at)}
          </p>
          <h3 id={titleId} className="text-lg font-bold text-slate-900">{fiszka.title}</h3>
          <p className="text-sm text-slate-800">
            Status: <strong>{fiszka.status_label}</strong> · Etap: {stageLabel(fiszka.implementation_stage)} · Autor: {fiszka.author_name}
          </p>
          <p className={`text-sm mt-1 font-semibold ${fiszka.my_feedback_count ? 'text-emerald-800' : 'text-rose-800'}`}>
            {fiszka.my_feedback_count
              ? `Wysłane opinie: ${fiszka.my_feedback_count} (ostatnia ${formatDateTime(fiszka.last_feedback_at as string)})`
              : 'Czeka na Twoją pierwszą opinię'}
          </p>
        </header>
        <div className="text-base text-slate-800 space-y-1">
          <p>{fiszka.summary}</p>
          <p className="text-sm text-slate-700"><strong>Dla kogo:</strong> {fiszka.target_audience}</p>
        </div>

        {fiszka.messages.length > 0 && (
          <details className="border border-slate-200 rounded-xl p-3 bg-slate-50">
            <summary className="cursor-pointer text-sm font-bold text-slate-900">Rozmowa w sprawie ({fiszka.messages.length})</summary>
            <ol className="space-y-2 mt-3" aria-label={`Rozmowa w sprawie: ${fiszka.title}`}>
              {fiszka.messages.map((m) => (
                <li key={m.id} className="p-2.5 rounded-lg border border-slate-300 bg-white text-sm">
                  <p className="text-slate-700">
                    <strong>{caseSenderLabel(m, `Autor (${fiszka.author_name})`)}</strong> ·{' '}
                    <time dateTime={m.created_at}>{formatDateTime(m.created_at)}</time>
                  </p>
                  <p className="whitespace-pre-line text-slate-900">{m.body}</p>
                </li>
              ))}
            </ol>
          </details>
        )}

        {error && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-300 p-2 rounded-lg">{error}</p>}
        <FeedbackComposer
          label="Twoja opinia dla autora"
          hint="Autor zobaczy ją w „Moich sprawach” z Twoim imieniem i specjalizacją i dostanie e-mail. Koordynator ROPS też ją zobaczy."
          submitLabel="Wyślij opinię"
          templates={templates}
          busy={busy}
          onSubmit={send}
        />
      </article>
    </li>
  );
};

const ThreadCard: React.FC<{ thread: MentorThreadItem; onSent: (t: MentorThreadItem, msg: string) => void }> = ({ thread, onSent }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const titleId = `thread-${thread.id}-title`;

  const send = async (body: string) => {
    setBusy(true);
    setError('');
    try {
      const updated = await mentorApi.replyThread(thread.id, body);
      onSent(updated, `Dodano odpowiedź w wątku „${thread.title}”.`);
      return true;
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się dodać odpowiedzi.'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <li>
      <article aria-labelledby={titleId} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-3">
        <header>
          <p className="text-sm text-slate-600">
            {thread.category_label} · {powiatLabel(thread.powiat)} · {thread.author_name} ({PARTICIPANT_ROLES[thread.author_role] ?? thread.author_role})
          </p>
          <h3 id={titleId} className="text-lg font-bold text-slate-900">{thread.title}</h3>
          <p className={`text-sm font-semibold ${thread.needs_answer ? 'text-rose-800' : 'text-emerald-800'}`}>
            {thread.needs_answer ? 'Nikt z ekspertów jeszcze nie odpowiedział' : thread.answered_by_me ? 'Odpowiedziałeś(-aś) w tym wątku' : 'Ekspert już odpowiedział'}
            {thread.matches_specialization && ' · pasuje do Twojej specjalizacji'}
          </p>
        </header>
        <ol className="space-y-2" aria-label={`Wiadomości w wątku: ${thread.title}`}>
          {thread.messages.map((m) => (
            <li key={m.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm">
              <p className="text-slate-700">
                <strong>{m.sender_name}</strong> ({PARTICIPANT_ROLES[m.sender_role] ?? m.sender_role}) ·{' '}
                <time dateTime={m.created_at}>{formatDateTime(m.created_at)}</time>
              </p>
              <p className="whitespace-pre-line text-slate-900">{m.content}</p>
            </li>
          ))}
        </ol>
        {error && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-300 p-2 rounded-lg">{error}</p>}
        <FeedbackComposer
          label="Twoja odpowiedź w wątku"
          hint="Odpowiedź będzie publiczna w module „Dialog i mentorzy”, podpisana Twoim imieniem i nazwiskiem."
          submitLabel="Odpowiedz"
          busy={busy}
          onSubmit={send}
        />
      </article>
    </li>
  );
};

/** Panel eksperta / mentora (G15). */
export const MentorView: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(mentorApi.isLoggedIn());
  const [data, setData] = useState<MentorDashboard | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);

  const load = async () => {
    try {
      const d = await mentorApi.getDashboard();
      setData(d);
      setTemplates(loadTemplates(d.mentor.id));
      setError('');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        mentorApi.logout();
        setLoggedIn(false);
        return;
      }
      setError(apiErrorMessage(err, 'Nie udało się wczytać panelu mentora.'));
    }
  };

  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn]);

  if (!loggedIn) return <MentorLogin onLoggedIn={() => setLoggedIn(true)} />;

  const logout = () => {
    mentorApi.logout();
    setData(null);
    setLoggedIn(false);
  };

  const onFiszkaSent = (updated: MentorFiszkaItem, msg: string) => {
    setNotice(msg);
    load();
    setData((d) => (d ? { ...d, fiszki: d.fiszki.map((f) => (f.id === updated.id ? updated : f)) } : d));
  };
  const onThreadSent = (updated: MentorThreadItem, msg: string) => {
    setNotice(msg);
    setData((d) => (d ? { ...d, threads: d.threads.map((t) => (t.id === updated.id ? updated : t)) } : d));
    load();
  };

  const upcoming = data?.bookings.filter((b) => b.upcoming) ?? [];
  const past = data?.bookings.filter((b) => !b.upcoming) ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Panel mentora</h1>
            {data && (
              <p className="text-base text-slate-700">
                <strong>{data.mentor.full_name}</strong> · {data.mentor.specialization} · dyżur: {data.mentor.available_hours}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-100 self-start"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" /> Wyloguj
          </button>
        </div>
        {data && (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 border-t border-slate-200 pt-4">
            {[
              ['Czeka na opinię', data.stats.waiting_for_feedback],
              ['Wysłane opinie', data.stats.feedback_sent],
              ['Pytania bez odpowiedzi', data.stats.open_threads],
              ['Najbliższe konsultacje', data.stats.upcoming_bookings]
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-sm text-slate-700">{label}</dt>
                <dd className="text-2xl font-extrabold text-slate-900 tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      <p role="status" aria-live="polite" className={notice ? 'text-base text-emerald-900 bg-emerald-50 border border-emerald-300 p-3 rounded-lg' : 'sr-only'}>
        {notice}
      </p>
      {error && <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl">{error}</p>}
      {!data && !error && <p className="text-base text-slate-700">Wczytywanie…</p>}

      {data && (
        <>
          <section aria-labelledby="mentor-fiszki" className="space-y-4">
            <h2 id="mentor-fiszki" className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" aria-hidden="true" /> Pomysły przydzielone do mnie ({data.fiszki.length})
            </h2>
            {data.fiszki.length === 0 ? (
              <p className="bg-white p-5 rounded-xl border border-dashed border-slate-300 text-slate-700">
                Koordynator ROPS nie przydzielił Ci jeszcze żadnego pomysłu. Gdy to zrobi, zobaczysz go tutaj.
              </p>
            ) : (
              <ul className="space-y-4">
                {data.fiszki.map((f) => (
                  <FiszkaCard key={f.id} fiszka={f} templates={templates} onSent={onFiszkaSent} />
                ))}
              </ul>
            )}
            <details className="bg-white p-4 rounded-xl border border-slate-200">
              <summary className="cursor-pointer text-sm font-bold text-slate-900">Zmień swoje szablony odpowiedzi</summary>
              <div className="mt-3">
                <TemplatesEditor key={data.mentor.id} mentorId={data.mentor.id} templates={templates} onChange={setTemplates} />
              </div>
            </details>
          </section>

          <section aria-labelledby="mentor-threads" className="space-y-4">
            <h2 id="mentor-threads" className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-700" aria-hidden="true" /> Pytania w moim obszarze ({data.threads.length})
            </h2>
            <p className="text-sm text-slate-700">
              Wątki z modułu „Dialog i mentorzy”: prośby o konsultację oraz pytania pasujące do Twojej specjalizacji. Najpierw te bez odpowiedzi.
            </p>
            {data.threads.length === 0 ? (
              <p className="bg-white p-5 rounded-xl border border-dashed border-slate-300 text-slate-700">Nie ma teraz otwartych pytań w Twoim obszarze.</p>
            ) : (
              <ul className="space-y-4">
                {data.threads.map((t) => (
                  <ThreadCard key={t.id} thread={t} onSent={onThreadSent} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="mentor-bookings" className="space-y-4">
            <h2 id="mentor-bookings" className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-700" aria-hidden="true" /> Moje konsultacje
            </h2>
            {upcoming.length === 0 ? (
              <p className="bg-white p-5 rounded-xl border border-dashed border-slate-300 text-slate-700">
                Nikt nie zarezerwował jeszcze konsultacji w Twoich godzinach dyżuru.
              </p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((b) => (
                  <li key={b.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="font-bold text-slate-900">{formatLocal(b.slot_start)}</p>
                    <p className="text-sm text-slate-800">
                      {b.requester_name} · <a href={`mailto:${b.requester_email}`} className="text-blue-700 underline">{b.requester_email}</a>
                    </p>
                    <p className="text-sm text-slate-700 mt-1"><strong>Temat:</strong> {b.topic}</p>
                  </li>
                ))}
              </ul>
            )}
            {past.length > 0 && (
              <details className="bg-white p-4 rounded-xl border border-slate-200">
                <summary className="cursor-pointer text-sm font-bold text-slate-900">Minione konsultacje ({past.length})</summary>
                <ul className="mt-3 space-y-2 text-sm text-slate-800">
                  {past.map((b) => (
                    <li key={b.id}>{formatLocal(b.slot_start)} · {b.requester_name} · {b.topic}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        </>
      )}
    </div>
  );
};
