import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccessibility } from '../store/useAccessibilityStore';

export const HomeView: React.FC = () => {
  const { etrMode } = useAccessibility();
  const navigate = useNavigate();
  const [quickInput, setQuickInput] = useState('');

  const goToMatch = (text: string) => navigate(`/matchmaking?q=${encodeURIComponent(text)}`);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      goToMatch(quickInput);
    }
  };

  // Enter wysyła fiszkę, Shift+Enter dodaje nową linię
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (quickInput.trim()) goToMatch(quickInput);
    }
  };

  const sampleQueries = [
    { label: 'samotni seniorzy bez dojazdu', q: 'Samotni seniorzy w małych wsiach bez dojazdu' },
    { label: 'lęk i depresja u młodzieży', q: 'Stany lękowe i depresja u młodzieży w szkole' },
    { label: 'łazienka dla osoby po udarze', q: 'Bariery łazienkowe dla osób leżących po udarze' },
    { label: 'e-recepta dla osób 75+', q: 'Wykluczenie cyfrowe osób 75+ przy e-recepcie' }
  ];

  const paths = [
    {
      to: '/matchmaking',
      who: etrMode ? 'Mieszkańcy' : 'Mieszkańcy i organizacje',
      what: etrMode
        ? 'Napisz, co jest trudne. Pokażemy, co już komuś pomogło.'
        : 'Opisz problem w swojej społeczności i znajdź rozwiązania, które już działają w regionie.',
      cta: 'Znajdź rozwiązanie'
    },
    {
      to: '/middleman',
      who: etrMode ? 'Gminy' : 'Gminy i powiaty',
      what: etrMode
        ? 'Dostaniesz plan, koszty i projekt uchwały dla gminy.'
        : 'Przygotuj plan wdrożenia, kosztorys i projekt uchwały dla wybranej innowacji.',
      cta: 'Zaplanuj wdrożenie'
    },
    {
      to: '/kreator-pomyslow',
      who: etrMode ? 'Masz pomysł' : 'Autorzy pomysłów',
      what: etrMode
        ? 'Opisz swój pomysł krok po kroku. Pomożemy go rozwinąć.'
        : 'Opisz pomysł na 9 polach Canwy innowacji i przygotuj szkic wniosku do otwartego naboru.',
      cta: 'Opisz pomysł'
    },
    {
      to: '/admin',
      who: 'Pracownicy ROPS',
      what: etrMode
        ? 'Sprawdzaj zgłoszenia i zobacz, czego brakuje w powiatach.'
        : 'Przeglądaj zgłoszenia, przydzielaj mentorów i obserwuj potrzeby w 22 powiatach.',
      cta: 'Otwórz panel'
    }
  ];

  return (
    <div className="space-y-20 sm:space-y-24">
      {/* Hero: fiszka, w której mieszkaniec opisuje problem */}
      <section aria-labelledby="hero-title" className="pt-4 sm:pt-10">
        <h1
          id="hero-title"
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.05] tracking-[-0.02em] max-w-[18ch]"
        >
          {etrMode ? 'Napisz, co jest trudne. Pomożemy znaleźć rozwiązanie.' : 'Opisz, co dzieje się w Twojej okolicy.'}
        </h1>
        {!etrMode && (
          <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-[46ch] leading-relaxed">
            Podpowiemy sprawdzone rozwiązanie z katalogu innowacji społecznych Małopolski i pokażemy, kto może pomóc
            je wdrożyć.
          </p>
        )}

        <form onSubmit={handleQuickSearch} className="fiszka mt-10 max-w-4xl">
          <div className="flex items-baseline justify-between gap-4 px-5 sm:px-8 pt-4 pb-2 border-b border-blue-200">
            <label htmlFor="hero-problem" className="font-bold text-slate-900">
              {etrMode ? 'Twoja sprawa' : 'Fiszka zgłoszenia'}
            </label>
            <span className="text-sm text-slate-500 hidden sm:inline">Pisz własnymi słowami</span>
          </div>
          <textarea
            id="hero-problem"
            rows={3}
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Na przykład: w naszej wsi starsze osoby nie mają jak dojechać do apteki…"
            className="fiszka-lines block w-full resize-none bg-transparent border-0 px-5 sm:px-8 pt-1 pb-0 text-[1.3125rem] text-slate-900 placeholder:text-slate-500 focus:ring-0"
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-8 py-4">
            <span className="text-sm text-slate-500">Dane osobowe zostaną ukryte przed analizą.</span>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-lg text-base transition-colors"
            >
              {etrMode ? 'Szukaj pomocy' : 'Dopasuj rozwiązanie'}
            </button>
          </div>
        </form>

        <p className="mt-5 text-base text-slate-600 max-w-4xl leading-relaxed">
          <span className="mr-1">Na przykład:</span>
          {sampleQueries.map((s, idx) => (
            <React.Fragment key={s.q}>
              <button
                type="button"
                onClick={() => goToMatch(s.q)}
                className="text-blue-700 underline decoration-blue-300 underline-offset-4 hover:decoration-blue-700 rounded"
              >
                {s.label}
              </button>
              {idx < sampleQueries.length - 1 ? ', ' : '.'}
            </React.Fragment>
          ))}
        </p>
      </section>

      {/* Ścieżki według roli */}
      <section aria-labelledby="paths-title" className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
        <div>
          <h2 id="paths-title" className="text-2xl font-bold text-slate-900">
            Kim jesteś?
          </h2>
          <p className="mt-2 text-slate-600 leading-relaxed max-w-[34ch]">
            Hub łączy mieszkańców, organizacje, samorządy i ROPS. Każdy zaczyna w innym miejscu.
          </p>
        </div>
        <ul className="lg:col-span-2 border-t border-slate-300">
          {paths.map((p) => (
            <li key={p.to} className="row-full border-b border-slate-300">
              <Link
                to={p.to}
                className="group grid grid-cols-1 sm:grid-cols-[13rem_1fr_auto] gap-x-6 gap-y-1 py-5 px-1 sm:items-baseline hover:bg-white transition-colors"
              >
                <span className="text-lg font-bold text-slate-900">{p.who}</span>
                <span className="text-slate-600 leading-relaxed">{p.what}</span>
                <span className="font-bold text-blue-700 underline decoration-transparent underline-offset-4 group-hover:decoration-blue-700 whitespace-nowrap">
                  {p.cta}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Zaproszenie dla urzędników */}
      <section
        aria-labelledby="officers-title"
        className="bg-white border-l-4 border-blue-600 px-6 sm:px-10 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="max-w-2xl">
          <h2 id="officers-title" className="text-xl sm:text-2xl font-bold text-slate-900">
            Pracujesz w gminie, CUS lub GOPS?
          </h2>
          <p className="mt-2 text-slate-600 leading-relaxed">
            Zapisz wyzwania, z którymi mierzy się Twoja gmina. Zobaczysz, ilu mieszkańców dotyczą, przypiszesz gotowe
            innowacje z katalogu i przygotujesz raport diagnostyczny dla rady gminy.
          </p>
        </div>
        <Link
          to="/problemy"
          className="shrink-0 text-center border-2 border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white font-bold px-6 py-3 rounded-lg transition-colors"
        >
          Otwórz rejestr wyzwań
        </Link>
      </section>

      {/* Fakty o prototypie */}
      <section aria-labelledby="facts-title">
        <h2 id="facts-title" className="text-2xl font-bold text-slate-900 mb-6">
          O prototypie
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 max-w-5xl">
          <div className="flex gap-4 items-baseline">
            <dt className="text-3xl font-extrabold text-slate-900 tabular-nums w-28 shrink-0">10</dt>
            <dd className="text-slate-600 leading-relaxed">
              innowacji w wersji demonstracyjnej. Docelowo cała biblioteka ROPS, niemal 200 przetestowanych rozwiązań.
            </dd>
          </div>
          <div className="flex gap-4 items-baseline">
            <dt className="text-3xl font-extrabold text-slate-900 tabular-nums w-28 shrink-0">22</dt>
            <dd className="text-slate-600 leading-relaxed">
              powiaty Małopolski z danymi o wyzwaniach demograficznych i społecznych.
            </dd>
          </div>
          <div className="flex gap-4 items-baseline">
            <dt className="text-3xl font-extrabold text-slate-900 w-28 shrink-0">AA</dt>
            <dd className="text-slate-600 leading-relaxed">
              poziom WCAG 2.1, do którego projektujemy. Szczegóły w{' '}
              <Link to="/deklaracja-dostepnosci" className="text-blue-700 underline underline-offset-4">
                deklaracji dostępności
              </Link>
              .
            </dd>
          </div>
          <div className="flex gap-4 items-baseline">
            <dt className="text-3xl font-extrabold text-slate-900 tabular-nums w-28 shrink-0">200 zł</dt>
            <dd className="text-slate-600 leading-relaxed">
              miesięcznie, szacunkowy koszt infrastruktury i modeli językowych.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};
