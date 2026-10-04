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

  // Start według roli: każda rola ma 2–3 najważniejsze działania prostym językiem
  const roles: { id: string; who: string; whoEtr: string; hint: string; hintEtr: string; actions: { to: string; label: string; labelEtr: string }[] }[] = [
    {
      id: 'mieszkaniec',
      who: 'Mieszkaniec lub organizacja',
      whoEtr: 'Mieszkam tu albo działam w organizacji',
      hint: 'Osoby prywatne, rodziny, stowarzyszenia i fundacje.',
      hintEtr: 'Na przykład senior, rodzic, opiekun albo fundacja.',
      actions: [
        { to: '/matchmaking', label: 'Opisz problem i znajdź pomoc', labelEtr: 'Napisz, co jest trudne' },
        { to: '/kreator-pomyslow', label: 'Zgłoś pomysł na zmianę', labelEtr: 'Mam pomysł' },
        { to: '/status', label: 'Sprawdź, co dzieje się z Twoim zgłoszeniem', labelEtr: 'Sprawdź swoje zgłoszenie' }
      ]
    },
    {
      id: 'samorzad',
      who: 'Samorząd',
      whoEtr: 'Pracuję w gminie lub powiecie',
      hint: 'Urząd gminy lub powiatu, CUS, GOPS, MOPS.',
      hintEtr: 'Urząd, ośrodek pomocy społecznej.',
      actions: [
        { to: '/problemy', label: 'Zapisz wyzwania swojej gminy', labelEtr: 'Zapisz problemy gminy' },
        { to: '/middleman', label: 'Przygotuj plan wdrożenia i kosztorys', labelEtr: 'Zrób plan dla gminy' },
        { to: '/baza-wiedzy?tab=mapa', label: 'Zobacz mapę wyzwań powiatów', labelEtr: 'Zobacz mapę powiatów' }
      ]
    },
    {
      id: 'ekspert',
      who: 'Ekspert lub mentor',
      whoEtr: 'Jestem ekspertem lub mentorem',
      hint: 'Specjaliści, którzy doradzają i testują rozwiązania.',
      hintEtr: 'Pomagam innym swoją wiedzą.',
      actions: [
        { to: '/dialog', label: 'Odpowiadaj na pytania i prowadź konsultacje', labelEtr: 'Odpowiadaj na pytania' },
        { to: '/tester', label: 'Testuj i oceniaj innowacje', labelEtr: 'Testuj pomysły' },
        { to: '/baza-wiedzy', label: 'Przeglądaj bibliotekę innowacji', labelEtr: 'Zobacz sprawdzone pomysły' }
      ]
    },
    {
      id: 'rops',
      who: 'Pracownik ROPS',
      whoEtr: 'Pracuję w ROPS',
      hint: 'Koordynatorzy Regionalnego Ośrodka Polityki Społecznej.',
      hintEtr: 'Regionalny Ośrodek Polityki Społecznej w Krakowie.',
      actions: [
        { to: '/admin', label: 'Przejrzyj nowe zgłoszenia', labelEtr: 'Zobacz nowe zgłoszenia' },
        { to: '/problemy', label: 'Otwórz rejestr wyzwań gmin', labelEtr: 'Zobacz problemy gmin' },
        { to: '/baza-wiedzy?tab=mapa', label: 'Zobacz mapę wyzwań regionu', labelEtr: 'Zobacz mapę powiatów' }
      ]
    }
  ];

  return (
    <div className="space-y-20 sm:space-y-24">
      {/* Hero: fiszka, w której mieszkaniec opisuje problem */}
      <section aria-labelledby="hero-title" className="pt-0 sm:pt-2">
        <h1
          id="hero-title"
          className="text-[2rem] sm:text-[2.75rem] lg:text-5xl font-extrabold text-slate-900 leading-[1.08] tracking-[-0.02em] max-w-[28ch]"
        >
          {etrMode ? 'Napisz, co jest trudne. Pomożemy znaleźć rozwiązanie.' : 'Opisz, co dzieje się w Twojej okolicy.'}
        </h1>
        {!etrMode && (
          <p className="mt-3 text-lg sm:text-xl text-slate-600 max-w-[60ch] leading-relaxed">
            Podpowiemy sprawdzone rozwiązanie z katalogu innowacji społecznych Małopolski i pokażemy, kto może pomóc
            je wdrożyć.
          </p>
        )}

        <form onSubmit={handleQuickSearch} className="fiszka mt-6 sm:mt-8 max-w-4xl">
          <div className="flex items-baseline justify-between gap-4 px-5 sm:px-8 pt-3 pb-2 border-b border-blue-200">
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
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4">
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

        <p className="mt-6 text-lg text-slate-800">
          Nie wiesz, od czego zacząć?{' '}
          <a href="#kim-jestes" className="font-bold text-blue-700 underline underline-offset-4 hover:text-blue-900">
            {etrMode ? 'Zobacz, co możesz zrobić' : 'Wybierz, kim jesteś'}
          </a>
        </p>
      </section>

      {/* Start według roli: kto jestem → 2–3 najważniejsze działania */}
      <section id="kim-jestes" aria-labelledby="roles-title" className="scroll-mt-8">
        <h2 id="roles-title" className="text-2xl sm:text-3xl font-bold text-slate-900">
          Kim jesteś?
        </h2>
        <p className="mt-2 text-lg text-slate-600 max-w-prose leading-relaxed">
          {etrMode
            ? 'Znajdź siebie poniżej. Kliknij to, co chcesz zrobić.'
            : 'Wybierz swoją rolę i kliknij działanie. Każda osoba zaczyna w innym miejscu.'}
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-10">
          {roles.map((r) => (
            <div key={r.id} role="group" aria-labelledby={`role-${r.id}`} className="border-t-4 border-blue-600 pt-4">
              <h3 id={`role-${r.id}`} className="text-xl font-bold text-slate-900 leading-snug">
                {etrMode ? r.whoEtr : r.who}
              </h3>
              <p className="mt-1 text-slate-600 leading-relaxed">{etrMode ? r.hintEtr : r.hint}</p>
              <ul className="mt-4 border-t border-slate-300">
                {r.actions.map((a) => (
                  <li key={a.to + a.label} className="border-b border-slate-300">
                    <Link
                      to={a.to}
                      className="block py-3 px-1 min-h-[2.75rem] text-lg font-bold text-blue-700 underline decoration-blue-300 underline-offset-4 hover:decoration-blue-700 hover:bg-white transition-colors"
                    >
                      {etrMode ? a.labelEtr : a.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Fakty o prototypie */}
      <section aria-labelledby="facts-title">
        <h2 id="facts-title" className="text-2xl font-bold text-slate-900 mb-6">
          O prototypie
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 max-w-5xl">
          <div className="flex flex-wrap gap-x-4 gap-y-1 items-baseline">
            <dt className="text-3xl font-extrabold text-slate-900 tabular-nums w-28 shrink-0">10</dt>
            <dd className="text-slate-600 leading-relaxed flex-1 min-w-[12rem]">
              innowacji w wersji demonstracyjnej. Docelowo cała biblioteka ROPS, niemal 200 przetestowanych rozwiązań.
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 items-baseline">
            <dt className="text-3xl font-extrabold text-slate-900 tabular-nums w-28 shrink-0">22</dt>
            <dd className="text-slate-600 leading-relaxed flex-1 min-w-[12rem]">
              powiaty Małopolski na{' '}
              <Link to="/baza-wiedzy?tab=mapa" className="text-blue-700 underline underline-offset-4">
                Mapie Wyzwań Społecznych
              </Link>{' '}
              (dane demonstracyjne).
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 items-baseline">
            <dt className="text-3xl font-extrabold text-slate-900 w-28 shrink-0">AA</dt>
            <dd className="text-slate-600 leading-relaxed flex-1 min-w-[12rem]">
              poziom WCAG 2.1, do którego projektujemy. Szczegóły w{' '}
              <Link to="/deklaracja-dostepnosci" className="text-blue-700 underline underline-offset-4">
                deklaracji dostępności
              </Link>
              .
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 items-baseline">
            <dt className="text-3xl font-extrabold text-slate-900 tabular-nums w-28 shrink-0">200 zł</dt>
            <dd className="text-slate-600 leading-relaxed flex-1 min-w-[12rem]">
              miesięcznie, szacunkowy koszt infrastruktury i modeli językowych.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};
