import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors">
        {/* Pasek dostępności WCAG 2.1 AA & ETR */}
        <AccessibilityBar />

        {/* Nawigacja główna */}
        <Navbar />

        {/* 1-minutowa szybka ścieżka dla Jury */}
        <JuryFastTrackBar />

        {/* Zawartość główna z kotwicą skip-link */}
        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/matchmaking" element={<MatchmakingView />} />
            <Route path="/problemy" element={<ProblemsRegistryView />} />
            <Route path="/baza-wiedzy" element={<KnowledgeView />} />
            <Route path="/kreator-pomyslow" element={<IdeaCreatorView />} />
            <Route path="/middleman" element={<MiddlemanView />} />
            <Route path="/tester" element={<TesterView />} />
            <Route path="/dialog" element={<CommunicationView />} />
            <Route path="/admin" element={<AdminDashboardView />} />
          </Routes>
        </main>

        {/* Stopka */}
        <Footer />
      </div>
    </Router>
  );
};
