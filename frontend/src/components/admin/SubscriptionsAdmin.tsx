import React, { useEffect, useState } from 'react';
import { BellRing, CalendarRange, Pencil, Plus } from 'lucide-react';
import { api, apiErrorMessage } from '../../services/api';
import { GrantCall, GrantCallUpsert, SubscriptionStats } from '../../types';
import { CATEGORIES, POWIATY, categoryLabel, formatPLN, powiatLabel } from '../../constants/domain';

const todayIso = () => new Date().toISOString().slice(0, 10);

const EMPTY_CALL: GrantCallUpsert = {
  title: '',
  opens_on: todayIso(),
  closes_on: todayIso(),
  min_budget_pln: 5000,
  max_budget_pln: 30000,
  criteria: [],
  category: null,
  powiat: null
};

const fieldCls = 'w-full text-sm p-2 rounded-lg border border-slate-300 bg-white';

/** Panel ROPS (G5): liczby subskrybentów (bez adresów) i zarządzanie naborami z automatycznym powiadomieniem. */
export const SubscriptionsAdmin: React.FC<{ onStatus: (message: string) => void }> = ({ onStatus }) => {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [calls, setCalls] = useState<GrantCall[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; data: GrantCallUpsert; criteriaText: string } | null>(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [s, c] = await Promise.all([api.getSubscriptionStats(), api.getGrantCalls()]);
      setStats(s);
      setCalls(c);
      setError('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się wczytać subskrypcji i naborów.'));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (call?: GrantCall) => {
    setFormError('');
    if (!call) {
      setEditing({ id: null, data: { ...EMPTY_CALL, opens_on: todayIso(), closes_on: todayIso() }, criteriaText: '' });
      return;
    }
    setEditing({
      id: call.id,
      data: {
        title: call.title, opens_on: call.opens_on, closes_on: call.closes_on, min_budget_pln: call.min_budget_pln,
        max_budget_pln: call.max_budget_pln, criteria: call.criteria, category: call.category ?? null, powiat: call.powiat ?? null
      },
      criteriaText: call.criteria.join('\n')
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setFormError('');
    const payload: GrantCallUpsert = {
      ...editing.data,
      criteria: editing.criteriaText.split('\n').map((c) => c.trim()).filter(Boolean),
      category: editing.data.category || null,
      powiat: editing.data.powiat || null
    };
    try {
      const res = editing.id ? await api.updateGrantCall(editing.id, payload) : await api.createGrantCall(payload);
      setEditing(null);
      onStatus(`${res.message} E-maile są w skrzynce nadawczej powyżej.`);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Nie udało się zapisać naboru.'));
    } finally {
      setBusy(false);
    }
  };

  const set = (patch: Partial<GrantCallUpsert>) => editing && setEditing({ ...editing, data: { ...editing.data, ...patch } });

  return (
    <section aria-labelledby="subs-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:hidden">
      <div>
        <h2 id="subs-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BellRing className="w-5 h-5 text-blue-700" aria-hidden="true" /> Subskrypcje powiadomień i nabory
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Gdy dodasz innowację albo otworzysz lub zmienisz nabór, osoby zapisane na dany temat i powiat dostają e-mail automatycznie.
          Widzisz tylko liczby – bez listy adresów.
        </p>
      </div>

      {error && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-200 p-3 rounded-lg">{error}</p>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-600">Aktywni subskrybenci</p>
            <p className="text-3xl font-black text-blue-700">{stats.active_total}</p>
            <ul className="mt-2 space-y-0.5 text-slate-800">
              {stats.by_topic.map((t) => <li key={t.key}>{t.label}: <strong>{t.count}</strong></li>)}
            </ul>
            <p className="mt-2 text-xs text-slate-600">Wysłane alerty: {stats.alerts_sent}</p>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <table className="w-full">
              <caption className="text-left text-xs font-bold text-slate-600 mb-1">Wg kategorii</caption>
              <tbody>
                <tr className="border-b border-slate-100">
                  <th scope="row" className="text-left font-normal py-0.5">Wszystkie tematy</th>
                  <td className="text-right font-bold">{stats.all_categories_count}</td>
                </tr>
                {stats.by_category.map((c) => (
                  <tr key={c.key} className="border-b border-slate-100">
                    <th scope="row" className="text-left font-normal py-0.5">{c.label}</th>
                    <td className="text-right font-bold">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <table className="w-full">
              <caption className="text-left text-xs font-bold text-slate-600 mb-1">Wg powiatu</caption>
              <tbody>
                <tr className="border-b border-slate-100">
                  <th scope="row" className="text-left font-normal py-0.5">Cała Małopolska</th>
                  <td className="text-right font-bold">{stats.all_powiaty_count}</td>
                </tr>
                {stats.by_powiat.map((p) => (
                  <tr key={p.key} className="border-b border-slate-100">
                    <th scope="row" className="text-left font-normal py-0.5">{powiatLabel(p.key)}</th>
                    <td className="text-right font-bold">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.by_powiat.length === 0 && <p className="text-xs text-slate-600 mt-1">Nikt nie zawęził jeszcze obszaru do powiatu.</p>}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-blue-700" aria-hidden="true" /> Nabory grantowe ({calls.length})
          </h3>
          <button type="button" onClick={() => startEdit()} className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-3 py-2 rounded-lg inline-flex items-center gap-1">
            <Plus className="w-4 h-4" aria-hidden="true" /> Otwórz nowy nabór
          </button>
        </div>

        {editing && (
          <form onSubmit={save} className="border-2 border-blue-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <h4 className="md:col-span-2 font-bold text-slate-900">{editing.id ? `Zmiana naboru: ${editing.id}` : 'Nowy nabór'}</h4>
            <div className="md:col-span-2">
              <label htmlFor="call-title" className="block font-bold text-slate-800 mb-1">Nazwa naboru</label>
              <input id="call-title" required minLength={5} value={editing.data.title} onChange={(e) => set({ title: e.target.value })} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="call-open" className="block font-bold text-slate-800 mb-1">Otwarcie</label>
              <input id="call-open" type="date" required value={editing.data.opens_on} onChange={(e) => set({ opens_on: e.target.value })} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="call-close" className="block font-bold text-slate-800 mb-1">Zamknięcie</label>
              <input id="call-close" type="date" required value={editing.data.closes_on} onChange={(e) => set({ closes_on: e.target.value })} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="call-min" className="block font-bold text-slate-800 mb-1">Kwota minimalna (zł)</label>
              <input id="call-min" type="number" min={0} required value={editing.data.min_budget_pln} onChange={(e) => set({ min_budget_pln: Number(e.target.value) })} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="call-max" className="block font-bold text-slate-800 mb-1">Kwota maksymalna (zł)</label>
              <input id="call-max" type="number" min={0} required value={editing.data.max_budget_pln} onChange={(e) => set({ max_budget_pln: Number(e.target.value) })} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="call-cat" className="block font-bold text-slate-800 mb-1">Obszar tematyczny</label>
              <select id="call-cat" value={editing.data.category ?? ''} onChange={(e) => set({ category: e.target.value || null })} className={fieldCls}>
                <option value="">Wszystkie tematy</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="call-powiat" className="block font-bold text-slate-800 mb-1">Powiat</label>
              <select id="call-powiat" value={editing.data.powiat ?? ''} onChange={(e) => set({ powiat: e.target.value || null })} className={fieldCls}>
                <option value="">Cała Małopolska</option>
                {POWIATY.map((p) => <option key={p} value={p}>{powiatLabel(p)}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="call-criteria" className="block font-bold text-slate-800 mb-1">Kryteria (każde w nowej linii)</label>
              <textarea id="call-criteria" rows={3} value={editing.criteriaText} onChange={(e) => setEditing({ ...editing, criteriaText: e.target.value })} className={fieldCls} />
            </div>
            <p className="md:col-span-2 text-xs text-slate-600">
              Po zapisaniu pasujący subskrybenci dostaną e-mail (nowy nabór albo opis zmian), chyba że nabór jest już zamknięty.
            </p>
            {formError && <p role="alert" className="md:col-span-2 text-rose-900 bg-rose-50 border border-rose-200 p-2 rounded-lg">{formError}</p>}
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-3 py-2 border border-slate-300 rounded-lg">Anuluj</button>
              <button type="submit" disabled={busy} className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg">
                {busy ? 'Zapisywanie…' : 'Zapisz i powiadom'}
              </button>
            </div>
          </form>
        )}

        <ul className="divide-y divide-slate-100">
          {calls.map((c) => (
            <li key={c.id} className="py-2 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span>
                <strong>{c.title}</strong>{' '}
                <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded ${c.is_open ? 'bg-emerald-100 text-emerald-950' : 'bg-slate-100 text-slate-800'}`}>
                  {c.is_open ? 'otwarty' : c.opens_on > todayIso() ? 'zaplanowany' : 'zamknięty'}
                </span>
                <span className="block text-slate-600">
                  {c.opens_on} – {c.closes_on} · {formatPLN(c.min_budget_pln)}–{formatPLN(c.max_budget_pln)}
                  {c.category ? ` · ${categoryLabel(c.category)}` : ''} · {c.powiat ? powiatLabel(c.powiat) : 'cała Małopolska'}
                </span>
              </span>
              <button type="button" onClick={() => startEdit(c)} className="flex items-center gap-1 text-blue-700 font-bold">
                <Pencil className="w-4 h-4" aria-hidden="true" /> Zmień<span className="sr-only"> {c.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
