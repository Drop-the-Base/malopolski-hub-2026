import React, { useEffect, useState } from 'react';
import { BookOpen, Download, EyeOff, Eye, MapPinned, Pencil, Plus, Sparkles } from 'lucide-react';
import { api, apiErrorMessage } from '../../services/api';
import {
  AdminExportKind,
  EducationalMaterialAdmin,
  EducationalMaterialUpsert,
  NewSinceLogin,
  RegionalChallenge
} from '../../types';
import { formatDateTime } from '../../constants/domain';

const fieldCls = 'w-full text-sm p-2 rounded-lg border border-slate-300 bg-white';

/** Licznik „nowe od ostatniego logowania” – pierwsze, co widzi koordynator po wejściu do panelu. */
export const NewSinceLoginSummary: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
  const [data, setData] = useState<NewSinceLogin | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getNewSinceLogin().then(setData).catch((err) => setError(apiErrorMessage(err, 'Nie udało się policzyć nowych zgłoszeń.')));
  }, [refreshKey]);

  if (error) return <p className="text-sm text-rose-900">{error}</p>;
  if (!data) return null;

  const tiles = [
    { label: 'nowe fiszki pomysłów', value: data.new_ideas },
    { label: 'nowe wpisy Rejestru Wyzwań', value: data.new_problem_reports },
    { label: 'zapytania w Matchmakingu', value: data.new_matchmaking_queries },
    { label: 'opinie z testów (SUS)', value: data.new_tester_feedback },
    { label: 'rezerwacje konsultacji', value: data.new_mentor_bookings }
  ];

  return (
    <section aria-labelledby="new-since-title" className="bg-white p-6 rounded-2xl border-2 border-blue-600 shadow-sm">
      <h2 id="new-since-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-700" aria-hidden="true" />
        {data.total > 0 ? `Nowe od ostatniego logowania: ${data.total}` : 'Nic nowego od ostatniego logowania'}
      </h2>
      <p className="text-sm text-slate-700 mt-1">
        {data.first_login
          ? `To pierwsze logowanie – pokazujemy zmiany z ostatnich 7 dni (od ${formatDateTime(data.since)}).`
          : `Poprzednie logowanie: ${formatDateTime(data.since)}.`}
      </p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
        {tiles.map((t) => (
          <li key={t.label} className={`rounded-xl border p-3 ${t.value > 0 ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}>
            <span className="block text-2xl font-black text-slate-900 tabular-nums">{t.value}</span>
            <span className="text-xs text-slate-700">{t.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const EXPORTS: { kind: AdminExportKind; label: string; hint: string }[] = [
  { kind: 'ideas', label: 'Fiszki pomysłów', hint: 'tytuł, streszczenie, powiat, etap, status, klaster, głosy' },
  { kind: 'problems', label: 'Zgłoszenia problemów', hint: 'Rejestr Wyzwań i anonimowe zapytania Matchmakingu' },
  { kind: 'needs', label: 'Potrzeby zagregowane', hint: 'liczba zgłoszeń per powiat i obszar' }
];

const EMPTY_MATERIAL: EducationalMaterialUpsert = {
  title: '',
  category: 'Metodyka',
  description: '',
  download_url: 'https://',
  format: 'Strona zewnętrzna',
  is_published: true,
  sort_order: 0
};

const TRENDS = ['depopulacja', 'stabilny', 'dynamiczny wzrost'];

/** Eksport CSV oraz szybka edycja materiałów edukacyjnych i wyzwań powiatów (Panel ROPS). */
export const AdminDataTools: React.FC<{ onStatus: (message: string) => void }> = ({ onStatus }) => {
  const [materials, setMaterials] = useState<EducationalMaterialAdmin[]>([]);
  const [challenges, setChallenges] = useState<RegionalChallenge[]>([]);
  const [editingMaterial, setEditingMaterial] = useState<{ id: string | null; data: EducationalMaterialUpsert } | null>(null);
  const [materialError, setMaterialError] = useState('');
  const [selectedPowiat, setSelectedPowiat] = useState('');
  const [challengeDraft, setChallengeDraft] = useState({ key_social_challenge: '', demographic_trend: '' });
  const [challengeError, setChallengeError] = useState('');
  const [exporting, setExporting] = useState<AdminExportKind | null>(null);

  const loadMaterials = () => api.getAdminMaterials().then(setMaterials).catch(() => setMaterials([]));
  const loadChallenges = () => api.getRegionalChallenges().then(setChallenges).catch(() => setChallenges([]));

  useEffect(() => {
    loadMaterials();
    loadChallenges();
  }, []);

  const doExport = async (kind: AdminExportKind, label: string) => {
    setExporting(kind);
    try {
      const filename = await api.downloadAdminExport(kind);
      onStatus(`Pobrano plik „${filename}” (${label}). Otworzysz go w Excelu lub LibreOffice.`);
    } catch (err) {
      onStatus(apiErrorMessage(err, 'Nie udało się przygotować eksportu.'));
    } finally {
      setExporting(null);
    }
  };

  const saveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setMaterialError('');
    try {
      if (editingMaterial.id) await api.updateMaterial(editingMaterial.id, editingMaterial.data);
      else await api.createMaterial(editingMaterial.data);
      onStatus(`Zapisano materiał „${editingMaterial.data.title}”. Jest już widoczny w Bazie wiedzy${editingMaterial.data.is_published ? '' : ' (jako ukryty)'}.`);
      setEditingMaterial(null);
      loadMaterials();
    } catch (err) {
      setMaterialError(apiErrorMessage(err, 'Nie udało się zapisać materiału.'));
    }
  };

  const togglePublished = async (m: EducationalMaterialAdmin) => {
    try {
      if (m.is_published) await api.hideMaterial(m.id);
      else {
        await api.updateMaterial(m.id, {
          title: m.title, category: m.category, description: m.description, download_url: m.download_url,
          format: m.format, is_published: true, sort_order: m.sort_order
        });
      }
      onStatus(m.is_published ? `Ukryto materiał „${m.title}”.` : `Przywrócono materiał „${m.title}”.`);
      loadMaterials();
    } catch (err) {
      onStatus(apiErrorMessage(err, 'Nie udało się zmienić widoczności materiału.'));
    }
  };

  const selectPowiat = (code: string) => {
    setSelectedPowiat(code);
    setChallengeError('');
    const c = challenges.find((x) => x.powiat_code === code);
    setChallengeDraft({ key_social_challenge: c?.key_social_challenge ?? '', demographic_trend: c?.demographic_trend ?? '' });
  };

  const saveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPowiat) return;
    setChallengeError('');
    try {
      const updated = await api.updateChallenge(selectedPowiat, {
        key_social_challenge: challengeDraft.key_social_challenge,
        demographic_trend: challengeDraft.demographic_trend || undefined
      });
      onStatus(`Zapisano wyzwanie: ${updated.powiat_name}. Mapa Wyzwań pokazuje już nową treść.`);
      loadChallenges();
    } catch (err) {
      setChallengeError(apiErrorMessage(err, 'Nie udało się zapisać wyzwania.'));
    }
  };

  return (
    <>
      {/* Eksport CSV */}
      <section aria-labelledby="export-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 id="export-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-700" aria-hidden="true" /> Eksport danych do arkusza (CSV)
        </h2>
        <p className="text-sm text-slate-700 mt-1 mb-4">
          Pliki otwierają się w Excelu i LibreOffice (separator „;”, polskie znaki). Eksport nie zawiera imion ani adresów
          e-mail autorów i zgłaszających – dane kontaktowe są tylko w panelu.
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EXPORTS.map((x) => (
            <li key={x.kind} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
              <span className="font-bold text-slate-900">{x.label}</span>
              <span className="text-xs text-slate-700 flex-1">{x.hint}</span>
              <button
                type="button"
                onClick={() => doExport(x.kind, x.label)}
                disabled={exporting !== null}
                className="self-start bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-60"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                {exporting === x.kind ? 'Przygotowuję…' : 'Pobierz CSV'}
                <span className="sr-only">: {x.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Wyzwania powiatów */}
      <section aria-labelledby="challenges-edit-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 id="challenges-edit-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MapPinned className="w-5 h-5 text-blue-700" aria-hidden="true" /> Wyzwania powiatów – szybka edycja
        </h2>
        <p className="text-sm text-slate-700 mt-1 mb-4">
          Kluczowe wyzwanie powiatu widać na Mapie Wyzwań w Bazie wiedzy i w otwartym API. Wskaźniki liczbowe (ludność,
          udział seniorów) pochodzą z danych statystycznych i nie są tu edytowane.
        </p>
        <form onSubmit={saveChallenge} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <label htmlFor="challenge-powiat" className="block font-bold text-slate-800 mb-1">Powiat</label>
            <select id="challenge-powiat" value={selectedPowiat} onChange={(e) => selectPowiat(e.target.value)} className={fieldCls}>
              <option value="">— wybierz powiat —</option>
              {challenges.map((c) => <option key={c.powiat_code} value={c.powiat_code}>{c.powiat_name}</option>)}
            </select>
          </div>
          {selectedPowiat && (
            <>
              <div className="md:col-span-2">
                <label htmlFor="challenge-text" className="block font-bold text-slate-800 mb-1">Kluczowe wyzwanie (do 300 znaków)</label>
                <input
                  id="challenge-text"
                  required
                  minLength={3}
                  maxLength={300}
                  value={challengeDraft.key_social_challenge}
                  onChange={(e) => setChallengeDraft({ ...challengeDraft, key_social_challenge: e.target.value })}
                  className={fieldCls}
                />
              </div>
              <div>
                <label htmlFor="challenge-trend" className="block font-bold text-slate-800 mb-1">Trend demograficzny</label>
                <select
                  id="challenge-trend"
                  value={challengeDraft.demographic_trend}
                  onChange={(e) => setChallengeDraft({ ...challengeDraft, demographic_trend: e.target.value })}
                  className={fieldCls}
                >
                  {[...new Set([...TRENDS, challengeDraft.demographic_trend].filter(Boolean))].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {challengeError && <p role="alert" className="md:col-span-3 text-rose-900 bg-rose-50 border border-rose-200 p-2 rounded-lg">{challengeError}</p>}
              <div className="md:col-span-2 flex items-end justify-end gap-2">
                <button type="button" onClick={() => setSelectedPowiat('')} className="px-3 py-2 border border-slate-300 rounded-lg">Anuluj</button>
                <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg">Zapisz wyzwanie</button>
              </div>
            </>
          )}
        </form>
      </section>

      {/* Materiały edukacyjne */}
      <section aria-labelledby="materials-edit-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 id="materials-edit-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-700" aria-hidden="true" /> Materiały edukacyjne – edycja ({materials.length})
          </h2>
          <button
            type="button"
            onClick={() => { setMaterialError(''); setEditingMaterial({ id: null, data: { ...EMPTY_MATERIAL, sort_order: materials.length } }); }}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Dodaj materiał
          </button>
        </div>

        {editingMaterial && (
          <form onSubmit={saveMaterial} className="border-2 border-blue-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <h3 className="md:col-span-2 font-bold text-slate-900">{editingMaterial.id ? `Edycja: ${editingMaterial.id}` : 'Nowy materiał'}</h3>
            {([
              ['title', 'Tytuł', true],
              ['category', 'Kategoria (np. Metodyka, Wdrożenie, Dostępność)', true],
              ['format', 'Format (np. PDF, Strona zewnętrzna)', true],
              ['download_url', 'Link (https://… lub ścieżka w Hubie, np. /kreator-pomyslow)', true]
            ] as const).map(([key, label, required]) => (
              <div key={key}>
                <label htmlFor={`mat-${key}`} className="block font-bold text-slate-800 mb-1">{label}</label>
                <input
                  id={`mat-${key}`}
                  required={required}
                  value={editingMaterial.data[key]}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, data: { ...editingMaterial.data, [key]: e.target.value } })}
                  className={fieldCls}
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label htmlFor="mat-description" className="block font-bold text-slate-800 mb-1">Opis (1–2 zdania)</label>
              <textarea
                id="mat-description"
                rows={2}
                maxLength={1000}
                value={editingMaterial.data.description}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, data: { ...editingMaterial.data, description: e.target.value } })}
                className={fieldCls}
              />
            </div>
            <div>
              <label htmlFor="mat-order" className="block font-bold text-slate-800 mb-1">Kolejność na liście</label>
              <input
                id="mat-order"
                type="number"
                min={0}
                max={999}
                value={editingMaterial.data.sort_order}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, data: { ...editingMaterial.data, sort_order: Number(e.target.value) || 0 } })}
                className={fieldCls}
              />
            </div>
            <label className="flex items-center gap-2 self-end">
              <input
                type="checkbox"
                checked={editingMaterial.data.is_published}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, data: { ...editingMaterial.data, is_published: e.target.checked } })}
              />
              Widoczny w Bazie wiedzy
            </label>
            {materialError && <p role="alert" className="md:col-span-2 text-rose-900 bg-rose-50 border border-rose-200 p-2 rounded-lg">{materialError}</p>}
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingMaterial(null)} className="px-3 py-2 border border-slate-300 rounded-lg">Anuluj</button>
              <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg">Zapisz</button>
            </div>
          </form>
        )}

        <ul className="divide-y divide-slate-100">
          {materials.map((m) => (
            <li key={m.id} className="py-2 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span>
                <strong className={m.is_published ? 'text-slate-900' : 'text-slate-600 line-through'}>{m.title}</strong>
                <span className="text-slate-600"> · {m.category} · {m.format}{!m.is_published && ' · ukryty'}</span>
              </span>
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMaterialError('');
                    setEditingMaterial({
                      id: m.id,
                      data: {
                        title: m.title, category: m.category, description: m.description, download_url: m.download_url,
                        format: m.format, is_published: m.is_published, sort_order: m.sort_order
                      }
                    });
                  }}
                  className="flex items-center gap-1 text-blue-700 font-bold"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" /> Edytuj<span className="sr-only"> {m.title}</span>
                </button>
                <button type="button" onClick={() => togglePublished(m)} className="flex items-center gap-1 text-slate-800 font-bold">
                  {m.is_published ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  {m.is_published ? 'Ukryj' : 'Przywróć'}<span className="sr-only"> {m.title}</span>
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};
