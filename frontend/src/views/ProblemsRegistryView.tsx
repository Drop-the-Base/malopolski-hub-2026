import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { ProblemReportItem, MunicipalReportSummary, InnovationItem } from '../types';
import {
  AlertCircle,
  FilePlus2,
  Building2,
  Printer,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  Zap,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';
import { apiErrorMessage } from '../services/api';
import { CATEGORIES, POWIATY, categoryLabel, powiatLabel } from '../constants/domain';

export const ProblemsRegistryView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPowiat = searchParams.get('powiat') || '';
  const { etrMode } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'registry' | 'create' | 'report'>('registry');

  // Filtry rejestru
  const [problems, setProblems] = useState<ProblemReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPowiat, setSelectedPowiat] = useState(initialPowiat);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Formularz urzędnika
  const [form, setForm] = useState({
    title: '',
    raw_text: '',
    category: '',
    powiat: initialPowiat || 'miechowski',
    gmina: '',
    reporter_type: 'urzednik_jst',
    reporter_name: '',
    reporter_role: '',
    urgency: 'wysoki',
    affected_count: 50
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [listError, setListError] = useState('');
  const [assignError, setAssignError] = useState('');

  // Raport diagnostyczny
  const [reportPowiat, setReportPowiat] = useState('miechowski');
  const [summaryData, setSummaryData] = useState<MunicipalReportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Modal przypisania innowacji
  const [assigningProblemId, setAssigningProblemId] = useState<string | null>(null);
  const [availableInnovations, setAvailableInnovations] = useState<InnovationItem[]>([]);
  const [selectedInnovationId, setSelectedInnovationId] = useState('rops-inn-001');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Szybkie presety dla urzędnika / Jury
  const officerPresets = [
    {
      label: '👵 Brak opieki wytchnieniowej (Limanowa)',
      title: 'Krytyczny brak opieki wytchnieniowej dla 45 rodzin opiekujących się seniorami z demencją',
      raw_text: 'W gminie Limanowa ponad 40 rodzin sprawuje całodobową opiekę nad osobami starszymi ze znacznym otępieniem. Opiekunowie faktyczni zgłaszają skrajne wyczerpanie fizyczne i psychiczne. Gmina nie posiada dziennego domu pobytu ani wolnych kadr asystenckich.',
      category: 'uslugi_opiekuncze',
      powiat: 'limanowski',
      gmina: 'm. Limanowa',
      urgency: 'krytyczny',
      affected_count: 45
    },
    {
      label: '🚌 Wykluczenie komunikacyjne sołectw (Gorlice)',
      title: 'Całkowite odcięcie komunikacyjne 3 sołectw w okresie zimowym i utrudniony dojazd do ośrodka zdrowia',
      raw_text: 'Mieszkańcy sołectw Bodaki i Ropica Górna w gminie Sękowa nie mają dostępu do regularnej komunikacji autobusowej. Osoby starsze i niesamodzielne mają problem z realizacją recept i wizytami u lekarza specjalisty w Gorlicach.',
      category: 'seniorzy',
      powiat: 'gorlicki',
      gmina: 'Gmina Sękowa',
      urgency: 'wysoki',
      affected_count: 90
    },
    {
      label: '💻 Bariera cyfrowa w e-usługach (Słaboszów)',
      title: 'Brak umiejętności cyfrowych u 140 seniorów uniemożliwia korzystanie z e-recept i e-urzędu',
      raw_text: 'Likwidacja stacjonarnego punktu kasowego w gminie Słaboszów spowodowała wykluczenie ponad stu osób starszych, które nie potrafią opłacić rachunków przez bankowość internetową ani pobrać kodu e-recepty.',
      category: 'wykluczenie_cyfrowe',
      powiat: 'miechowski',
      gmina: 'Gmina Słaboszów',
      urgency: 'standardowy',
      affected_count: 140
    }
  ];

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const data = await api.getProblems({
        powiat: selectedPowiat || undefined,
        category: selectedCategory || undefined,
        urgency: selectedUrgency || undefined,
        status: selectedStatus || undefined
      });
      setProblems(data);
      setListError('');
    } catch (err) {
      setListError(apiErrorMessage(err, 'Nie udało się wczytać rejestru wyzwań.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (p: string) => {
    setSummaryLoading(true);
    try {
      const s = await api.getMunicipalSummary(p);
      setSummaryData(s);
    } catch (err) {
      setSummaryData(null);
      setListError(apiErrorMessage(err, 'Nie udało się przygotować raportu.'));
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
    api.getInnovations().then(setAvailableInnovations).catch(console.error);
  }, [selectedPowiat, selectedCategory, selectedUrgency, selectedStatus]);

  useEffect(() => {
    if (activeTab === 'report') {
      fetchSummary(reportPowiat);
    }
  }, [activeTab, reportPowiat]);

  const handleApplyPreset = (pr: typeof officerPresets[0]) => {
    setForm({
      ...form,
      title: pr.title,
      raw_text: pr.raw_text,
      category: pr.category,
      powiat: pr.powiat,
      gmina: pr.gmina,
      urgency: pr.urgency,
      affected_count: pr.affected_count
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.createProblem({ ...form, category: form.category || undefined });
      setSubmitSuccess(true);
      fetchProblems();
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'Nie udało się zarejestrować wyzwania. Sprawdź pola formularza i spróbuj ponownie.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignInnovation = async () => {
    if (!assigningProblemId) return;
    setAssignLoading(true);
    setAssignError('');
    try {
      await api.assignInnovationToProblem(assigningProblemId, selectedInnovationId, assignNotes);
      setAssigningProblemId(null);
      setAssignNotes('');
      fetchProblems();
    } catch (err) {
      setAssignError(apiErrorMessage(err, 'Nie udało się przypisać innowacji.'));
    } finally {
      setAssignLoading(false);
    }
  };

  // Statystyki paska szybkiego podglądu
  const totalCount = problems.length;
  const criticalCount = problems.filter((p) => p.urgency === 'krytyczny').length;
  const totalAffected = problems.reduce((acc, curr) => acc + (curr.affected_count || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Nagłówek Modułu */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <AlertCircle className="w-3.5 h-3.5 text-blue-700" />
          <span>Moduł VIII: Rejestr Problemów Społecznych & Panel Urzędnika JST</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Zgłaszanie i Rejestr Problemów w Gminach' : 'Rejestr Wyzwań Społecznych i Panel Urzędnika Samorządowego'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Narzędzie dla włodarzy miast i gmin, dyrektorów CUS/OPS oraz pracowników socjalnych Małopolski.
          Pozwala rejestrować zdiagnozowane trudności lokalne, badać ich skalę (liczba dotkniętych mieszkańców),
          przypisywać gotowe innowacje ROPS Kraków oraz generować raporty diagnostyczne.
        </p>

        {/* Zakładki */}
        <div className="flex border-b border-slate-200 mt-6 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('registry')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'registry'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Rejestr Wyzwań ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'create'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FilePlus2 className="w-4 h-4" />
            Zgłoś Wyzwanie z Gminy (Formularz JST)
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'report'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            Raport Diagnostyczny JST (Do Druku / PDF)
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ZAKŁADKA 1: REJESTR PROBLEMÓW SPOŁECZNYCH                      */}
      {/* ============================================================== */}
      {activeTab === 'registry' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Pasek Wskaźników Zbiorczych */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                📋
              </div>
              <div>
                <span className="text-xl font-black text-slate-900">{totalCount}</span>
                <span className="block text-xs text-slate-500 font-medium">Zarejestrowane wyzwania</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                🚨
              </div>
              <div>
                <span className="text-xl font-black text-rose-700">{criticalCount}</span>
                <span className="block text-xs text-slate-500 font-medium">Wyzwania o statusie krytycznym</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                👥
              </div>
              <div>
                <span className="text-xl font-black text-indigo-900">{totalAffected.toLocaleString('pl-PL')}</span>
                <span className="block text-xs text-slate-500 font-medium">Mieszkańców objętych problemem</span>
              </div>
            </div>
          </div>

          {listError && <p role="alert" className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-sm">{listError}</p>}

          {/* Filtry */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filtruj zgłoszenia w rejestrze:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                aria-label="Filtr: powiat"
                value={selectedPowiat}
                onChange={(e) => setSelectedPowiat(e.target.value)}
                className="text-sm p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none"
              >
                <option value="">Wszystkie powiaty</option>
                {POWIATY.map((p) => <option key={p} value={p}>{powiatLabel(p)}</option>)}
              </select>

              <select
                aria-label="Filtr: kategoria"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none"
              >
                <option value="">Wszystkie kategorie</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>

              <select
                aria-label="Filtr: pilność"
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none"
              >
                <option value="">Każda pilność</option>
                <option value="krytyczny">🔴 Krytyczny</option>
                <option value="wysoki">🟠 Wysoki</option>
                <option value="standardowy">🔵 Standardowy</option>
              </select>

              <select
                aria-label="Filtr: status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none"
              >
                <option value="">Każdy status</option>
                <option value="nowy">Nowy</option>
                <option value="w_analizie">W analizie</option>
                <option value="przypisana_innowacja">Przypisana innowacja</option>
                <option value="wdrazany">Wdrażany</option>
                <option value="rozwiazany">Rozwiązany</option>
              </select>
            </div>
          </div>

          {/* Lista Zgłoszeń */}
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <span>Ładowanie rejestru wyzwań społecznych...</span>
            </div>
          ) : problems.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Brak zgłoszeń spełniających wybrane kryteria.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPowiat('');
                  setSelectedCategory('');
                  setSelectedUrgency('');
                  setSelectedStatus('');
                }}
                className="mt-3 text-xs text-blue-700 font-bold hover:underline"
              >
                Zresetuj filtry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {problems.map((p) => {
                const isCritical = p.urgency === 'krytyczny';
                const isHigh = p.urgency === 'wysoki';
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isHigh
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            Pilność: {p.urgency}
                          </span>

                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {p.gmina || p.powiat || 'Małopolska'}
                          </span>

                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                            Status: {p.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">{p.title || p.raw_text.slice(0, 60)}</h3>
                      </div>

                      {p.affected_count > 0 && (
                        <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-right shrink-0">
                          <span className="text-sm font-black text-slate-900">~{p.affected_count}</span>
                          <span className="block text-[10px] text-slate-500 font-medium">osób dotkniętych</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{p.raw_text}</p>

                    {/* Metryka zgłaszającego */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <div>
                        Zgłaszający: <strong>{p.reporter_name || 'Urzędnik JST'}</strong> ({p.reporter_role || p.reporter_type})
                      </div>

                      {/* Przypisana innowacja lub akcja przypisania */}
                      <div className="flex items-center gap-2">
                        {p.assigned_innovation_id ? (
                          <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Innowacja: <strong>{p.assigned_innovation_id}</strong></span>
                            <Link
                              to={`/middleman?inn=${p.assigned_innovation_id}&powiat=${p.powiat || 'miechowski'}`}
                              className="text-emerald-700 underline font-bold ml-1 hover:text-emerald-900"
                            >
                              Blueprint →
                            </Link>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAssigningProblemId(p.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Przypisz Innowację ROPS</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Przypisania Innowacji */}
          {assigningProblemId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    Przypisz Innowację Społeczną ROPS
                  </h3>
                  <button
                    onClick={() => setAssigningProblemId(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Wybierz sprawdzoną innowację z portfolio ROPS Kraków, która ma posłużyć jako gotowe rozwiązanie dla tego problemu.
                </p>

                <div>
                  <label htmlFor="pr-field-1" className="block text-xs font-bold text-slate-700 mb-1">
                    Wybierz innowację z katalogu:
                  </label>
                  <select
 id="pr-field-1"
                    value={selectedInnovationId}
                    onChange={(e) => setSelectedInnovationId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none"
                  >
                    {availableInnovations.map((inn) => (
                      <option key={inn.id} value={inn.id}>
                        {inn.title} ({categoryLabel(inn.category)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="pr-field-2" className="block text-xs font-bold text-slate-700 mb-1">
                    Notatka urzędowa / uzasadnienie wyboru:
                  </label>
                  <textarea
 id="pr-field-2"
                    rows={3}
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="np. Wdrożenie pilotażowe we współpracy z CUS i OSP w I kwartale 2026..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 resize-y"
                  />
                </div>

                {assignError && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-200 p-2 rounded-lg">{assignError}</p>}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssigningProblemId(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignInnovation}
                    disabled={assignLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
                  >
                    {assignLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Zatwierdź Przypisanie</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ZAKŁADKA 2: FORMULARZ ZGŁOSZENIA DLA URZĘDNIKA / CUS          */}
      {/* ============================================================== */}
      {activeTab === 'create' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Szybkie Scenariusze dla Jury */}
          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
              <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Szybkie scenariusze problemów samorządowych dla Jury (1 kliknięcie uzupełnia formularz):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {officerPresets.map((pr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(pr)}
                  className="text-xs bg-white hover:bg-blue-50 hover:border-blue-400 text-slate-800 font-semibold px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm transition-all text-left"
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            {submitSuccess ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Wyzwanie samorządowe zostało pomyślnie zarejestrowane!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Zgłoszenie trafiło do Rejestru Wyzwań. System dobrał pasujące innowacje z katalogu (jeśli istnieją),
                  a zgłoszenia krytyczne trafiają od razu do powiadomień koordynatora ROPS.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setActiveTab('registry');
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs"
                  >
                    Zobacz w Rejestrze
                  </button>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    Zgłoś kolejne wyzwanie
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-5">
                <div>
                  <label htmlFor="pr-field-3" className="block text-xs font-bold text-slate-900 mb-1">
                    1. Tytuł zdiagnozowanego wyzwania w gminie:
                  </label>
                  <input
 id="pr-field-3"
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="np. Brak opieki wytchnieniowej dla 40 opiekunów osób niesamodzielnych"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label htmlFor="pr-field-4" className="block text-xs font-bold text-slate-900 mb-1">
                    2. Szczegółowy opis sytuacji, braków w usługach i barier:
                  </label>
                  <textarea
 id="pr-field-4"
                    rows={4}
                    required
                    value={form.raw_text}
                    onChange={(e) => setForm({ ...form, raw_text: e.target.value })}
                    placeholder="Opisz specyfikę sołectwa/gminy, dotychczasowe próby rozwiązania, zdiagnozowane braki kadrowe lub lokalowe..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 resize-y"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Dane osobowe w opisie (PESEL, telefony, e-maile, adresy, imiona i nazwiska) są automatycznie maskowane przed zapisem. Nie podawaj danych mieszkańców.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="pr-field-5" className="block text-xs font-bold text-slate-700 mb-1">Powiat:</label>
                    <select
 id="pr-field-5"
                      required
                      value={form.powiat}
                      onChange={(e) => setForm({ ...form, powiat: e.target.value })}
                      className="w-full text-sm p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                    >
                      {POWIATY.map((p) => <option key={p} value={p}>{powiatLabel(p)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pr-field-6" className="block text-xs font-bold text-slate-700 mb-1">Gmina / Miejscowość:</label>
                    <input
 id="pr-field-6"
                      type="text"
                      required
                      value={form.gmina}
                      onChange={(e) => setForm({ ...form, gmina: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="pr-field-7" className="block text-xs font-bold text-slate-700 mb-1">Kategoria problemu:</label>
                    <select
 id="pr-field-7"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                    >
                      <option value="">Nie wiem – dobierze system</option>
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pr-field-8" className="block text-xs font-bold text-slate-700 mb-1">Poziom pilności:</label>
                    <select
 id="pr-field-8"
                      value={form.urgency}
                      onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                    >
                      <option value="krytyczny">🔴 Krytyczny (wymaga natychmiastowej interwencji)</option>
                      <option value="wysoki">🟠 Wysoki (zagrożenie eskalacją problemu)</option>
                      <option value="standardowy">🔵 Standardowy (wyzwanie średniookresowe)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pr-field-9" className="block text-xs font-bold text-slate-700 mb-1">
                      Szacunkowa liczba mieszkańców dotkniętych problemem:
                    </label>
                    <input
 id="pr-field-9"
                      type="number"
                      min="1"
                      value={form.affected_count}
                      onChange={(e) => setForm({ ...form, affected_count: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label htmlFor="pr-field-10" className="block text-xs font-bold text-slate-700 mb-1">
                      Imię i nazwisko zgłaszającego:
                    </label>
                    <input
 id="pr-field-10"
                      type="text"
                      required
                      value={form.reporter_name}
                      onChange={(e) => setForm({ ...form, reporter_name: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="pr-field-11" className="block text-xs font-bold text-slate-700 mb-1">
                      Stanowisko / Rola w JST lub OPS:
                    </label>
                    <input
 id="pr-field-11"
                      type="text"
                      required
                      value={form.reporter_role}
                      onChange={(e) => setForm({ ...form, reporter_role: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                    />
                  </div>
                </div>

                {submitError && (
                  <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-200 p-3 rounded-lg">{submitError}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Rejestrowanie wyzwania i kojarzenie innowacji...</span>
                    </>
                  ) : (
                    <>
                      <FilePlus2 className="w-4 h-4" />
                      <span>Zarejestruj wyzwanie w rejestrze</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ZAKŁADKA 3: RAPORT DIAGNOSTYCZNY DLA WŁODARZY JST (DRUK/PDF)   */}
      {/* ============================================================== */}
      {activeTab === 'report' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Kontrolki wyboru powiatu i druku */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Generator Raportu Diagnostycznego dla Samorządu</h3>
                <p className="text-xs text-slate-300">Wybierz powiat, aby skompilować diagnozę potrzeb i rekomendacje ROPS.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                aria-label="Powiat raportu"
                value={reportPowiat}
                onChange={(e) => setReportPowiat(e.target.value)}
                className="bg-slate-800 text-white text-sm p-2 rounded-xl border border-slate-700 focus:outline-none"
              >
                {POWIATY.map((p) => <option key={p} value={p}>{powiatLabel(p)}</option>)}
              </select>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Drukuj / Zapisz PDF</span>
              </button>
            </div>
          </div>

          {/* Arkusz Raportu Diagnostycznego (A4 print layout) */}
          {summaryLoading ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <span>Generowanie diagnozy regionalnej...</span>
            </div>
          ) : summaryData ? (
            <div className="bg-white rounded-2xl border border-slate-300 shadow-xl p-8 sm:p-12 space-y-8 print:p-0 print:border-none print:shadow-none print:rounded-none max-w-4xl mx-auto">
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-black text-slate-500 block">
                    Regionalny Ośrodek Polityki Społecznej w Krakowie
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                    RAPORT DIAGNOSTYCZNY WYZWAŃ SPOŁECZNYCH
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Obszar analityczny: Powiat {summaryData.powiat} (Województwo Małopolskie)
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Data generacji: <strong>{new Date().toLocaleDateString('pl-PL')}</strong></div>
                  <div>Źródło: Rejestr Problemów Społecznych ROPS</div>
                </div>
              </div>

              {/* Wskaźniki Główne */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-2xl font-black text-slate-900">{summaryData.total_challenges}</span>
                  <span className="block text-[11px] text-slate-600 font-medium mt-1">Zdiagnozowane wyzwania</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-2xl font-black text-rose-700">{summaryData.critical_challenges}</span>
                  <span className="block text-[11px] text-slate-700 font-medium mt-1">Sprawy krytyczne</span>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="text-2xl font-black text-indigo-900">{summaryData.total_affected_residents}</span>
                  <span className="block text-[11px] text-indigo-800 font-medium mt-1">Dotknięci mieszkańcy</span>
                </div>
              </div>

              {/* Rekomendowane Innowacje do Natychmiastowej Adaptacji */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 bg-slate-100 p-2 rounded">
                  Rekomendowane Gotowe Innowacje ROPS Kraków dla Powiatu {summaryData.powiat}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {summaryData.recommended_innovations.map((inn) => (
                    <div key={inn.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                        {categoryLabel(inn.category)}
                      </span>
                      <h4 className="font-bold text-slate-900">{inn.title}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{inn.tagline}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rekomendacje dla Wójta / Rady Powiatu */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed space-y-2">
                <strong className="block text-slate-950 font-bold">Wnioski i Rekomendowane Działania Samorządu:</strong>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>Zgłoszenie wyselekcjonowanych wyzwań do naboru pilotażowego ROPS Kraków w celu pozyskania mikrograntu do 50 000 zł.</li>
                  <li>Wykorzystanie modułu Middleman JST do wygenerowania Service Blueprint oraz projektu Uchwały Rady Gminy.</li>
                  <li>Włączenie do realizacji lokalnych partnerów (OSP, Koła Gospodyń Wiejskich, wolontariat młodzieżowy).</li>
                </ol>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
