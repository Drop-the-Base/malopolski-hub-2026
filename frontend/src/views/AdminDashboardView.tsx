import React, { useState, useEffect } from 'react';
import { api, apiErrorMessage, authStore, isUnauthorized } from '../services/api';
import { FiszkaAdminItem, InnovationItem, InnovationUpsert, MentorItem, NotificationItem, TrendRadarData } from '../types';
import { ShieldCheck, TrendingUp, AlertTriangle, BarChart3, FileCheck, Bell, LogOut, Lock, Pencil, Plus, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAccessibility } from '../store/useAccessibilityStore';
import { CATEGORIES, FISZKA_STATUSES, IMPLEMENTATION_STAGES, POWIATY, formatDateTime, powiatLabel } from '../constants/domain';

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-950',
  in_review: 'bg-blue-100 text-blue-950',
  needs_changes: 'bg-orange-100 text-orange-950',
  approved: 'bg-emerald-100 text-emerald-950',
  rejected: 'bg-rose-100 text-rose-950'
};

const EMPTY_INNOVATION: InnovationUpsert = {
  title: '',
  tagline: '',
  category: 'seniorzy',
  target_groups: [],
  full_description: '',
  readiness_level: 'Gotowa do skalowania',
  budget_bracket: 'Średni (20-60k zł)',
  video_url: '',
  handbook_url: '',
  etr_summary: '',
  origin_poviat: '',
  is_published: true
};

const LoginForm: React.FC<{ onLoggedIn: () => void }> = ({ onLoggedIn }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-5 h-5 text-slate-800" aria-hidden="true" />
        <h1 className="text-xl font-black text-slate-900">Panel ROPS – logowanie</h1>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Panel zawiera dane kontaktowe autorów zgłoszeń, dlatego jest dostępny tylko dla koordynatorów.
        W wersji produkcyjnej logowanie odbywa się przez konto służbowe (SSO).
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await api.login(password);
            onLoggedIn();
          } catch (err) {
            setError(apiErrorMessage(err, 'Nie udało się zalogować.'));
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-3"
      >
        <label htmlFor="admin-password" className="block text-sm font-bold text-slate-800">Hasło koordynatora</label>
        <input id="admin-password" type="password" required autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} className="w-full text-sm p-2.5 rounded-lg border border-slate-300" />
        {error && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-200 p-2 rounded-lg">{error}</p>}
        <button type="submit" disabled={busy} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-60">
          {busy ? 'Logowanie…' : 'Zaloguj'}
        </button>
      </form>
    </div>
  );
};

