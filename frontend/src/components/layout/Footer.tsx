import React from 'react';
import { Heart, Shield, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <span className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-sm">MH</span>
              Małopolski Hub Innowacji Społecznych
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md mb-4">
              Cyfrowe narzędzie wspierające Regionalny Ośrodek Polityki Społecznej w Krakowie (ROPS Kraków) w automatyzacji kojarzenia potrzeb mieszkańców z gotowymi rozwiązaniami, inkubacji nowych pomysłów i skalowaniu innowacji w gminach Małopolski.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zgodność z WCAG 2.1 AA
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                100% Zero Real PII
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
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              Regionalny Ośrodek Polityki Społecznej w Krakowie<br />
              ul. Piastowska 32, 30-070 Kraków<br />
              Dział Innowacji Społecznych
            </p>
            <p className="text-xs text-slate-400">
              Projekt przygotowany w ramach HackYeah 2026.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Samorząd Województwa Małopolskiego & ROPS Kraków. Wszelkie prawa zastrzeżone.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Zaprojektowano z myślą o seniorach i mieszkańcach Małopolski <Heart className="w-3.5 h-3.5 text-red-500 inline fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
};
