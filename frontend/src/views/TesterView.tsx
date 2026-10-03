import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TestingCampaignItem, EvaluationReport } from '../types';
import {
  FlaskConical,
  Users,
  CheckCircle2,
  Calendar,
  MessageSquarePlus,
  Star,
  ShieldCheck
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';

export const TesterView: React.FC = () => {
  const { etrMode } = useAccessibility();
  const [campaigns, setCampaigns] = useState<TestingCampaignItem[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<TestingCampaignItem | null>(null);

  // Formularz Rejestracji
  const [registerModal, setRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    tester_name: '',
    tester_email: '',
    tester_role: 'senior',
    motivation: 'Chcę pomóc w testowaniu prototypu dla osób starszych.'
  });

  // Formularz Feedbacku (SUS)
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [susForm, setSusForm] = useState({
    tester_name: '',
    tester_role: 'senior',
    sus_score: 85,
    usability_rating: 5,
    identified_barriers: 'Początkowy problem z wielkością ikony telefonu.',
    improvement_proposals: 'Zwiększenie kontrastu przycisków w menu głównym.'
  });

  const [report, setReport] = useState<EvaluationReport | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await api.getTestingCampaigns();
      setCampaigns(data);
      if (data.length > 0) setSelectedCampaign(data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    try {
      await api.registerTester(
        selectedCampaign.id,
        regForm.tester_name,
        regForm.tester_email,
        regForm.tester_role,
        regForm.motivation
      );
      alert('Zostałeś pomyślnie zarejestrowany na testy!');
      setRegisterModal(false);
      loadCampaigns();
    } catch (err) {
      console.error(err);
      alert('Błąd rejestracji.');
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    try {
      await api.submitTestingFeedback({
        campaign_id: selectedCampaign.id,
        ...susForm
      });
      alert('Dziękujemy za przekazanie oceny użyteczności SUS!');
      setFeedbackModal(false);
    } catch (err) {
      console.error(err);
      alert('Błąd wysyłania ankiety.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Nagłówek */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
          <span>Moduł IV: Tester Innowacji i Badanie Użyteczności (SUS)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Testuj Nowe Rzeczy i Pomagaj' : 'Platforma Testowania i Ewaluacji Prototypów'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Dołącz do grona testerów innowacji społecznych w Małopolsce! Sprawdzaj przedmioty i usługi w fazie prototypu, przekazuj opinie w standardzie System Usability Scale (SUS) i eliminuj bariery przed skalowaniem.
        </p>
      </div>

      {/* Lista Kampanii Testowych */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {campaigns.map((camp) => {
          const isSelected = selectedCampaign?.id === camp.id;
          const pctTaken = Math.round((camp.slots_taken / camp.slots_total) * 100);

          return (
            <div
              key={camp.id}
              onClick={() => setSelectedCampaign(camp)}
              className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Nabór otwarty
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-2 mb-1">{camp.campaign_name}</h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{camp.goal_description}</p>
                <div className="text-[11px] text-slate-600 mb-4">
                  <strong>Kogo szukamy:</strong> {camp.tester_profile_needed}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Miejsca: {camp.slots_taken} / {camp.slots_total}</span>
                  <span>{pctTaken}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pctTaken}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel Akcji dla Wybranej Kampanii */}
      {selectedCampaign && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Wybrany Pilotaż</span>
              <h2 className="text-xl font-black text-slate-900">{selectedCampaign.campaign_name}</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRegisterModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow"
              >
                Zgłoś się na testy
              </button>
              <button
                onClick={() => setFeedbackModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow"
              >
                Wypełnij ankietę (SUS)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">Cel i Zakres Testów:</strong>
              <p className="text-slate-600 leading-relaxed">{selectedCampaign.goal_description}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">Profil Poszukiwanego Testera:</strong>
              <p className="text-slate-600 leading-relaxed">{selectedCampaign.tester_profile_needed}</p>
              <span className="text-[11px] text-slate-400 block mt-2">Termin testów: do {selectedCampaign.deadline}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejestracji Testera */}
      {registerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Rejestracja na testy prototypu</h3>
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Twoje imię i nazwisko:</label>
                <input
                  type="text"
                  required
                  value={regForm.tester_name}
                  onChange={(e) => setRegForm({ ...regForm, tester_name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Adres e-mail:</label>
                <input
                  type="email"
                  required
                  value={regForm.tester_email}
                  onChange={(e) => setRegForm({ ...regForm, tester_email: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kim jesteś:</label>
                <select
                  value={regForm.tester_role}
                  onChange={(e) => setRegForm({ ...regForm, tester_role: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="senior">Senior 65+</option>
                  <option value="opiekun">Opiekun osoby zależnej</option>
                  <option value="ozn">Osoba z niepełnosprawnością</option>
                  <option value="specjalista">Pedagog / Psycholog / Terapeuta</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRegisterModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white font-bold px-4 py-1.5 rounded-lg"
                >
                  Zapisz się
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ankiety SUS */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Ankieta Informacji Zwrotnej (SUS)</h3>
            <form onSubmit={handleFeedback} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Imię testera:</label>
                <input
                  type="text"
                  required
                  value={susForm.tester_name}
                  onChange={(e) => setSusForm({ ...susForm, tester_name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ogólna ocena użyteczności (SUS) w skali 0 - 100: <strong className="text-blue-600">{susForm.sus_score} pkt</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={susForm.sus_score}
                  onChange={(e) => setSusForm({ ...susForm, sus_score: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Zauważone bariery lub trudności:</label>
                <textarea
                  rows={2}
                  value={susForm.identified_barriers}
                  onChange={(e) => setSusForm({ ...susForm, identified_barriers: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Propozycje ulepszeń:</label>
                <textarea
                  rows={2}
                  value={susForm.improvement_proposals}
                  onChange={(e) => setSusForm({ ...susForm, improvement_proposals: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setFeedbackModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded-lg"
                >
                  Prześlij opinię
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