export const AdminDashboardView: React.FC = () => {
  const { etrMode } = useAccessibility();
  const [loggedIn, setLoggedIn] = useState(!!authStore.get());
  const [radar, setRadar] = useState<TrendRadarData | null>(null);
  const [submissions, setSubmissions] = useState<FiszkaAdminItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [innovations, setInnovations] = useState<InnovationItem[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { status: string; admin_notes: string; assigned_mentor_id: string }>>({});
  const [editing, setEditing] = useState<{ id: string | null; data: InnovationUpsert } | null>(null);
  const [editError, setEditError] = useState('');

  const logout = () => {
    authStore.clear();
    setLoggedIn(false);
  };

  const loadAll = async () => {
    try {
      const [r, s, n, m, inns] = await Promise.all([
        api.getTrendRadar(),
        api.getSubmissions(),
        api.getNotifications(),
        api.getMentors(),
        api.getInnovations()
      ]);
      setRadar(r);
      setSubmissions(s);
      setNotifications(n);
      setMentors(m);
      setInnovations(inns);
      setDrafts(Object.fromEntries(s.map((f) => [f.id, { status: f.status, admin_notes: f.admin_notes ?? '', assigned_mentor_id: f.assigned_mentor_id ?? '' }])));
      setError('');
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(apiErrorMessage(err, 'Nie udało się wczytać danych panelu.'));
    }
  };

  useEffect(() => {
    if (loggedIn) loadAll();
  }, [loggedIn]);

  if (!loggedIn) return <LoginForm onLoggedIn={() => setLoggedIn(true)} />;

  const saveModeration = async (f: FiszkaAdminItem) => {
    const d = drafts[f.id];
    try {
      await api.moderateFiszka(f.id, { status: d.status, admin_notes: d.admin_notes, assigned_mentor_id: d.assigned_mentor_id || undefined });
      setStatus(`Zapisano decyzję dla „${f.title}”. Autor otrzymał powiadomienie e-mail.`);
      loadAll();
    } catch (err) {
      setStatus(apiErrorMessage(err, 'Nie udało się zapisać decyzji.'));
    }
  };

  const saveInnovation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError('');
    try {
      if (editing.id) await api.updateInnovation(editing.id, editing.data);
      else await api.createInnovation(editing.data);
      setEditing(null);
      setStatus('Zapisano kartę innowacji. Matchmaking korzysta już z nowych danych.');
      loadAll();
    } catch (err) {
      setEditError(apiErrorMessage(err, 'Nie udało się zapisać innowacji.'));
    }
  };

  const panelNotifications = notifications.filter((n) => n.channel === 'panel');
  const outbox = notifications.filter((n) => n.channel === 'email');
  const unread = panelNotifications.filter((n) => !n.is_read).length;
  const pending = submissions.filter((s) => s.status === 'submitted' || s.status === 'in_review');

  const fieldCls = 'w-full text-sm p-2 rounded-lg border border-slate-300 bg-white';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Moduł VI: Panel koordynatora</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            {etrMode ? 'Dla pracownika – zgłoszenia i dane' : 'Moderacja zgłoszeń, powiadomienia i radar trendów'}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            Nowe fiszki trafiają tu automatycznie z powiadomieniem. Decyzja i komentarz koordynatora wracają do autora e-mailem oraz na stronie statusu zgłoszenia.
          </p>
        </div>
        <button type="button" onClick={logout} className="self-start flex items-center gap-1.5 border border-slate-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100">
          <LogOut className="w-4 h-4" aria-hidden="true" /> Wyloguj
        </button>
      </div>

      <p aria-live="polite" className={status ? 'bg-blue-50 border border-blue-200 text-blue-950 p-3 rounded-xl text-sm' : 'sr-only'}>{status}</p>
      {error && <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-sm">{error}</p>}

      {radar && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Zgłoszenia na platformie</span>
            <div className="text-3xl font-black text-blue-700">{radar.platform_cases_count.toLocaleString('pl-PL')}</div>
            <span className="text-xs text-slate-700 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              {radar.quarterly_growth_pct === null ? `${radar.platform_cases_last_30_days} w ostatnich 30 dniach` : `${radar.quarterly_growth_pct > 0 ? '+' : ''}${radar.quarterly_growth_pct}% kw/kw`}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Fiszki do rozpatrzenia</span>
            <div className="text-3xl font-black text-amber-700">{pending.length}</div>
            <span className="text-xs text-slate-700 block mt-1">wszystkich fiszek: {submissions.length}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Nowe powiadomienia</span>
            <div className="text-3xl font-black text-rose-700">{unread}</div>
            <span className="text-xs text-slate-700 block mt-1">e-maile w skrzynce nadawczej: {outbox.length}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Powiaty z alertem</span>
            <div className="text-3xl font-black text-rose-700">{radar.poviat_breakdown.filter((p) => p.alert_level === 'high_critical').length}</div>
            <span className="text-xs text-slate-700 block mt-1">seniorzy &gt; 26% lub zgłoszenia krytyczne</span>
          </div>
        </div>
      )}

      {/* Powiadomienia */}
      <section aria-labelledby="notif-title" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 id="notif-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-700" aria-hidden="true" /> Powiadomienia {unread > 0 && <span className="text-sm bg-rose-700 text-white px-2 rounded-full">{unread} nowe</span>}
          </h2>
          {unread > 0 && (
            <button type="button" onClick={() => api.markNotificationsRead().then(loadAll)} className="text-sm font-bold text-blue-700 underline">
              Oznacz jako przeczytane
            </button>
          )}
        </div>
        {panelNotifications.length === 0 ? (
          <p className="text-sm text-slate-600">Brak powiadomień.</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {panelNotifications.map((n) => (
              <li key={n.id} className="py-2 text-sm flex justify-between gap-3">
                <span>
                  {!n.is_read && <span className="sr-only">Nowe: </span>}
                  <strong className={n.is_read ? 'text-slate-700' : 'text-slate-950'}>{n.subject}</strong>
                  <span className="block text-slate-600">{n.body}</span>
                </span>
                <time className="text-xs text-slate-600 shrink-0">{formatDateTime(n.created_at)}</time>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-slate-800 flex items-center gap-1.5"><Mail className="w-4 h-4" aria-hidden="true" /> Skrzynka nadawcza e-mail ({outbox.length})</summary>
          <p className="text-xs text-slate-600 mt-1">Bez skonfigurowanego serwera SMTP wiadomości mają status „queued” i są widoczne tylko tutaj.</p>
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto mt-2">
            {outbox.map((n) => (
              <li key={n.id} className="py-2">
                <span className="text-xs text-slate-600">{formatDateTime(n.created_at)} · do: {n.recipient} · {n.delivery_status}</span>
                <strong className="block text-slate-900">{n.subject}</strong>
                <span className="block text-slate-700 whitespace-pre-line">{n.body}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>

      {/* Kolejka fiszek */}
      <section aria-labelledby="queue-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 id="queue-title" className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-700" aria-hidden="true" /> Fiszki pomysłów ({submissions.length})
        </h2>
        {submissions.length === 0 && <p className="text-sm text-slate-600">Brak zgłoszonych fiszek.</p>}
        <ul className="space-y-4">
          {submissions.map((f) => {
            const d = drafts[f.id] ?? { status: f.status, admin_notes: '', assigned_mentor_id: '' };
            return (
              <li key={f.id} className="border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <strong className="text-slate-900">{f.title}</strong>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_STYLES[f.status] ?? 'bg-slate-100'}`}>{FISZKA_STATUSES[f.status] ?? f.status}</span>
                  <span className="text-slate-600 text-xs">{f.id} · {powiatLabel(f.powiat)} · {IMPLEMENTATION_STAGES.find((s) => s.value === f.implementation_stage)?.label} · {formatDateTime(f.created_at)}</span>
                </div>
                <p className="text-sm text-slate-800">{f.summary}</p>
                <p className="text-xs text-slate-700">Odbiorcy: {f.target_audience} · Autor: {f.author_name} ({f.author_email})</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={`st-${f.id}`} className="block text-xs font-bold text-slate-800 mb-1">Status</label>
                    <select id={`st-${f.id}`} value={d.status} onChange={(e) => setDrafts({ ...drafts, [f.id]: { ...d, status: e.target.value } })} className={fieldCls}>
                      {Object.entries(FISZKA_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`mt-${f.id}`} className="block text-xs font-bold text-slate-800 mb-1">Mentor</label>
                    <select id={`mt-${f.id}`} value={d.assigned_mentor_id} onChange={(e) => setDrafts({ ...drafts, [f.id]: { ...d, assigned_mentor_id: e.target.value } })} className={fieldCls}>
                      <option value="">— bez mentora —</option>
                      {mentors.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                  </div>
                  <div className="md:row-span-2">
                    <label htmlFor={`nt-${f.id}`} className="block text-xs font-bold text-slate-800 mb-1">Komentarz dla autora</label>
                    <textarea id={`nt-${f.id}`} rows={3} maxLength={4000} value={d.admin_notes}
                      onChange={(e) => setDrafts({ ...drafts, [f.id]: { ...d, admin_notes: e.target.value } })} className={fieldCls} />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <button type="button" onClick={() => saveModeration(f)} className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-4 py-2 rounded-lg">
                      Zapisz i powiadom autora
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {radar && (
        <>
          <section aria-labelledby="chart-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 id="chart-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-700" aria-hidden="true" /> Zgłoszenia w 22 powiatach
            </h2>
            <p className="text-sm text-slate-600 mb-4">{radar.methodology_note}</p>
            <div className="w-full" style={{ height: radar.poviat_breakdown.length * 26 + 40 }} aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={radar.poviat_breakdown} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#334155' }} />
                  <YAxis type="category" dataKey="powiat" width={110} interval={0} tick={{ fontSize: 12, fill: '#334155' }} />
                  <Tooltip />
                  <Bar dataKey="reported_cases_count" name="Zgłoszenia (bazowe + platforma)" fill="#034EA2" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Tabela danych (alternatywa tekstowa wykresu)</summary>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm">
                  <caption className="sr-only">Zgłoszenia i alerty w powiatach</caption>
                  <thead>
                    <tr className="text-left border-b border-slate-300">
                      <th scope="col" className="py-1 pr-2">Powiat</th>
                      <th scope="col" className="py-1 pr-2">Zgłoszenia</th>
                      <th scope="col" className="py-1 pr-2">Z platformy</th>
                      <th scope="col" className="py-1 pr-2">Główny obszar</th>
                      <th scope="col" className="py-1">Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {radar.poviat_breakdown.map((p) => (
                      <tr key={p.powiat} className="border-b border-slate-100">
                        <th scope="row" className="py-1 pr-2 font-semibold text-left">{p.powiat}</th>
                        <td className="py-1 pr-2">{p.reported_cases_count}</td>
                        <td className="py-1 pr-2">{p.platform_cases_count}</td>
                        <td className="py-1 pr-2">{p.top_problem_category}</td>
                        <td className="py-1">{p.alert_level === 'high_critical' ? 'Wysoki' : p.alert_level === 'medium' ? 'Średni' : 'Niski'} – {p.alert_reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <section aria-labelledby="acute-title" className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-4">
            <h2 id="acute-title" className="text-lg font-bold flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" /> Najczęstsze obszary zgłoszeń
            </h2>
            {radar.most_acute_challenges.length === 0 && <p className="text-sm text-slate-200">Za mało zgłoszeń, by wskazać trendy.</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {radar.most_acute_challenges.map((c) => (
                <div key={c.category} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-amber-300 uppercase tracking-wider">Udział w zgłoszeniach</span>
                    <span className="font-black">{c.impact_score}% ({c.cases_count})</span>
                  </div>
                  <h3 className="font-bold text-sm mb-2">{c.category}</h3>
                  <p className="text-xs text-slate-200 mb-2"><strong>Gdzie najczęściej:</strong> {c.hotspot_powiaty.join(', ')}</p>
                  <p className="text-xs text-slate-200 border-t border-slate-700 pt-2"><strong className="text-emerald-300">Rekomendacja:</strong> {c.suggested_action}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-xs text-slate-200 uppercase tracking-wider font-bold mb-2">Białe plamy</h3>
              <ul className="space-y-1 text-sm text-slate-100 list-disc pl-5">
                {radar.systemic_gaps.map((gap, i) => <li key={i}>{gap}</li>)}
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Zarządzanie katalogiem */}
      <section aria-labelledby="catalog-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 id="catalog-title" className="text-lg font-bold text-slate-900">Biblioteka innowacji – edycja ({innovations.length})</h2>
          <button type="button" onClick={() => { setEditError(''); setEditing({ id: null, data: EMPTY_INNOVATION }); }}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-3 py-2 rounded-lg flex items-center gap-1">
            <Plus className="w-4 h-4" aria-hidden="true" /> Dodaj innowację
          </button>
        </div>

        {editing && (
          <form onSubmit={saveInnovation} className="border-2 border-blue-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <h3 className="md:col-span-2 font-bold text-slate-900">{editing.id ? `Edycja: ${editing.id}` : 'Nowa innowacja'}</h3>
            {([
              ['title', 'Tytuł', 'text'],
              ['tagline', 'Hasło (1 zdanie)', 'text'],
              ['readiness_level', 'Poziom gotowości', 'text'],
              ['budget_bracket', 'Przedział budżetu', 'text'],
              ['video_url', 'Film (link https, opcjonalnie)', 'url'],
              ['handbook_url', 'Podręcznik (link https, opcjonalnie)', 'url']
            ] as const).map(([key, label, type]) => (
              <div key={key}>
                <label htmlFor={`inn-${key}`} className="block font-bold text-slate-800 mb-1">{label}</label>
                <input id={`inn-${key}`} type={type} value={(editing.data[key] as string) ?? ''}
                  required={key === 'title' || key === 'tagline'}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, [key]: e.target.value } })} className={fieldCls} />
              </div>
            ))}
            <div>
              <label htmlFor="inn-category" className="block font-bold text-slate-800 mb-1">Kategoria</label>
              <select id="inn-category" value={editing.data.category} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, category: e.target.value } })} className={fieldCls}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="inn-origin" className="block font-bold text-slate-800 mb-1">Powiat pochodzenia</label>
              <select id="inn-origin" value={editing.data.origin_poviat ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, origin_poviat: e.target.value } })} className={fieldCls}>
                <option value="">— brak —</option>
                {POWIATY.map((p) => <option key={p} value={p}>{powiatLabel(p)}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="inn-groups" className="block font-bold text-slate-800 mb-1">Grupy docelowe (oddzielone przecinkami)</label>
              <input id="inn-groups" value={editing.data.target_groups.join(', ')}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, target_groups: e.target.value.split(',').map((g) => g.trim()).filter(Boolean) } })} className={fieldCls} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="inn-desc" className="block font-bold text-slate-800 mb-1">Opis metodyki</label>
              <textarea id="inn-desc" rows={4} required minLength={20} value={editing.data.full_description}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, full_description: e.target.value } })} className={fieldCls} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="inn-etr" className="block font-bold text-slate-800 mb-1">Streszczenie w tekście łatwym do czytania (ETR)</label>
              <textarea id="inn-etr" rows={2} value={editing.data.etr_summary ?? ''}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, etr_summary: e.target.value } })} className={fieldCls} />
            </div>
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" checked={editing.data.is_published} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, is_published: e.target.checked } })} />
              Opublikowana w katalogu
            </label>
            {editError && <p role="alert" className="md:col-span-2 text-rose-900 bg-rose-50 border border-rose-200 p-2 rounded-lg">{editError}</p>}
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-3 py-2 border border-slate-300 rounded-lg">Anuluj</button>
              <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg">Zapisz</button>
            </div>
          </form>
        )}

        <ul className="divide-y divide-slate-100">
          {innovations.map((inn) => (
            <li key={inn.id} className="py-2 flex items-center justify-between gap-3 text-sm">
              <span><strong>{inn.title}</strong> <span className="text-slate-600">· {inn.category_label} · {inn.id}</span></span>
              <button
                type="button"
                onClick={() => {
                  setEditError('');
                  setEditing({
                    id: inn.id,
                    data: {
                      title: inn.title, tagline: inn.tagline, category: inn.category, target_groups: inn.target_groups,
                      full_description: inn.full_description, readiness_level: inn.readiness_level, budget_bracket: inn.budget_bracket,
                      video_url: inn.video_url ?? '', handbook_url: inn.handbook_url ?? '', etr_summary: inn.etr_summary ?? '',
                      origin_poviat: inn.origin_poviat ?? '', is_published: inn.is_published ?? true
                    }
                  });
                }}
                className="flex items-center gap-1 text-blue-700 font-bold"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" /> Edytuj<span className="sr-only"> {inn.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
