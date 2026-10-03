import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 text-sm border-t border-slate-800 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <span className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-sm">MH</span>
              Małopolski Hub Innowacji Społecznych
            </div>
            <p className="text-slate-300 text-xs leading-relaxed max-w-md mb-4">
              Prototyp narzędzia wspierającego kojarzenie potrzeb mieszkańców z gotowymi rozwiązaniami, inkubację nowych pomysłów i skalowanie innowacji w gminach Małopolski – koncepcja przygotowana dla Regionalnego Ośrodka Polityki Społecznej w Krakowie.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <Link to="/deklaracja-dostepnosci" className="underline hover:text-white">Deklaracja dostępności</Link>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded">
                <Shield className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                Anonimizacja danych w zgłoszeniach
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Moduły Platformy</h4>
            <ul className="space-y-2 text-xs">
              <li>I. Matchmaking Społeczny RAG</li>
              <li>II. Biblioteka i Mapa Wyzwań</li>
              <li>III. Canwa Innowacji Społecznych</li>
              <li>IV. Tester Innowacji (SUS)</li>
              <li>V. Dialog Międzysektorowy</li>
              <li>VI. Radar Trendów ROPS</li>
              <li>VII. Middleman Innowacji dla JST</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Partner i Organizacja</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              Wyzwanie: Regionalny Ośrodek Polityki Społecznej w Krakowie – Małopolski Hub Innowacji Społecznych.
            </p>
            <p className="text-xs text-slate-300">
              Projekt przygotowany w ramach HackYeah 2026. Dane w wersji demonstracyjnej są przykładowe.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300">
          <p>Prototyp HackYeah 2026 – koncepcja dla ROPS Kraków. Nie jest oficjalnym serwisem ROPS ani Województwa Małopolskiego.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Zaprojektowano z myślą o seniorach i mieszkańcach Małopolski <Heart className="w-3.5 h-3.5 text-red-500 inline fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
};
