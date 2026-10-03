import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { SocialInnovationCanvas } from '../components/canvas/SocialInnovationCanvas';
import {
  Lightbulb,
  FileCheck2,
  Sparkles,
  Send,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';

export const IdeaCreatorView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialProblem = searchParams.get('problem') || '';
  const initialPowiat = searchParams.get('powiat') || 'gorlicki';
  const { etrMode } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'canvas' | 'fiszka' | 'wniosek'>('canvas');

  // Formularz Fiszki
  const [fiszka, setFiszka] = useState({
    title: '',
    summary: initialProblem,
    target_audience: 'Seniorzy i młodzież z gminy wiejskiej',
    implementation_stage: 'pomysl',
    author_name: '',
    author_email: '',
    author_type: 'mieszkaniec',
    powiat: initialPowiat
  });
  const [fiszkaSubmitted, setFiszkaSubmitted] = useState(false);

  // Formularz Wniosku Grantowego
  const [grantIdeaTitle, setGrantIdeaTitle] = useState('Innowacyjna Świetlica Sąsiedzka i Mobilny Wolontariat');
  const [grantBudget, setGrantBudget] = useState(50000);
  const [grantResult, setGrantResult] = useState<any | null>(null);
  const [grantLoading, setGrantLoading] = useState(false);

  const handleFiszkaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitFiszka(fiszka);
      setFiszkaSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Błąd podczas zapisywania fiszki pomysłu.');
    }
  };

  const handleGenerateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrantLoading(true);
    try {
      const res = await api.generateGrantApplication({
        idea_title: grantIdeaTitle,
        summary: fiszka.summary || 'Oddolne rozwiązanie problemu izolacji w małej miejscowości.',
        target_group: fiszka.target_audience,
        requested_budget_pln: grantBudget
      });
      setGrantResult(res);
    } catch (err) {
      console.error(err);
      alert('Nie udało się wygenerować wniosku grantowego.');
    } finally {
      setGrantLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Nagłówek */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
          <span>Moduł III: Kreator Pomysłów i Inkubacja Innowacji</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Tworzenie Twojego Pomysłu' : 'Kreator Pomysłów, Canwa Innowacji i Generator Wniosków'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Narzędzie prowadzące innowatora krok po kroku: od szybkiej fiszki pomysłu (24/7), przez modelowanie w 9-polowej Canwie Innowacji Społecznych z Asystentem AI, aż po generator wniosku na naboru ROPS.
        </p>

        {/* Zakładki */}
        <div className="flex border-b border-slate-200 mt-6 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'canvas' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Canwa Innowacji 3x3 z AI
          </button>
          <button
            onClick={() => setActiveTab('fiszka')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'fiszka' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            Fiszka Pomysłu (24/7)
          </button>
          <button
            onClick={() => setActiveTab('wniosek')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'wniosek' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            Generator Wniosku Grantowego
          </button>
        </div>
      </div>

      {/* Zakładka 1: Canwa Innowacji */}
      {activeTab === 'canvas' && (
        <SocialInnovationCanvas
          initialData={{
            problem: fiszka.summary || undefined
          }}
        />
      )}

      {/* Zakładka 2: Fiszka Pomysłu (24/7) */}
      {activeTab === 'fiszka' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
          {fiszkaSubmitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Dziękujemy! Fiszka została zarejestrowana.</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Twój pomysł trafił do kolejki weryfikacji ROPS Kraków. Koordynator przydzieli mentora, który skontaktuje się z Tobą mailowo.
              </p>
              <button
                onClick={() => setFiszkaSubmitted(false)}
                className="text-xs font-bold text-blue-600 underline"
              >
                Wyślij kolejny pomysł
              </button>
            </div>
          ) : (
            <form onSubmit={handleFiszkaSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Formularz Zgłoszenia Fiszki</h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tytuł pomysłu:</label>
                <input
                  type="text"
                  required
                  value={fiszka.title}
                  onChange={(e) => setFiszka({ ...fiszka, title: e.target.value })}
                  placeholder="np. Sąsiedzki Klub Rozmów i Wymiany Plonów"
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Co jest istotą pomysłu (opis):</label>
                <textarea
                  rows={4}
                  required
                  value={fiszka.summary}
                  onChange={(e) => setFiszka({ ...fiszka, summary: e.target.value })}
                  placeholder="Opisz, na czym polega innowacja i jak pomoże mieszkańcom..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Komu dedykowane (grupa docelowa):</label>
                  <input
                    type="text"
                    required
                    value={fiszka.target_audience}
                    onChange={(e) => setFiszka({ ...fiszka, target_audience: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Powiat w Małopolsce:</label>
                  <input
                    type="text"
                    required
                    value={fiszka.powiat}
                    onChange={(e) => setFiszka({ ...fiszka, powiat: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Twoje imię i nazwisko / nazwa organizacji:</label>
                  <input
                    type="text"
                    required
                    value={fiszka.author_name}
                    onChange={(e) => setFiszka({ ...fiszka, author_name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Adres e-mail do kontaktu:</label>
                  <input
                    type="email"
                    required
                    value={fiszka.author_email}
                    onChange={(e) => setFiszka({ ...fiszka, author_email: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl text-xs shadow-md transition-colors mt-4 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Wyślij Fiszkę do ROPS Kraków (24/7)
              </button>
            </form>
          )}
        </div>
      )}

      {/* Zakładka 3: Generator Wniosku Grantowego */}
      {activeTab === 'wniosek' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Automatyczny Generator Wniosku Grantowego</h3>
            <p className="text-xs text-slate-500 mb-6">
              Dostosowuje opis innowacji do wymogów konkursów grantowych (np. Inkubator Włączenia Społecznego 2.0).
            </p>

            <form onSubmit={handleGenerateGrant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tytuł projektu we wniosku:</label>
                  <input
                    type="text"
                    value={grantIdeaTitle}
                    onChange={(e) => setGrantIdeaTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wnioskowany budżet (PLN):</label>
                  <input
                    type="number"
                    step="5000"
                    value={grantBudget}
                    onChange={(e) => setGrantBudget(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={grantLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {grantLoading ? 'Generowanie wniosku...' : 'Generuj Wniosek Grantowy'}
              </button>
            </form>
          </div>

          {grantResult && (
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div>
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">{grantResult.call_title}</span>
                  <h4 className="text-xl font-black">{grantIdeaTitle}</h4>
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-600"
                >
                  <Download className="w-3.5 h-3.5" /> Drukuj / PDF
                </button>
              </div>

              <div>
                <strong className="text-xs text-slate-400 block mb-1">Syntetyczne Streszczenie:</strong>
                <p className="text-xs text-slate-200 leading-relaxed">{grantResult.executive_summary}</p>
              </div>

              <div>
                <strong className="text-xs text-slate-400 block mb-1">Diagnoza i Metodyka Realizacji:</strong>
                <p className="text-xs text-slate-200 leading-relaxed">{grantResult.detailed_methodology}</p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <strong className="text-xs text-amber-400 block mb-2">Szacunkowy Podział Budżetu:</strong>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(grantResult.budget_breakdown).map(([key, val]: any) => (
                    <div key={key} className="flex justify-between border-b border-slate-700 py-1 text-slate-300">
                      <span>{key}</span>
                      <strong className="text-white">{val.toLocaleString('pl-PL')} zł</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
