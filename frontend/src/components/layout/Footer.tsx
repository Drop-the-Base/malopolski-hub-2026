import React from 'react';
import { Link } from 'react-router-dom';

const modules = [
  { to: '/matchmaking', label: 'Znajdź rozwiązanie' },
  { to: '/baza-wiedzy', label: 'Baza innowacji i mapa wyzwań' },
  { to: '/kreator-pomyslow', label: 'Kreator pomysłów' },
  { to: '/tester', label: 'Tester innowacji' },
  { to: '/dialog', label: 'Dialog i mentorzy' },
  { to: '/admin', label: 'Panel ROPS' },
  { to: '/middleman', label: 'Middleman dla gmin' },
  { to: '/problemy', label: 'Rejestr wyzwań gmin' },
  { to: '/moje-sprawy', label: 'Moje sprawy (status zgłoszeń)' },
  { to: '/powiadomienia', label: 'Powiadomienia o naborach' }
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-200 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <p className="text-white font-extrabold text-lg mb-3">Małopolski Hub Innowacji Społecznych</p>
            <p className="text-sm leading-relaxed max-w-prose mb-4">
              Prototyp narzędzia, które łączy potrzeby mieszkańców z gotowymi rozwiązaniami, pomaga rozwijać
              nowe pomysły i wdrażać innowacje w gminach Małopolski. Koncepcja przygotowana dla Regionalnego
              Ośrodka Polityki Społecznej w Krakowie.
            </p>
            <p className="text-sm">
              <Link to="/deklaracja-dostepnosci" className="underline underline-offset-4 hover:text-white">
                Deklaracja dostępności
              </Link>
            </p>
          </div>

          <nav className="md:col-span-4" aria-label="Moduły platformy">
            <h2 className="text-white font-bold text-sm mb-3">Moduły platformy</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-y-1.5 text-sm">
              {modules.map((m) => (
                <li key={m.to}>
                  <Link to={m.to} className="hover:text-white hover:underline underline-offset-4">
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3 text-sm leading-relaxed space-y-2">
            <h2 className="text-white font-bold text-sm mb-3">O projekcie</h2>
            <p>Przygotowane w ramach HackYeah 2026. Dane w wersji demonstracyjnej są przykładowe.</p>
            <p>Dane osobowe w zgłoszeniach są maskowane przed analizą.</p>
          </div>
        </div>

        <p className="border-t border-slate-700 mt-10 pt-6 text-sm text-slate-300">
          Prototyp HackYeah 2026, koncepcja dla ROPS Kraków. Nie jest oficjalnym serwisem ROPS ani Województwa
          Małopolskiego.
        </p>
      </div>
    </footer>
  );
};
