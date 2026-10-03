import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  Lightbulb,
  Building2,
  Users,
  ShieldCheck,
  ArrowRight,
  HeartHandshake,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';

export const HomeView: React.FC = () => {
  const { etrMode } = useAccessibility();
  const navigate = useNavigate();
  const [quickInput, setQuickInput] = useState('');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      navigate(`/matchmaking?q=${encodeURIComponent(quickInput)}`);
    }
  };

  const sampleQueries = [
    'Samotni seniorzy w małych wsiach bez dojazdu',
    'Stany lękowe i depresja u młodzieży w szkole',
    'Bariery łazienkowe dla osób leżących po udarze',
    'Wykluczenie cyfrowe osób 75+ przy e-recepcie'
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Cyfrowe Serce Małopolskiego Hubu Innowacji Społecznych</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
            {etrMode
              ? 'Łączymy ludzi, którzy potrzebują pomocy, z dobrymi rozwiązaniami.'
              : 'Inteligentne kojarzenie potrzeb z innowacjami społecznymi w Małopolsce.'}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            {etrMode
              ? 'Wpisz swój problem lub trudność. Sztuczna inteligencja od razu podpowie Ci sprawdzony pomysł przetestowany przez ROPS Kraków.'
              : 'Platforma oparta na sztucznej inteligencji eliminująca biurokrację, przyspieszająca wdrażanie sprawdzonych innowacji przez samorządy i budująca partnerstwa między mieszkańcami a ekspertami.'}
          </p>

          {/* Szybka wyszukiwarka RAG */}
          <form onSubmit={handleQuickSearch} className="bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Opisz problem (np. W naszej wsi starsze osoby nie mają jak dojechać do apteki...)"
              className="flex-1 px-4 py-3 text-slate-900 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-slate-400"
              aria-label="Wpisz problem społeczny"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-md"
            >
              <span>{etrMode ? 'Szukaj pomocy' : 'Dopasuj innowację (RAG)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Przykładowe zapytania demonstracyjne */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Sprawdź przykłady:</span>
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuickInput(q)}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors text-[11px]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Kluczowe Bramy Użytkownika */}
      <section>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Dla kogo jest Małopolski Hub?</h2>
          <p className="text-sm text-slate-500">
            Wybierz swoją ścieżkę – od zgłoszenia oddolnej potrzeby po wdrożenie uchwały w gminie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Mieszkaniec / NGO */}
          <Link
            to="/matchmaking"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Mieszkańcy i NGO</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Opisz problem w swojej społeczności, znajdź gotowe innowacje lub stwórz fiszkę nowego pomysłu.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600">
              Przejdź do kojarzenia <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Samorządy JST / CUS */}
          <Link
            to="/middleman"
            className="group bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
          >
            <span className="absolute top-3 right-3 text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">
              Kluczowa
            </span>
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Jednostki Samorządu (JST)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Asystent Middleman AI: wygeneruj Service Blueprint, budżet i projekt uchwały dla swojej gminy.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-700">
              Wdróż innowację w gminie <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Innowatorzy i Canwa */}
          <Link
            to="/kreator-pomyslow"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Innowatorzy i Granty</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Zbuduj 9-elementową Canwę Innowacji ROPS Kraków z asystentem AI i wygeneruj wniosek grantowy.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600">
              Otwórz Canwę <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Koordynatorzy ROPS */}
          <Link
            to="/admin"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-400 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Pracownicy ROPS</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Radar Trendów Powiatowych, moderacja zgłoszeń mieszkańców i monitorowanie białych plam.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-slate-700">
              Panel Analityczny <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Wskaźniki Wpływu Społecznego */}
      <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-black text-blue-600 mb-1">200+</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Innowacji w Portfolio ROPS</div>
          </div>
          <div>
            <div className="text-3xl font-black text-indigo-600 mb-1">22</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Powiaty Małopolski w Bazie</div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-600 mb-1">100%</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Zgodność z WCAG 2.1 AA</div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-500 mb-1">&lt; 100 zł</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Miesięczny Koszt TCO Hostingu</div>
          </div>
        </div>
      </section>
    </div>
  );
};
