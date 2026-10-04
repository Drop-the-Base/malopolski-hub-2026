import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AccessibilityBar } from './components/accessibility/AccessibilityBar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { JuryFastTrackBar } from './components/common/JuryFastTrackBar';

import { HomeView } from './views/HomeView';
import { MatchmakingView } from './views/MatchmakingView';
import { KnowledgeView } from './views/KnowledgeView';
import { IdeaCreatorView } from './views/IdeaCreatorView';
import { MiddlemanView } from './views/MiddlemanView';
import { TesterView } from './views/TesterView';
import { CommunicationView } from './views/CommunicationView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { ProblemsRegistryView } from './views/ProblemsRegistryView';
import { RequireLogin } from './components/auth/RequireLogin';
import { FiszkaStatusView } from './views/FiszkaStatusView';
import { AccessibilityStatementView } from './views/AccessibilityStatementView';
import { NotFoundView } from './views/NotFoundView';
import { MyCasesView } from './views/MyCasesView';
import { SubscriptionsView, UnsubscribeView } from './views/SubscriptionsView';

const SITE_NAME = 'Małopolski Hub Innowacji Społecznych';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Strona główna',
  '/matchmaking': 'Kojarzenie potrzeb z innowacjami',
  '/problemy': 'Rejestr wyzwań JST',
  '/baza-wiedzy': 'Baza innowacji i mapa wyzwań',
  '/kreator-pomyslow': 'Kreator pomysłów',
  '/middleman': 'Middleman dla samorządów',
  '/tester': 'Tester innowacji',
  '/dialog': 'Dialog i mentorzy',
  '/admin': 'Panel ROPS',
  '/status': 'Status zgłoszenia',
  '/moje-sprawy': 'Moje sprawy',
  '/powiadomienia/wypisz': 'Wypisz się z powiadomień',
  '/powiadomienia': 'Powiadomienia e-mail',
  '/deklaracja-dostepnosci': 'Deklaracja dostępności'
};

/** Tytuł karty przeglądarki per podstrona (WCAG 2.4.2) i przeniesienie fokusu na treść po nawigacji. */
const RouteEffects: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const key = Object.keys(PAGE_TITLES).find((p) => p !== '/' && pathname.startsWith(p)) ?? (pathname === '/' ? '/' : '');
    const page = key ? PAGE_TITLES[key] : 'Nie znaleziono strony';
    document.title = `${page} | ${SITE_NAME}`;
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  return (
    <Router>
      <RouteEffects />
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors">
        {/* Pasek dostępności WCAG 2.1 AA & ETR */}
        <div className="print:hidden">
          <AccessibilityBar />
        </div>

        {/* Nawigacja główna */}
        <div className="print:hidden">
          <Navbar />
        </div>

        {/* Szybka ścieżka demonstracyjna dla Jury (domyślnie zwinięta) */}
        <div className="print:hidden">
          <JuryFastTrackBar />
        </div>

        {/* Zawartość główna z kotwicą skip-link */}
        <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none print:p-0 print:m-0 print:max-w-none">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/matchmaking" element={<MatchmakingView />} />
            <Route
              path="/problemy"
              element={
                <RequireLogin
                  title="Panel Urzędnika JST – Rejestr Wyzwań"
                  description="Rejestr wyzwań gmin, przypisywanie innowacji i raporty diagnostyczne są dostępne dla zalogowanych urzędników JST i koordynatorów ROPS. Mieszkańcy zgłaszają problemy w module Kojarzenie potrzeb."
                >
                  <ProblemsRegistryView />
                </RequireLogin>
              }
            />
            <Route path="/baza-wiedzy" element={<KnowledgeView />} />
            <Route path="/baza-wiedzy/:innovationId" element={<KnowledgeView />} />
            <Route path="/kreator-pomyslow" element={<IdeaCreatorView />} />
            <Route path="/middleman" element={<MiddlemanView />} />
            <Route path="/tester" element={<TesterView />} />
            <Route path="/dialog" element={<CommunicationView />} />
            <Route path="/admin" element={<AdminDashboardView />} />
            <Route path="/status" element={<FiszkaStatusView />} />
            <Route path="/status/:id" element={<FiszkaStatusView />} />
            <Route path="/moje-sprawy" element={<MyCasesView />} />
            <Route path="/powiadomienia" element={<SubscriptionsView />} />
            <Route path="/powiadomienia/wypisz/:token" element={<UnsubscribeView />} />
            <Route path="/deklaracja-dostepnosci" element={<AccessibilityStatementView />} />
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </main>

        {/* Stopka */}
        <div className="print:hidden">
          <Footer />
        </div>
      </div>
    </Router>
  );
};
