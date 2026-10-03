import React from 'react';
import { X, Calendar, Server, ShieldCheck, Cpu, ArrowUpRight, CheckCircle2, TrendingUp } from 'lucide-react';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-title"
      >
        {/* Przycisk zamknięcia */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
            Projekt został zaprojektowany z myślą o natychmiastowym wdrożeniu w ROPS Kraków oraz bezkosztowej integracji z krajową infrastrukturą cyfrową.
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
              Start pilotażu w partnerstwie z CUS Miechów, CUS Gorlice, Nowy Sącz i Limanowa. Przeszkolenie 50 koordynatorów gminnych i podłączenie pierwszych 100 innowacji społecznych do katalogu.
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
            <span>Kalkulacja TCO (Total Cost of Ownership) dla Województwa</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-800/80 p-3 rounded-xl">
              <span className="text-slate-400 block mb-1">Miesięczny koszt chmury:</span>
              <strong className="text-base text-emerald-400 font-black">&lt; 180 PLN / m-c</strong>
              <p className="text-[11px] text-slate-400 mt-1">Lokalna instalacja Docker / VPS w chmurze krajowej.</p>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl">
              <span className="text-slate-400 block mb-1">Licencje komercyjne:</span>
              <strong className="text-base text-amber-400 font-black">0 PLN (100% Open Source)</strong>
              <p className="text-[11px] text-slate-400 mt-1">Brak vendor lock-in. FastAPI, SQLite, React, Nginx.</p>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl">
              <span className="text-slate-400 block mb-1">Dostępność cyfrowa:</span>
              <strong className="text-base text-blue-400 font-black">100% WCAG 2.1 AA</strong>
              <p className="text-[11px] text-slate-400 mt-1">Zgodność z ustawą o dostępności cyfrowej z 2019 r.</p>
            </div>
          </div>
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
