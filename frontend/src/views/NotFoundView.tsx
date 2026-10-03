import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export const NotFoundView: React.FC = () => (
  <div className="max-w-xl mx-auto text-center bg-white p-10 rounded-2xl border border-slate-200 shadow-sm">
    <Compass className="w-10 h-10 text-blue-600 mx-auto mb-4" aria-hidden="true" />
    <h1 className="text-2xl font-black text-slate-900 mb-2">Nie znaleziono strony (błąd 404)</h1>
    <p className="text-sm text-slate-600 mb-6">
      Adres mógł się zmienić albo zawiera literówkę. Wróć na stronę główną lub opisz swój problem w wyszukiwarce.
    </p>
    <div className="flex flex-wrap justify-center gap-3">
      <Link to="/" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm">
        Strona główna
      </Link>
      <Link to="/matchmaking" className="border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold px-5 py-2.5 rounded-xl text-sm">
        Znajdź innowację
      </Link>
    </div>
  </div>
);
