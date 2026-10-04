import React, { useState, useEffect, useMemo } from 'react';
import { api, apiErrorMessage, authStore, isUnauthorized } from '../services/api';
import { FiszkaAdminItem, InnovationItem, InnovationUpsert, MentorItem, NotificationItem, TrendRadarData, FiszkaUpdatePayload } from '../types';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  FileCheck,
  Bell,
  LogOut,
  Lock,
  Pencil,
  Plus,
  Mail,
  Printer,
  CheckCircle2,
  XCircle,
  Tag,
  Layers,
  Filter,
  Sparkles,
  Building,
  Edit3,
  X,
  User,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAccessibility } from '../store/useAccessibilityStore';
import { LoginForm } from '../components/auth/LoginForm';
import { CATEGORIES, FISZKA_STATUSES, IMPLEMENTATION_STAGES, POWIATY, formatDateTime, powiatLabel } from '../constants/domain';
import { AdminInboxSummary } from '../types';
import { CaseThreadAdmin, INBOX_CHANGED_EVENT, notifyInboxChanged } from '../components/admin/CaseThreadAdmin';
import { SubscriptionsAdmin } from '../components/admin/SubscriptionsAdmin';

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-950 border border-amber-300',
  in_review: 'bg-blue-100 text-blue-950 border border-blue-300',
  in_testing: 'bg-indigo-100 text-indigo-950 border border-indigo-300',
  needs_changes: 'bg-orange-100 text-orange-950 border border-orange-300',
  approved: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
  rejected: 'bg-rose-100 text-rose-950 border border-rose-300'
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

  const [groupBy, setGroupBy] = useState<'cluster' | 'powiat' | 'status' | 'none'>('cluster');
  const [editingProposal, setEditingProposal] = useState<FiszkaAdminItem | null>(null);
  const [editProposalError, setEditProposalError] = useState('');
  const [printProposal, setPrintProposal] = useState<FiszkaAdminItem | null>(null);
  const [inbox, setInbox] = useState<AdminInboxSummary | null>(null);

  const loadInbox = () => {
    api.getInboxSummary().then(setInbox).catch(() => undefined);
  };

  const groupedSubmissions = useMemo(() => {
    if (groupBy === 'none') {
      return [{ groupName: 'Wszystkie wnioski', items: submissions }];
    }
    const map = new Map<string, FiszkaAdminItem[]>();
    for (const item of submissions) {
      let key = 'Bez przypisanego klastra';
      if (groupBy === 'cluster') {
        key = item.cluster_group?.trim() || 'Bez przypisanego klastra';
      } else if (groupBy === 'powiat') {
        key = item.powiat ? powiatLabel(item.powiat) : 'Brak powiatu';
      } else if (groupBy === 'status') {
        key = FISZKA_STATUSES[item.status] || item.status;
      }
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([groupName, items]) => ({ groupName, items }));
  }, [submissions, groupBy]);

  const handleQuickStatus = async (f: FiszkaAdminItem, newStatus: string) => {
    try {
      await api.updateIdeaFull(f.id, { status: newStatus });
      setStatus(`Zmieniono status wniosku „${f.title}” na: ${FISZKA_STATUSES[newStatus] || newStatus}. Autor otrzymał powiadomienie.`);
      loadAll();
    } catch (err) {
      setStatus(apiErrorMessage(err, 'Nie udało się zmienić statusu.'));
    }
  };

  const handleAssignCluster = async (f: FiszkaAdminItem, cluster: string) => {
    try {
      await api.updateIdeaFull(f.id, { cluster_group: cluster.trim() || null });
      setStatus(`Zaktualizowano klaster wniosku „${f.title}”: ${cluster || 'Brak'}.`);
      loadAll();
    } catch (err) {
      setStatus(apiErrorMessage(err, 'Nie udało się przypisać klastra.'));
    }
  };

  const handleSaveProposalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProposal) return;
    setEditProposalError('');
    try {
      await api.updateIdeaFull(editingProposal.id, {
        title: editingProposal.title,
        summary: editingProposal.summary,
        target_audience: editingProposal.target_audience,
        implementation_stage: editingProposal.implementation_stage,
        powiat: editingProposal.powiat,
        cluster_group: editingProposal.cluster_group || null,
        status: editingProposal.status,
        admin_notes: editingProposal.admin_notes || null,
        assigned_mentor_id: editingProposal.assigned_mentor_id || null
      });
      setStatus(`Zapisano zmiany we wniosku „${editingProposal.title}”.`);
      setEditingProposal(null);
      loadAll();
    } catch (err) {
      setEditProposalError(apiErrorMessage(err, 'Nie udało się zapisać zmian wniosku.'));
    }
  };

  const triggerPrint = (f?: FiszkaAdminItem) => {
    setPrintProposal(f || null);
    setTimeout(() => {
      window.print();
    }, 200);
  };

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
      notifyInboxChanged(); // odświeża licznik w panelu i plakietkę w nawigacji
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

  useEffect(() => {
    window.addEventListener(INBOX_CHANGED_EVENT, loadInbox);
    return () => window.removeEventListener(INBOX_CHANGED_EVENT, loadInbox);
  }, []);

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
      const isNewInnovation = !editing.id;
      setEditing(null);
      setStatus(`Zapisano kartę innowacji. Matchmaking korzysta już z nowych danych.${isNewInnovation && editing.data.is_published ? ' Subskrybenci tej kategorii dostali e-mail (skrzynka nadawcza).' : ''}`);
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

      {/* G4: co wymaga uwagi koordynatora (nowe fiszki, pytania autorów) */}
      {inbox && (
        <div className={`p-4 rounded-2xl border text-sm flex flex-wrap items-center gap-x-6 gap-y-2 ${inbox.total_attention > 0 ? 'bg-amber-50 border-amber-300 text-slate-900' : 'bg-white border-slate-200 text-slate-700'}`}>
          <strong className="text-base">{inbox.total_attention > 0 ? 'Wymaga Twojej uwagi:' : 'Wszystko przejrzane.'}</strong>
          <span>Nowe fiszki do przyjęcia: <strong>{inbox.new_submissions}</strong></span>
          <span>Pytania autorów bez odpowiedzi: <strong>{inbox.unread_messages}</strong></span>
          {inbox.total_attention > 0 && (
            <a href="#proposals-title" className="font-bold text-blue-700 underline">Przejdź do wniosków</a>
          )}
        </div>
      )}

      {radar && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-600 block mb-1">Zgłoszenia na platformie</span>
            <div className="text-3xl font-black text-blue-700">{radar.platform_cases_count.toLocaleString('pl-PL')}</div>
            <span className="text-xs text-slate-700 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              {radar.quarterly_growth_pct === null ? `${radar.platform_cases_last_30_days} w ostatnich 30 dniach` : `${radar.quarterly_growth_pct > 0 ? '+' : ''}${radar.quarterly_growth_pct}% kw/kw`}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-600 block mb-1">Fiszki do rozpatrzenia</span>
            <div className="text-3xl font-black text-amber-700">{pending.length}</div>
            <span className="text-xs text-slate-700 block mt-1">wszystkich fiszek: {submissions.length}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-600 block mb-1">Nowe powiadomienia</span>
            <div className="text-3xl font-black text-rose-700">{unread}</div>
            <span className="text-xs text-slate-700 block mt-1">e-maile w skrzynce nadawczej: {outbox.length}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-600 block mb-1">Powiaty z alertem</span>
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

      {/* Panel Zarządzania Wnioskami Innowacji (Approve, Group, Change, Print) */}
      <section aria-labelledby="proposals-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 text-xs font-bold px-2.5 py-0.5 rounded-full mb-1">
              <FileCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>Moduł Urzędnika ROPS</span>
            </div>
            <h2 id="proposals-title" className="text-xl font-black text-slate-900 flex items-center gap-2">
              Baza i ocena wniosków innowacji ({submissions.length})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Zatwierdzaj wnioski (Approve), łącz je w klastry strategiczne (Group), modyfikuj treść (Change) oraz generuj oficjalne karty A4 (Print).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => triggerPrint()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Drukuj całe zestawienie (A4)</span>
            </button>
          </div>
        </div>

        {/* Pasek narzędzi grupowania (Group) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>Tryb prezentacji / Grupowanie:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'cluster', label: 'Klastry tematyczne', icon: Tag },
              { key: 'powiat', label: 'Wg Powiatów', icon: Building },
              { key: 'status', label: 'Wg Statusu', icon: Filter },
              { key: 'none', label: 'Płaska lista', icon: Layers }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = groupBy === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setGroupBy(tab.key as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                    active
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {submissions.length === 0 ? (
          <p className="text-sm text-slate-600 py-6 text-center">Brak zgłoszonych wniosków innowacji.</p>
        ) : (
          <div className="space-y-6">
            {groupedSubmissions.map(({ groupName, items }) => (
              <div key={groupName} className="space-y-3">
                <div className="flex items-center justify-between bg-slate-100/80 px-4 py-2 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="font-black text-slate-900 text-sm">{groupName}</h3>
                    <span className="text-xs bg-white text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-300">
                      {items.length} {items.length === 1 ? 'wniosek' : [2, 3, 4].includes(items.length % 10) && ![12, 13, 14].includes(items.length % 100) ? 'wnioski' : 'wniosków'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    Łącznie głosów poparcia: <strong className="text-blue-900">{items.reduce((acc, curr) => acc + (curr.votes_count || 0), 0)}</strong>
                  </span>
                </div>

                <ul className="space-y-4">
                  {items.map((f) => (
                    <li
                      key={f.id}
                      className="border border-slate-200 bg-white hover:border-slate-300 p-5 rounded-2xl shadow-sm transition-all space-y-4"
                    >
                      {/* Nagłówek karty wniosku */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                              {f.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_STYLES[f.status] ?? 'bg-slate-100'}`}>
                              {FISZKA_STATUSES[f.status] ?? f.status}
                            </span>
                            <span className="text-xs text-slate-600">
                              Powiat: <strong>{powiatLabel(f.powiat)}</strong> · Etap: {IMPLEMENTATION_STAGES.find((s) => s.value === f.implementation_stage)?.label}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-slate-900 leading-tight">
                            {f.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                            <span>👍</span> {f.votes_count || 0} głosów
                          </span>
                        </div>
                      </div>

                      {/* Treść merytoryczna */}
                      <div className="space-y-2 text-sm">
                        <p className="text-slate-800 leading-relaxed">{f.summary}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span><strong>Odbiorcy:</strong> {f.target_audience}</span>
                          <span><strong>Autor:</strong> {f.author_name} ({f.author_email}) · {f.author_type}</span>
                          <span><strong>Złożono:</strong> {formatDateTime(f.created_at)}</span>
                        </div>
                        {f.admin_notes && (
                          <div className="bg-amber-50/70 border border-amber-200 text-amber-950 p-2.5 rounded-xl text-xs">
                            <strong>Komentarz ROPS:</strong> {f.admin_notes}
                          </div>
                        )}
                        {f.assigned_mentor_id && (
                          <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mentor: {mentors.find(m => m.id === f.assigned_mentor_id)?.full_name || f.assigned_mentor_id}</span>
                          </div>
                        )}
                      </div>

                      {/* G4: przyjęcie zgłoszenia i rozmowa z autorem */}
                      <CaseThreadAdmin
                        fiszka={f}
                        isNew={!!inbox?.new_submission_ids.includes(f.id)}
                        unread={inbox?.unread_by_case[f.id] ?? 0}
                        onChanged={(msg) => { setStatus(msg); loadAll(); }}
                      />

                      {/* Pasek narzędziowy operacji urzędnika: Approve, Group, Change, Print */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        {/* 1. APPROVE: Szybkie zatwierdzanie */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-500 mr-1">
                            Decyzja:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(f, 'approved')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              f.status === 'approved'
                                ? 'bg-emerald-700 text-white shadow'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            ✓ Zatwierdź
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(f, 'in_testing')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              f.status === 'in_testing'
                                ? 'bg-indigo-700 text-white shadow'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300'
                            }`}
                          >
                            🔬 Do testów
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(f, 'needs_changes')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              f.status === 'needs_changes'
                                ? 'bg-orange-700 text-white shadow'
                                : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300'
                            }`}
                          >
                            ⚠️ Do poprawy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(f, 'rejected')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              f.status === 'rejected'
                                ? 'bg-rose-700 text-white shadow'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            ✕ Odrzuć
                          </button>
                        </div>

                        {/* 2. GROUP, CHANGE, PRINT */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Szybkie przypisanie klastra (Group) */}
                          <select
                            value={f.cluster_group || ''}
                            onChange={(e) => handleAssignCluster(f, e.target.value)}
                            aria-label={`Przypisz klaster dla ${f.title}`}
                            className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                          >
                            <option value="">— Klaster tematyczny —</option>
                            <option value="Pakiet Senioralny 2026">Pakiet Senioralny 2026</option>
                            <option value="Ekologia i Integracja">Ekologia i Integracja</option>
                            <option value="Zdrowie Psychiczne i Młodzież">Zdrowie Psychiczne i Młodzież</option>
                            <option value="Dostępność Cyfrowa">Dostępność Cyfrowa</option>
                            <option value="Wsparcie Wytchnieniowe">Wsparcie Wytchnieniowe</option>
                          </select>

                          {/* CHANGE: Modyfikacja wniosku */}
                          <button
                            type="button"
                            onClick={() => { setEditProposalError(''); setEditingProposal({ ...f }); }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                            <span>Edytuj wniosek</span>
                          </button>

                          {/* PRINT: Wydruk karty A4 */}
                          <button
                            type="button"
                            onClick={() => triggerPrint(f)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-700" />
                            <span>Drukuj (A4)</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal edycji wniosku przez urzędnika (CHANGE) */}
      {editingProposal && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 print:hidden" onClick={() => setEditingProposal(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-prop-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-700 ">Edycja Urzędnika (Change)</span>
                <h3 id="edit-prop-title" className="text-lg font-black text-slate-900">
                  Modyfikacja wniosku: {editingProposal.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProposal(null)}
                aria-label="Zamknij formularz edycji"
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProposalEdit} className="space-y-4 text-sm">
              <div>
                <label htmlFor="edit-title" className="block text-xs font-bold text-slate-800 mb-1">Tytuł roboczy</label>
                <input
                  id="edit-title"
                  type="text"
                  required
                  value={editingProposal.title}
                  onChange={(e) => setEditingProposal({ ...editingProposal, title: e.target.value })}
                  className={fieldCls}
                />
              </div>

              <div>
                <label htmlFor="edit-summary" className="block text-xs font-bold text-slate-800 mb-1">Opis problemu i pomysłu</label>
                <textarea
                  id="edit-summary"
                  rows={3}
                  required
                  value={editingProposal.summary}
                  onChange={(e) => setEditingProposal({ ...editingProposal, summary: e.target.value })}
                  className={fieldCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-powiat" className="block text-xs font-bold text-slate-800 mb-1">Powiat</label>
                  <select
                    id="edit-powiat"
                    value={editingProposal.powiat}
                    onChange={(e) => setEditingProposal({ ...editingProposal, powiat: e.target.value })}
                    className={fieldCls}
                  >
                    {POWIATY.map((p) => (
                      <option key={p} value={p}>{powiatLabel(p)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-stage" className="block text-xs font-bold text-slate-800 mb-1">Etap realizacji</label>
                  <select
                    id="edit-stage"
                    value={editingProposal.implementation_stage}
                    onChange={(e) => setEditingProposal({ ...editingProposal, implementation_stage: e.target.value })}
                    className={fieldCls}
                  >
                    {IMPLEMENTATION_STAGES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-cluster" className="block text-xs font-bold text-slate-800 mb-1">
                    Klaster tematyczny (Group)
                  </label>
                  <input
                    id="edit-cluster"
                    type="text"
                    placeholder="np. Pakiet Senioralny 2026"
                    value={editingProposal.cluster_group || ''}
                    onChange={(e) => setEditingProposal({ ...editingProposal, cluster_group: e.target.value })}
                    className={fieldCls}
                  />
                </div>

                <div>
                  <label htmlFor="edit-status" className="block text-xs font-bold text-slate-800 mb-1">Status wniosku</label>
                  <select
                    id="edit-status"
                    value={editingProposal.status}
                    onChange={(e) => setEditingProposal({ ...editingProposal, status: e.target.value })}
                    className={fieldCls}
                  >
                    {Object.entries(FISZKA_STATUSES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="edit-target" className="block text-xs font-bold text-slate-800 mb-1">Grupa docelowa</label>
                <input
                  id="edit-target"
                  type="text"
                  value={editingProposal.target_audience}
                  onChange={(e) => setEditingProposal({ ...editingProposal, target_audience: e.target.value })}
                  className={fieldCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-mentor" className="block text-xs font-bold text-slate-800 mb-1">Przydzielony mentor ROPS</label>
                  <select
                    id="edit-mentor"
                    value={editingProposal.assigned_mentor_id || ''}
                    onChange={(e) => setEditingProposal({ ...editingProposal, assigned_mentor_id: e.target.value || null })}
                    className={fieldCls}
                  >
                    <option value="">— Brak mentora —</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name} ({m.specialization})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-notes" className="block text-xs font-bold text-slate-800 mb-1">Notatka koordynatora (widoczna dla autora)</label>
                  <textarea
                    id="edit-notes"
                    rows={2}
                    value={editingProposal.admin_notes || ''}
                    onChange={(e) => setEditingProposal({ ...editingProposal, admin_notes: e.target.value })}
                    className={fieldCls}
                  />
                </div>
              </div>

              {editProposalError && (
                <p role="alert" className="text-xs text-rose-900 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                  {editProposalError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProposal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2 rounded-xl text-xs shadow"
                >
                  Zapisz zmiany wniosku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOKUMENT WYDRUKU A4 DLA PROPOZYCJI / KLASTRA */}
      {printProposal ? (
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-[99999] text-black font-serif text-xs leading-relaxed">
          <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-base font-black uppercase tracking-tight font-sans">
                URZĄD MARSZAŁKOWSKI WOJEWÓDZTWA MAŁOPOLSKIEGO
              </h1>
              <h2 className="text-xs font-bold text-slate-700 font-sans">
                Departament Zdrowia, Rodziny, Równego Traktowania i Polityki Społecznej
              </h2>
              <h3 className="text-xs font-semibold text-slate-600 font-sans">
                Regionalny Ośrodek Polityki Społecznej w Krakowie
              </h3>
            </div>
            <div className="text-right font-sans">
              <span className="font-mono font-bold border border-black px-2 py-0.5 inline-block text-xs">
                {printProposal.id}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Data wydruku: {new Date().toLocaleDateString('pl-PL')}
              </p>
            </div>
          </div>

          <div className="text-center my-4 font-sans">
            <h2 className="text-sm font-black uppercase tracking-wider border-y border-slate-400 py-1.5 inline-block px-8">
              Oficjalna Karta Weryfikacji Innowacji Społecznej (ROPS Kraków)
            </h2>
          </div>

          <div className="space-y-4">
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-bold w-1/3 bg-slate-50">Tytuł wniosku:</td>
                  <td className="p-2 font-semibold">{printProposal.title}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-bold bg-slate-50">Powiat / Obszar:</td>
                  <td className="p-2">{powiatLabel(printProposal.powiat)}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-bold bg-slate-50">Klaster tematyczny:</td>
                  <td className="p-2 font-bold">{printProposal.cluster_group || 'Brak przypisanego klastra'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-bold bg-slate-50">Etap gotowości:</td>
                  <td className="p-2">{IMPLEMENTATION_STAGES.find((s) => s.value === printProposal.implementation_stage)?.label || printProposal.implementation_stage}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-bold bg-slate-50">Poparcie mieszkańców w testach:</td>
                  <td className="p-2 font-black">{printProposal.votes_count || 0} głosów poparcia</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-bold bg-slate-50">Wnioskodawca:</td>
                  <td className="p-2">{printProposal.author_name} ({printProposal.author_email}) · Kategoria: {printProposal.author_type}</td>
                </tr>
              </tbody>
            </table>

            <div className="border border-slate-400 p-3 rounded space-y-1">
              <h3 className="font-bold uppercase tracking-wider text-[11px] font-sans">Opis problemu społecznego i metodyki:</h3>
              <p className="text-justify">{printProposal.summary}</p>
            </div>

            <div className="border border-slate-400 p-3 rounded space-y-1">
              <h3 className="font-bold uppercase tracking-wider text-[11px] font-sans">Grupa odbiorców (beneficjenci):</h3>
              <p>{printProposal.target_audience}</p>
            </div>

            <div className="border border-slate-400 p-3 rounded space-y-1">
              <h3 className="font-bold uppercase tracking-wider text-[11px] font-sans">Rozstrzygnięcie Urzędnika / Koordynatora ROPS:</h3>
              <p><strong>Status decyzji:</strong> {FISZKA_STATUSES[printProposal.status] || printProposal.status}</p>
              <p><strong>Uzasadnienie / Wytyczne:</strong> {printProposal.admin_notes || 'Wniosek spełnia wymogi formalne i merytoryczne.'}</p>
              {printProposal.assigned_mentor_id && (
                <p><strong>Przydzielony ekspert/mentor:</strong> {mentors.find(m => m.id === printProposal.assigned_mentor_id)?.full_name || printProposal.assigned_mentor_id}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-12 pt-12 mt-12 font-sans text-center">
              <div>
                <div className="border-b border-dotted border-black h-8"></div>
                <p className="mt-1 text-[10px] uppercase font-bold text-slate-700">Pieczęć Regionalnego Ośrodka Polityki Społecznej</p>
              </div>
              <div>
                <div className="border-b border-dotted border-black h-8"></div>
                <p className="mt-1 text-[10px] uppercase font-bold text-slate-700">Podpis Koordynatora / Urzędnika ds. Innowacji</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Wydruk zbiorczy tabeli (gdy żaden pojedynczy wniosek nie jest wybrany) */
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-[99999] text-black font-sans text-xs">
          <div className="border-b-2 border-black pb-2 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-base font-black uppercase">URZĄD MARSZAŁKOWSKI WOJEWÓDZTWA MAŁOPOLSKIEGO – ROPS KRAKÓW</h1>
              <h2 className="text-xs font-semibold text-slate-600">Zestawienie zbiorcze zgłoszonych wniosków innowacji społecznych</h2>
            </div>
            <div className="text-right text-[11px]">
              <p>Data wydruku: {new Date().toLocaleDateString('pl-PL')}</p>
              <p>Liczba wniosków: {submissions.length}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                <th className="p-1.5 border border-slate-300">ID</th>
                <th className="p-1.5 border border-slate-300">Tytuł wniosku</th>
                <th className="p-1.5 border border-slate-300">Powiat</th>
                <th className="p-1.5 border border-slate-300">Klaster tematyczny</th>
                <th className="p-1.5 border border-slate-300">Głosy</th>
                <th className="p-1.5 border border-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((item) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="p-1.5 border border-slate-300 font-mono font-bold">{item.id}</td>
                  <td className="p-1.5 border border-slate-300 font-semibold">{item.title}</td>
                  <td className="p-1.5 border border-slate-300">{powiatLabel(item.powiat)}</td>
                  <td className="p-1.5 border border-slate-300">{item.cluster_group || '—'}</td>
                  <td className="p-1.5 border border-slate-300 font-bold">{item.votes_count || 0}</td>
                  <td className="p-1.5 border border-slate-300 font-semibold">{FISZKA_STATUSES[item.status] || item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                    <span className="font-bold text-amber-300 ">Udział w zgłoszeniach</span>
                    <span className="font-black">{c.impact_score}% ({c.cases_count})</span>
                  </div>
                  <h3 className="font-bold text-sm mb-2">{c.category}</h3>
                  <p className="text-xs text-slate-200 mb-2"><strong>Gdzie najczęściej:</strong> {c.hotspot_powiaty.join(', ')}</p>
                  <p className="text-xs text-slate-200 border-t border-slate-700 pt-2"><strong className="text-emerald-300">Rekomendacja:</strong> {c.suggested_action}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-xs text-slate-200 font-bold mb-2">Białe plamy</h3>
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

      {/* G5: subskrypcje powiadomień i nabory */}
      <SubscriptionsAdmin onStatus={(msg) => { setStatus(msg); loadAll(); }} />
    </div>
  );
};
