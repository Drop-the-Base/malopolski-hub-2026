import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { InnovationItem, RegionalChallenge } from '../types';
import { MalopolskaMap } from '../components/map/MalopolskaMap';
import {
  Compass,
  Search,
  Filter,
  Play,
  FileText,
  Building2,
  BookOpen,
  Download,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';

export const KnowledgeView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');
  const { etrMode } = useAccessibility();

  const [innovations, setInnovations] = useState<InnovationItem[]>([]);
  const [challenges, setChallenges] = useState<RegionalChallenge[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedInnovation, setSelectedInnovation] = useState<InnovationItem | null>(null);
  const [activeTab, setActiveTab] = useState<'katalog' | 'mapa' | 'edukacja'>('katalog');

  useEffect(() => {
    loadData();
  }, [category]);

  const loadData = async () => {
    try {
      const [inns, chs] = await Promise.all([
        api.getInnovations(category || undefined, search || undefined),
        api.getRegionalChallenges()
      ]);
      setInnovations(inns);
      setChallenges(chs);

      if (highlightedId) {
        const found = inns.find((i) => i.id === highlightedId);
        if (found) setSelectedInnovation(found);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const categories = [
    { value: '', label: 'Wszystkie kategorie' },
    { value: 'seniorzy', label: 'Seniorzy' },
    { value: 'dostepnosc', label: 'Dostępność' },
    { value: 'zdrowie_psychiczne', label: 'Zdrowie psychiczne' },
    { value: 'wykluczenie_cyfrowe', label: 'Wykluczenie cyfrowe' },
    { value: 'edukacja', label: 'Edukacja i SI' }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Nagłówek Modułu */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Moduł II: Zasobnik Wiedzy i Dorobek ROPS Kraków</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Katalog Sprawdzonych Pomysłów' : 'Biblioteka Innowacji Społecznych i Diagnoza Regionu'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Zbiór przetestowanych i sprawdzonych innowacji Regionalnego Ośrodka Polityki Społecznej w Krakowie, interaktywna diagnoza 22 powiatów Małopolski oraz baza bezpłatnych materiałów edukacyjnych.
        </p>

        {/* Zakładki */}
        <div className="flex border-b border-slate-200 mt-6 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('katalog')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'katalog' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Biblioteka Innowacji ({innovations.length})
          </button>
          <button
            onClick={() => setActiveTab('mapa')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'mapa' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            Mapa Wyzwań 22 Powiatów
          </button>
          <button
            onClick={() => setActiveTab('edukacja')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'edukacja' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Materiały i Canwy
          </button>
        </div>
      </div>

      {/* Widok 1: Katalog Innowacji */}
      {activeTab === 'katalog' && (
        <div className="space-y-6">
          {/* Pasek Filtrów */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj innowacji (np. łazienka, komiks, senior)..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 text-slate-900"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                Szukaj
              </button>
            </form>

            <div className="w-full sm:w-auto">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full sm:w-auto text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid Innowacji */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {innovations.map((inn) => (
              <div
                key={inn.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase tracking-wider">
                      {inn.category}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {inn.readiness_level}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {inn.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-3">
                    {inn.tagline}
                  </p>

                  <p className="text-xs text-slate-700 leading-relaxed mb-4 line-clamp-3">
                    {etrMode && inn.etr_summary ? inn.etr_summary : inn.full_description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {inn.target_groups.map((tg, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Budżet: {inn.budget_bracket}</span>
                  <button
                    onClick={() => setSelectedInnovation(inn)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Zobacz kartę innowacji
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Widok 2: Interaktywna Mapa Wyzwań */}
      {activeTab === 'mapa' && (
        <MalopolskaMap challenges={challenges} />
      )}

      {/* Widok 3: Materiały Edukacyjne */}
      {activeTab === 'edukacja' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Canwa Innowacji Społecznych – Przewodnik ROPS</h3>
              <p className="text-xs text-slate-500 mb-4">
                Praktyczny podręcznik modelowania innowacji w 9 krokach dla animatorów i organizacji pozarządowych.
              </p>
            </div>
            <a
              href="https://rops.krakow.pl"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 flex items-center gap-1.5 hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Pobierz szablon PDF
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Jak wdrożyć innowację w samorządzie (JST/CUS)?</h3>
              <p className="text-xs text-slate-500 mb-4">
                Procedury transferu prawnego, wzory uchwał rad gmin oraz montaż finansowy z programu FE dla Małopolski.
              </p>
            </div>
            <a
              href="https://rops.krakow.pl"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Pobierz poradnik JST
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Standardy Dostępności Cyfrowej i ETR</h3>
              <p className="text-xs text-slate-500 mb-4">
                Zasady tworzenia materiałów łatwych do czytania (ETR) i spełniania norm WCAG 2.1 AA w pomocy społecznej.
              </p>
            </div>
            <a
              href="https://rops.krakow.pl"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 hover:underline"
            >
              <Download className="w-3.5 h-3.5" /> Pobierz wytyczne ETR
            </a>
          </div>
        </div>
      )}

      {/* Modal Szczegółów Innowacji */}
      {selectedInnovation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Karta Innowacji ROPS Kraków
              </span>
              <button
                onClick={() => setSelectedInnovation(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-1">{selectedInnovation.title}</h3>
            <p className="text-sm font-medium text-slate-500 mb-4">{selectedInnovation.tagline}</p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-xs leading-relaxed text-slate-700">
              <strong className="block text-slate-900 font-bold mb-1">Opis Metodyki:</strong>
              {selectedInnovation.full_description}
            </div>

            {selectedInnovation.etr_summary && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4 text-xs leading-relaxed text-amber-950">
                <strong className="block text-amber-900 font-bold mb-1">Wersja Prosty Język (ETR):</strong>
                {selectedInnovation.etr_summary}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedInnovation(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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
