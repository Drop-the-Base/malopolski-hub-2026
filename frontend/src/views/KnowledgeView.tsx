import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../services/api';
import { EducationalMaterial, InnovationItem, InnovationRatingSummary, RegionalChallenge } from '../types';
import { MalopolskaMap } from '../components/map/MalopolskaMap';
import { InnovationRating, RatingBadge } from '../components/innovation/InnovationRating';
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
  X,
  MapPin,
  Users,
  Wallet,
  PlayCircle
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';
import { useDialog } from '../hooks/useDialog';
import { CATEGORIES, categoryLabel, powiatLabel } from '../constants/domain';

type Tab = 'katalog' | 'mapa' | 'edukacja';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'katalog', label: 'Biblioteka Innowacji', icon: Layers },
  { id: 'mapa', label: 'Wyzwania 22 powiatów', icon: Compass },
  { id: 'edukacja', label: 'Materiały i narzędzia', icon: BookOpen }
];

const MATERIAL_ICONS = [FileText, Building2, BookOpen];

// Szerokie grupy odbiorców (prosty język) zamiast kilkudziesięciu szczegółowych etykiet z kart
const AUDIENCE_GROUPS: { id: string; label: string; pattern: RegExp }[] = [
  { id: 'seniorzy', label: 'Seniorzy', pattern: /senior/i },
  { id: 'mlodzi', label: 'Dzieci i młodzież', pattern: /dzieci|młodzież|wychowank|uczni/i },
  { id: 'opiekunowie', label: 'Opiekunowie i rodziny', pattern: /opiekun|rodzin/i },
  { id: 'niepelnosprawnosci', label: 'Osoby z niepełnosprawnościami i chorobami', pattern: /niepełnospr|autyzm|afazj|niedowidz|ADHD|udar|Alzheimer|niesamodziel/i },
  { id: 'wies', label: 'Mieszkańcy wsi', pattern: /wsi|działkow/i },
  { id: 'specjalisci', label: 'Szkoły, urzędy i specjaliści', pattern: /nauczyciel|pedagog|psycholog|urzęd|mentor|wolontariusz/i }
];

const matchesAudience = (inn: InnovationItem, groupId: string) => {
  const g = AUDIENCE_GROUPS.find((a) => a.id === groupId);
  return !g || inn.target_groups.some((t) => g.pattern.test(t));
};

