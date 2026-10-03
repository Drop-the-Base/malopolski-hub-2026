import React from 'react';
import { X, Server, TrendingUp } from 'lucide-react';
import { useDialog } from '../../hooks/useDialog';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-title"
      >
        {/* Przycisk zamknięcia */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Zamknij okno planu rozwoju"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Nagłówek */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Kryterium Oceny Jury: Wdrożenie, Koszt (TCO) i Perspektywa Rozwoju (20%)</span>
          </div>
          <h2 id="roadmap-title" className="text-2xl sm:text-3xl font-black text-slate-900">
            Roadmapa Wdrożeniowa MHIS: 2026 – 2027
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Propozycja etapów wdrożenia prototypu w ROPS Kraków. Terminy i partnerzy pilotażu są przykładowe – do ustalenia z zamawiającym.
          </p>
        </div>

        {/* 4 Kwartały Roadmapy */}
        <div className="space-y-4 mb-8">
          <div className="border-l-4 border-amber-500 pl-4 py-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">Q4 2026</span>
              <h4 className="text-sm font-bold text-slate-900">Pilotaż w 10 Małopolskich Gminach & Inkubacja ROPS</h4>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Pilotaż w kilku gminach (np. z subregionów gorlickiego, miechowskiego i limanowskiego), przeszkolenie koordynatorów gminnych, import pełnej Biblioteki Innowacji ROPS do katalogu, migracja na PostgreSQL + Alembic.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2 py-0.5 rounded">Q1 2027</span>
              <h4 className="text-sm font-bold text-slate-900">Węzeł Krajowy Login.gov.pl & mObywatel</h4>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Wdrożenie uwierzytelniania profilem zaufanym i e-dowodem (Krajowy Węzeł Tożsamości) oraz integracja powiadomień o naborach grantowych z aplikacją mObywatel (moduł Usługi Lokalne).
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4 py-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-900 text-xs font-bold px-2 py-0.5 rounded">Q2 2027</span>
              <h4 className="text-sm font-bold text-slate-900">Integracja e-Doręczenia, CEIDG & Rejestru PES (Ekonomia Społeczna)</h4>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Automatyczna weryfikacja podmiotów w Rejestrze Jednostek Pomocy Społecznej (RJPS) oraz integracja z systemem e-Doręczeń dla oficjalnej korespondencji administracyjnej z JST.
            </p>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4 py-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded">Q3-Q4 2027</span>
              <h4 className="text-sm font-bold text-slate-900">Skalowanie Międzywojewódzkie (Śląsk, Podkarpacie, Świętokrzyskie)</h4>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Udostępnienie federacyjnej architektury wielooddziałowej (Multi-Tenant) dla innych regionalnych ośrodków polityki społecznej w Polsce z zachowaniem otwartej licencji CC-BY-SA 4.0.
            </p>
          </div>
        </div>

        {/* TCO i Architektura Kosztowa */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>Szacunkowy koszt utrzymania (TCO) – miesięcznie</span>
          </div>
          <table className="w-full text-xs">
            <caption className="sr-only">Składniki miesięcznego kosztu utrzymania platformy</caption>
            <thead>
              <tr className="text-left text-slate-300 border-b border-slate-700">
                <th scope="col" className="py-1.5 pr-2 font-semibold">Składnik</th>
                <th scope="col" className="py-1.5 pr-2 font-semibold">Założenie</th>
                <th scope="col" className="py-1.5 text-right font-semibold">Koszt / m-c</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              <tr className="border-b border-slate-800"><td className="py-1.5 pr-2">Serwer VPS (Docker)</td><td className="pr-2 text-slate-300">4 vCPU, 8 GB RAM, chmura krajowa</td><td className="text-right">ok. 120 zł</td></tr>
              <tr className="border-b border-slate-800"><td className="py-1.5 pr-2">Kopie zapasowe, domena, certyfikat</td><td className="pr-2 text-slate-300">backup dzienny 30 dni</td><td className="text-right">ok. 30 zł</td></tr>
              <tr className="border-b border-slate-800"><td className="py-1.5 pr-2">LLM (Groq, gpt-oss-20b)</td><td className="pr-2 text-slate-300">5 000 zapytań × ~2 000 tokenów</td><td className="text-right">ok. 10–20 zł</td></tr>
              <tr className="border-b border-slate-800"><td className="py-1.5 pr-2">Transkrypcja mowy (Whisper)</td><td className="pr-2 text-slate-300">~500 nagrań × 30 s</td><td className="text-right">&lt; 5 zł</td></tr>
              <tr className="border-b border-slate-800"><td className="py-1.5 pr-2">Licencje</td><td className="pr-2 text-slate-300">FastAPI, React, SQLite/PostgreSQL – open source</td><td className="text-right">0 zł</td></tr>
              <tr><td className="py-1.5 pr-2">Utrzymanie techniczne</td><td className="pr-2 text-slate-300">ok. 0,1 etatu programisty (aktualizacje, bezpieczeństwo)</td><td className="text-right">ok. 1 500 zł</td></tr>
            </tbody>
          </table>
          <p className="text-[11px] text-slate-300">
            Infrastruktura i API: ok. 170–200 zł/m-c; łącznie z utrzymaniem ok. 1,7 tys. zł/m-c. Ceny API wg cenników dostawców – do weryfikacji przy wdrożeniu.
            Bez klucza LLM platforma działa w trybie szablonów (koszt API = 0 zł).
          </p>
        </div>

        {/* Przycisk Zamknij */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
          >
            Zamknij podgląd
          </button>
        </div>
      </div>
    </div>
  );
};
