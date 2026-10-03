import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../services/api';
import { EducationalMaterial, InnovationItem, RegionalChallenge } from '../types';
import { MalopolskaMap } from '../components/map/MalopolskaMap';
import {
  Compass,
  Search,
  FileText,
  Building2,
  BookOpen,
  Download,
  CheckCircle2,
  Layers,
  ExternalLink,
  Sparkles,
  X
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';
import { useDialog } from '../hooks/useDialog';
import { CATEGORIES, categoryLabel } from '../constants/domain';

type Tab = 'katalog' | 'mapa' | 'edukacja';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'katalog', label: 'Biblioteka Innowacji', icon: Layers },
  { id: 'mapa', label: 'Wyzwania 22 powiatów', icon: Compass },
  { id: 'edukacja', label: 'Materiały i narzędzia', icon: BookOpen }
];

const MATERIAL_ICONS = [FileText, Building2, BookOpen];

const youtubeEmbed = (url: string) => {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
};

export const KnowledgeView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { innovationId } = useParams();
  const navigate = useNavigate();
  const legacyId = searchParams.get('id');
  const { etrMode } = useAccessibility();

  const [innovations, setInnovations] = useState<InnovationItem[]>([]);
  const [challenges, setChallenges] = useState<RegionalChallenge[]>([]);
  const [materials, setMaterials] = useState<EducationalMaterial[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInnovation, setSelectedInnovation] = useState<InnovationItem | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('katalog');

  const closeModal = () => navigate('/baza-wiedzy');
  const dialogRef = useDialog<HTMLDivElement>(!!selectedInnovation, closeModal);

  // Dane statyczne (mapa, materiały)
  useEffect(() => {
    Promise.all([api.getRegionalChallenges(), api.getMaterials()])
      .then(([chs, mats]) => {
        setChallenges(chs);
        setMaterials(mats);
      })
      .catch(() => undefined);
  }, []);

  // Wyszukiwanie na żywo (bez względu na wielkość liter i polskie znaki – po stronie API)
  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      api
        .getInnovations(category || undefined, search.trim() || undefined)
        .then((items) => {
          setInnovations(items);
          setError('');
        })
        .catch((err) => setError(apiErrorMessage(err, 'Nie udało się wczytać katalogu innowacji.')))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [search, category]);

  // Karta innowacji pod własnym adresem: /baza-wiedzy/rops-inn-002
  useEffect(() => {
    const id = innovationId || legacyId;
    if (!id) {
      setSelectedInnovation(null);
      return;
    }
    if (legacyId && !innovationId) {
      navigate(`/baza-wiedzy/${legacyId}`, { replace: true });
      return;
    }
    api
      .getInnovationById(id)
      .then(setSelectedInnovation)
      .catch(() => {
        setSelectedInnovation(null);
        setError('Nie znaleziono innowacji o podanym adresie.');
      });
  }, [innovationId, legacyId]);

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = (index + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    setActiveTab(TABS[next].id);
    document.getElementById(`tab-${TABS[next].id}`)?.focus();
  };

  const video = selectedInnovation?.video_url ? youtubeEmbed(selectedInnovation.video_url) : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Nagłówek Modułu */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <Compass className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          <span>Moduł II: Zasobnik Wiedzy</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Katalog sprawdzonych pomysłów' : 'Biblioteka Innowacji Społecznych i diagnoza regionu'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          {etrMode
            ? 'Tu znajdziesz pomysły, które już komuś pomogły. Możesz je przeczytać prostym językiem.'
            : 'Przetestowane innowacje społeczne (wersja demonstracyjna: 10 kart), wyzwania 22 powiatów Małopolski oraz materiały metodyczne.'}
        </p>

        {/* Zakładki */}
        <div role="tablist" aria-label="Sekcje bazy wiedzy" className="flex flex-wrap border-b border-slate-200 mt-6 gap-x-6 text-sm font-bold">
          {TABS.map((t, i) => {
            const Icon = t.icon;
            const selected = activeTab === t.id;
            return (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(t.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
                  selected ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {t.label}
                {t.id === 'katalog' && ` (${innovations.length})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Widok 1: Katalog Innowacji */}
      {activeTab === 'katalog' && (
        <div id="panel-katalog" role="tabpanel" aria-labelledby="tab-katalog" className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-end justify-between">
            <div className="flex-1 w-full">
              <label htmlFor="knowledge-search" className="block text-xs font-bold text-slate-700 mb-1">
                Szukaj innowacji (wielkość liter i polskie znaki nie mają znaczenia)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="knowledge-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="np. łazienka, samotnosc, komiks, senior"
                  className="w-full text-sm p-2.5 pl-9 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 text-slate-900"
                />
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <label htmlFor="knowledge-category" className="block text-xs font-bold text-slate-700 mb-1">Kategoria</label>
              <select
                id="knowledge-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full sm:w-64 text-sm p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                <option value="">Wszystkie kategorie</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div aria-live="polite" className="sr-only">
            {!loading && `Znaleziono ${innovations.length} innowacji.`}
          </div>

          {error && <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-sm">{error}</p>}

          {!loading && !error && innovations.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <p className="text-base font-bold text-slate-900">Brak innowacji pasujących do wyszukiwania.</p>
              <p className="text-sm text-slate-600">Spróbuj innego słowa, wyczyść filtr kategorii albo opisz problem – dopasujemy rozwiązania.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => { setSearch(''); setCategory(''); }} className="border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100">
                  Wyczyść filtry
                </button>
                <Link to={`/matchmaking${search ? `?q=${encodeURIComponent(search)}` : ''}`} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-bold">
                  Opisz problem w Matchmakingu
                </Link>
              </div>
            </div>
          )}

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {innovations.map((inn) => (
              <li
                key={inn.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                      {inn.category_label ?? categoryLabel(inn.category)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      {inn.readiness_level}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 mb-1">{inn.title}</h2>
                  <p className="text-sm font-medium text-slate-600 mb-3">{inn.tagline}</p>
                  <p className="text-sm text-slate-700 leading-relaxed mb-4 line-clamp-3">
                    {etrMode && inn.etr_summary ? inn.etr_summary : inn.full_description}
                  </p>

                  <ul className="flex flex-wrap gap-1.5 mb-4" aria-label="Grupy docelowe">
                    {inn.target_groups.map((tg, i) => (
                      <li key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{tg}</li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-600 font-medium">Budżet: {inn.budget_bracket}</span>
                  <Link
                    to={`/baza-wiedzy/${inn.id}`}
                    className="text-sm font-bold text-blue-700 hover:text-blue-900 underline-offset-2 hover:underline"
                  >
                    Karta innowacji<span className="sr-only">: {inn.title}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Widok 2: Wyzwania powiatów */}
      {activeTab === 'mapa' && (
        <div id="panel-mapa" role="tabpanel" aria-labelledby="tab-mapa">
          <MalopolskaMap challenges={challenges} />
        </div>
      )}

      {/* Widok 3: Materiały */}
      {activeTab === 'edukacja' && (
        <div id="panel-edukacja" role="tabpanel" aria-labelledby="tab-edukacja" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {materials.map((m, i) => {
            const Icon = MATERIAL_ICONS[i % MATERIAL_ICONS.length];
            return (
              <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">{m.category} · {m.format}</p>
                  <h2 className="font-bold text-slate-900 text-sm mb-1">{m.title}</h2>
                  <p className="text-sm text-slate-600 mb-4">{m.description}</p>
                </div>
                {m.is_external ? (
                  <a href={m.download_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-700 flex items-center gap-1.5 hover:underline">
                    <ExternalLink className="w-4 h-4" aria-hidden="true" /> Otwórz stronę
                    <span className="sr-only">(otwiera się w nowej karcie, serwis zewnętrzny)</span>
                  </a>
                ) : (
                  <Link to={m.download_url} className="text-sm font-bold text-blue-700 flex items-center gap-1.5 hover:underline">
                    <Download className="w-4 h-4" aria-hidden="true" /> Otwórz narzędzie
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Karta Innowacji (okno dialogowe) */}
      {selectedInnovation && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={closeModal}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="innovation-dialog-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Karta innowacji · {selectedInnovation.id}</span>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Zamknij kartę innowacji"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <h2 id="innovation-dialog-title" className="text-2xl font-black text-slate-900 mb-1">{selectedInnovation.title}</h2>
            <p className="text-sm font-medium text-slate-600 mb-4">{selectedInnovation.tagline}</p>

            <dl className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <dt className="text-xs font-bold text-slate-600">Kategoria</dt>
                <dd className="font-semibold text-slate-900">{selectedInnovation.category_label ?? categoryLabel(selectedInnovation.category)}</dd>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <dt className="text-xs font-bold text-slate-600">Gotowość</dt>
                <dd className="font-semibold text-slate-900">{selectedInnovation.readiness_level}</dd>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <dt className="text-xs font-bold text-slate-600">Budżet</dt>
                <dd className="font-semibold text-slate-900">{selectedInnovation.budget_bracket}</dd>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <dt className="text-xs font-bold text-slate-600">Pochodzenie</dt>
                <dd className="font-semibold text-slate-900">{selectedInnovation.origin_poviat ? `powiat ${selectedInnovation.origin_poviat}` : 'brak danych'}</dd>
              </div>
              <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <dt className="text-xs font-bold text-slate-600">Grupy docelowe</dt>
                <dd className="font-semibold text-slate-900">{selectedInnovation.target_groups.join(', ')}</dd>
              </div>
            </dl>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-sm leading-relaxed text-slate-800">
              <h3 className="text-slate-900 font-bold mb-1">Opis metodyki</h3>
              {selectedInnovation.full_description}
            </div>

            {selectedInnovation.etr_summary && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4 text-sm leading-relaxed text-amber-950">
                <h3 className="text-amber-950 font-bold mb-1">Prostym językiem (ETR)</h3>
                {selectedInnovation.etr_summary}
              </div>
            )}

            {video && (
              <div className="mb-4 aspect-video rounded-xl overflow-hidden border border-slate-200">
                <iframe src={video} title={`Film: ${selectedInnovation.title}`} className="w-full h-full" allowFullScreen loading="lazy" />
              </div>
            )}
            {selectedInnovation.video_url && !video && (
              <a href={selectedInnovation.video_url} target="_blank" rel="noreferrer" className="block mb-2 text-sm font-bold text-blue-700 underline">
                Obejrzyj film o innowacji (nowa karta)
              </a>
            )}
            {selectedInnovation.handbook_url && (
              <a href={selectedInnovation.handbook_url} target="_blank" rel="noreferrer" className="block mb-4 text-sm font-bold text-blue-700 underline">
                Pobierz podręcznik wdrożenia (nowa karta)
              </a>
            )}
            {!selectedInnovation.video_url && !selectedInnovation.handbook_url && (
              <p className="text-xs text-slate-600 mb-4">Film i podręcznik wdrożenia zostaną dodane przez koordynatora ROPS.</p>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-slate-100">
              <Link
                to={`/middleman?inn=${selectedInnovation.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold"
              >
                <Building2 className="w-4 h-4 text-amber-400" aria-hidden="true" /> Adaptuj dla gminy
              </Link>
              <Link
                to={`/tester`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" /> Testy i opinie
              </Link>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