const isTab = (v: string | null): v is Tab => v === 'katalog' || v === 'mapa' || v === 'edukacja';

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
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<Tab>(isTab(tabParam) ? tabParam : 'katalog');
  const [allInnovations, setAllInnovations] = useState<InnovationItem[]>([]);
  const [powiatFilter, setPowiatFilter] = useState(searchParams.get('powiat') || '');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [ratings, setRatings] = useState<Record<string, InnovationRatingSummary>>({});

  // Link z innej strony (np. „Mapa wyzwań” na stronie głównej) przełącza zakładkę
  useEffect(() => {
    if (isTab(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

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
    // Pełny katalog – do list wyboru w filtrach (powiat, grupa odbiorców)
    api.getInnovations().then(setAllInnovations).catch(() => undefined);
    api
      .getRatingSummaries()
      .then((list) => setRatings(Object.fromEntries(list.map((r) => [r.innovation_id, r]))))
      .catch(() => undefined);
  }, []);

  const powiatOptions = Array.from(
    new Set([...allInnovations.map((i) => i.origin_poviat), powiatFilter].filter((p): p is string => !!p))
  ).sort((a, b) => a.localeCompare(b, 'pl'));
  const audienceOptions = AUDIENCE_GROUPS.filter((g) => allInnovations.some((i) => matchesAudience(i, g.id)));

  const visibleInnovations = innovations.filter(
    (i) => (!powiatFilter || i.origin_poviat === powiatFilter) && matchesAudience(i, audienceFilter)
  );
  const hasFilters = !!(search || category || powiatFilter || audienceFilter);
  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setPowiatFilter('');
    setAudienceFilter('');
  };

  const showInnovationsFrom = (powiat: string) => {
    setSearch('');
    setCategory('');
    setAudienceFilter('');
    setPowiatFilter(powiat);
    setActiveTab('katalog');
    window.setTimeout(() => document.getElementById('tab-katalog')?.focus(), 0);
  };

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
                {t.id === 'katalog' && ` (${visibleInnovations.length})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Widok 1: Katalog Innowacji */}
      {activeTab === 'katalog' && (
        <div id="panel-katalog" role="tabpanel" aria-labelledby="tab-katalog" className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="knowledge-search" className="block text-sm font-bold text-slate-700 mb-1">
                {etrMode ? 'Szukaj' : 'Szukaj innowacji'}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="knowledge-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="np. łazienka, samotnosc, komiks"
                  aria-describedby="knowledge-search-hint"
                  className="w-full text-sm p-2.5 pl-9 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 text-slate-900"
                />
              </div>
              <p id="knowledge-search-hint" className="sr-only">Wielkość liter i polskie znaki nie mają znaczenia.</p>
            </div>

            <div>
              <label htmlFor="knowledge-category" className="block text-sm font-bold text-slate-700 mb-1">Temat</label>
              <select
                id="knowledge-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                <option value="">Wszystkie tematy</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="knowledge-audience" className="block text-sm font-bold text-slate-700 mb-1">Dla kogo</label>
              <select
                id="knowledge-audience"
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                <option value="">Wszyscy odbiorcy</option>
                {audienceOptions.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="knowledge-powiat" className="block text-sm font-bold text-slate-700 mb-1">Gdzie sprawdzona</label>
              <select
                id="knowledge-powiat"
                value={powiatFilter}
                onChange={(e) => setPowiatFilter(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                <option value="">Cała Małopolska</option>
                {powiatOptions.map((p) => (
                  <option key={p} value={p}>{powiatLabel(p)}</option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-700">
                  Pokazano <strong className="tabular-nums">{visibleInnovations.length}</strong> z {allInnovations.length || innovations.length} innowacji.
                </span>
                <button type="button" onClick={clearFilters} className="font-bold text-blue-700 underline underline-offset-4 hover:text-blue-900">
                  Wyczyść filtry
                </button>
              </div>
            )}
          </div>

          <div aria-live="polite" className="sr-only">
            {!loading && `Znaleziono ${visibleInnovations.length} innowacji.`}
          </div>

          {error && <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-sm">{error}</p>}

          {!loading && !error && visibleInnovations.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <p className="text-base font-bold text-slate-900">
                {powiatFilter && !search && !category && !audienceFilter
                  ? `W katalogu demonstracyjnym nie ma jeszcze innowacji sprawdzonej w: ${powiatLabel(powiatFilter)}.`
                  : 'Brak innowacji pasujących do wyszukiwania.'}
              </p>
              <p className="text-sm text-slate-600">Spróbuj innego słowa, wyczyść filtry albo opisz problem – dopasujemy rozwiązania z całego regionu.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" onClick={clearFilters} className="border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100">
                  Wyczyść filtry
                </button>
                <Link
                  to={`/matchmaking${search ? `?q=${encodeURIComponent(search)}` : powiatFilter ? `?powiat=${encodeURIComponent(powiatFilter)}` : ''}`}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-bold"
                >
                  Opisz problem i znajdź rozwiązanie
                </Link>
              </div>
            </div>
          )}

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleInnovations.map((inn) => (
              <li
                key={inn.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-blue-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                      {inn.category_label ?? categoryLabel(inn.category)}
                    </span>
                    <RatingBadge summary={ratings[inn.id]} />
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 mb-1">{inn.title}</h2>
                  <p className="text-sm font-medium text-slate-600 mb-3">{inn.tagline}</p>
                  <p className="text-sm text-slate-700 leading-relaxed mb-4 line-clamp-3">
                    {etrMode && inn.etr_summary ? inn.etr_summary : inn.problem_statement || inn.full_description}
                  </p>

                  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mb-4">
                    <div>
                      <dt className="text-slate-600">Koszt</dt>
                      <dd className="font-semibold text-slate-900">{inn.budget_bracket}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Gotowość</dt>
                      <dd className="font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        {inn.readiness_level}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Sprawdzona</dt>
                      <dd className="font-semibold text-slate-900">{inn.origin_poviat ? powiatLabel(inn.origin_poviat) : 'brak danych'}</dd>
                    </div>
                  </dl>

                  <ul className="flex flex-wrap gap-1.5 mb-4" aria-label="Dla kogo">
                    {inn.target_groups.map((tg, i) => (
                      <li key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{tg}</li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-600">
                    {inn.video_url && (
                      <span className="inline-flex items-center gap-1">
                        <PlayCircle className="w-4 h-4" aria-hidden="true" /> Karta z filmem
                      </span>
                    )}
                  </span>
                  <Link
                    to={`/baza-wiedzy/${inn.id}`}
                    className="text-sm font-bold text-blue-700 hover:text-blue-900 underline-offset-2 hover:underline"
                  >
                    {etrMode ? 'Zobacz więcej i oceń' : 'Karta innowacji i ocena'}
                    <span className="sr-only">: {inn.title}</span>
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
          <MalopolskaMap challenges={challenges} onShowInnovations={showInnovationsFrom} />
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
                  <p className="text-xs font-bold text-slate-600 mb-1">{m.category} · {m.format}</p>
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
            className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-sm font-bold text-blue-700">
                Karta innowacji · {selectedInnovation.category_label ?? categoryLabel(selectedInnovation.category)}
              </span>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Zamknij kartę innowacji"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <h2 id="innovation-dialog-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">{selectedInnovation.title}</h2>
            <p className="text-base text-slate-600 mb-5">{selectedInnovation.tagline}</p>

            {/* Najważniejsze wskaźniki */}
            <h3 className="sr-only">Najważniejsze informacje</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-6 text-sm border-y border-slate-200 py-4">
              <div className="flex gap-3">
                <Wallet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-slate-600">Koszt</dt>
                  <dd className="font-bold text-slate-900">{selectedInnovation.budget_bracket}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-slate-600">Gotowość</dt>
                  <dd className="font-bold text-slate-900">{selectedInnovation.readiness_level}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-slate-600">Dla kogo</dt>
                  <dd className="font-bold text-slate-900">{selectedInnovation.target_groups.join(', ')}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-slate-600">Gdzie sprawdzona</dt>
                  <dd className="font-bold text-slate-900">
                    {selectedInnovation.origin_poviat ? powiatLabel(selectedInnovation.origin_poviat) : 'brak danych'}
                  </dd>
                </div>
              </div>
            </dl>

            {etrMode && selectedInnovation.etr_summary && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6 text-base leading-relaxed text-amber-950">
                <h3 className="font-bold mb-1">Prostym językiem</h3>
                <p>{selectedInnovation.etr_summary}</p>
              </div>
            )}

            {/* Historia: problem → rozwiązanie → efekt (prawdziwa sekwencja, więc numerowana) */}
            <h3 className="text-lg font-bold text-slate-900 mb-3">{etrMode ? 'Jak to działa' : 'Historia innowacji'}</h3>
            <ol className="space-y-4 mb-6">
              {[
                { title: 'Problem', etrTitle: 'Co było trudne', text: selectedInnovation.problem_statement },
                { title: 'Rozwiązanie', etrTitle: 'Co zrobiono', text: selectedInnovation.full_description },
                { title: 'Efekt', etrTitle: 'Co się zmieniło', text: selectedInnovation.effect_description }
              ]
                .filter((step) => !!step.text)
                .map((step, i) => (
                  <li key={step.title} className="grid grid-cols-[2.25rem_1fr] gap-3">
                    <span
                      className="w-9 h-9 rounded-full border-2 border-blue-600 text-blue-700 font-extrabold flex items-center justify-center tabular-nums"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {etrMode ? step.etrTitle : step.title}
                        {etrMode && <span className="sr-only"> ({step.title})</span>}
                      </h4>
                      <p className="text-sm sm:text-base leading-relaxed text-slate-800">{step.text}</p>
                    </div>
                  </li>
                ))}
            </ol>

            {!etrMode && selectedInnovation.etr_summary && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6 text-sm leading-relaxed text-amber-950">
                <h3 className="font-bold mb-1">Prostym językiem (ETR)</h3>
                <p>{selectedInnovation.etr_summary}</p>
              </div>
            )}

            {/* Film tylko wtedy, gdy koordynator dodał adres – bez atrap */}
            {video && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Film o innowacji</h3>
                <div className="aspect-video rounded-xl overflow-hidden border border-slate-200">
                  <iframe src={video} title={`Film: ${selectedInnovation.title}`} className="w-full h-full" allowFullScreen loading="lazy" />
                </div>
              </div>
            )}
            {((selectedInnovation.video_url && !video) || selectedInnovation.handbook_url) && (
              <ul className="mb-6 space-y-1">
                {selectedInnovation.video_url && !video && (
                  <li>
                    <a href={selectedInnovation.video_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-700 underline">
                      Obejrzyj film o innowacji<span className="sr-only"> (otwiera się w nowej karcie)</span>
                    </a>
                  </li>
                )}
                {selectedInnovation.handbook_url && (
                  <li>
                    <a href={selectedInnovation.handbook_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-700 underline">
                      Pobierz podręcznik wdrożenia<span className="sr-only"> (otwiera się w nowej karcie)</span>
                    </a>
                  </li>
                )}
              </ul>
            )}

            {/* Tester z karty: ocena 1–5 i propozycja usprawnienia */}
            <div className="mb-6">
              <InnovationRating
                innovationId={selectedInnovation.id}
                innovationTitle={selectedInnovation.title}
                onRated={(summary) => setRatings((r) => ({ ...r, [summary.innovation_id]: summary }))}
              />
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Karta z katalogu demonstracyjnego prototypu ({selectedInnovation.id}). Opisy problemu i efektu są przykładowe, bez
              danych liczbowych z ewaluacji.
            </p>

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
                <Sparkles className="w-4 h-4" aria-hidden="true" /> Zapisz się na testy
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
