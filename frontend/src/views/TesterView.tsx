import React, { useState, useEffect } from 'react';
import { api, apiErrorMessage } from '../services/api';
import { TestingCampaignItem, EvaluationReport } from '../types';
import { FlaskConical, CheckCircle2, X } from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';
import { useDialog } from '../hooks/useDialog';
import { TESTER_ROLES } from '../constants/domain';

// Kwestionariusz System Usability Scale (Brooke, 1996) – polska adaptacja treści pytań
const SUS_ITEMS = [
  'Myślę, że chciałbym/chciałabym często korzystać z tego rozwiązania.',
  'Rozwiązanie wydało mi się niepotrzebnie skomplikowane.',
  'Rozwiązanie było łatwe w użyciu.',
  'Myślę, że do korzystania z rozwiązania potrzebowałbym/potrzebowałabym pomocy innej osoby.',
  'Poszczególne części rozwiązania dobrze ze sobą współgrają.',
  'W rozwiązaniu było zbyt wiele niespójności.',
  'Myślę, że większość ludzi bardzo szybko nauczyłaby się z niego korzystać.',
  'Korzystanie z rozwiązania było bardzo uciążliwe.',
  'Czułem/czułam się bardzo pewnie, korzystając z rozwiązania.',
  'Musiałem/musiałam nauczyć się wielu rzeczy, zanim zacząłem/zaczęłam z niego korzystać.'
];
const SCALE = [
  { value: 1, label: 'Zdecydowanie nie' },
  { value: 2, label: 'Raczej nie' },
  { value: 3, label: 'Trudno powiedzieć' },
  { value: 4, label: 'Raczej tak' },
  { value: 5, label: 'Zdecydowanie tak' }
];

const emptyReg = { tester_name: '', tester_email: '', tester_role: 'senior', motivation: '', guardian_consent: false, rodo_consent: false };
const emptySus = {
  tester_name: '',
  tester_role: 'senior',
  answers: Array<number | null>(10).fill(null),
  usability_rating: 0,
  identified_barriers: '',
  improvement_proposals: ''
};

export const TesterView: React.FC = () => {
  const { etrMode } = useAccessibility();
  const [campaigns, setCampaigns] = useState<TestingCampaignItem[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<TestingCampaignItem | null>(null);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [notice, setNotice] = useState('');

  const [registerModal, setRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState(emptyReg);
  const [regError, setRegError] = useState('');

  const [feedbackModal, setFeedbackModal] = useState(false);
  const [susForm, setSusForm] = useState(emptySus);
  const [susError, setSusError] = useState('');

  const regRef = useDialog<HTMLDivElement>(registerModal, () => setRegisterModal(false));
  const susRef = useDialog<HTMLDivElement>(feedbackModal, () => setFeedbackModal(false));

  const loadCampaigns = async (keepId?: string) => {
    try {
      const data = await api.getTestingCampaigns();
      setCampaigns(data);
      setSelectedCampaign(data.find((c) => c.id === keepId) ?? data[0] ?? null);
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Nie udało się wczytać kampanii.'));
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (!selectedCampaign) return;
    api.getCampaignReport(selectedCampaign.id).then(setReport).catch(() => setReport(null));
  }, [selectedCampaign?.id]);

  const isFull = (c: TestingCampaignItem) => c.status !== 'open' || c.slots_taken >= c.slots_total;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    setRegError('');
    try {
      const res = await api.registerTester({ campaign_id: selectedCampaign.id, ...regForm });
      setRegisterModal(false);
      setRegForm(emptyReg);
      setNotice(res.message);
      loadCampaigns(selectedCampaign.id);
    } catch (err) {
      setRegError(apiErrorMessage(err, 'Nie udało się zapisać na testy.'));
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    if (susForm.answers.some((a) => a === null)) {
      setSusError('Odpowiedz na wszystkie 10 pytań kwestionariusza.');
      return;
    }
    if (!susForm.usability_rating) {
      setSusError('Wybierz ogólną ocenę w skali 1–5.');
      return;
    }
    setSusError('');
    try {
      const res = await api.submitTestingFeedback({
        campaign_id: selectedCampaign.id,
        tester_name: susForm.tester_name,
        tester_role: susForm.tester_role,
        sus_answers: susForm.answers as number[],
        usability_rating: susForm.usability_rating,
        identified_barriers: susForm.identified_barriers,
        improvement_proposals: susForm.improvement_proposals
      });
      setFeedbackModal(false);
      setSusForm(emptySus);
      setNotice(`${res.message} Wynik SUS: ${res.sus_score} pkt (${res.sus_grade}).`);
      api.getCampaignReport(selectedCampaign.id).then(setReport).catch(() => undefined);
    } catch (err) {
      setSusError(apiErrorMessage(err, 'Nie udało się wysłać ankiety.'));
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <FlaskConical className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
          <span>Moduł IV: Tester Innowacji</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Testuj nowe rozwiązania i pomagaj' : 'Testowanie i ocena prototypów'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          {etrMode
            ? 'Zapisz się na test. Sprawdź nowe rozwiązanie. Powiedz nam, co było łatwe, a co trudne.'
            : 'Zapisz się do testów prototypów innowacji społecznych i oceń je standardowym kwestionariuszem użyteczności SUS (10 pytań). Wyniki trafiają do zespołu innowacji przed skalowaniem.'}
        </p>
      </div>

      <div aria-live="polite">
        {notice && (
          <div role="status" className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-xl text-sm flex items-start justify-between gap-3">
            <span className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="Zamknij komunikat" className="p-1"><X className="w-4 h-4" aria-hidden="true" /></button>
          </div>
        )}
      </div>

      {/* Lista Kampanii Testowych */}
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Kampanie testowe">
        {campaigns.map((camp) => {
          const isSelected = selectedCampaign?.id === camp.id;
          const pctTaken = Math.min(100, Math.round((camp.slots_taken / camp.slots_total) * 100));
          const full = isFull(camp);

          return (
            <li key={camp.id}>
              <button
                type="button"
                onClick={() => setSelectedCampaign(camp)}
                aria-pressed={isSelected}
                className={`w-full h-full text-left bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  isSelected ? 'border-emerald-600 ring-2 ring-emerald-100 shadow-md' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${full ? 'bg-slate-200 text-slate-800' : 'bg-emerald-100 text-emerald-900'}`}>
                    {full ? 'Nabór zamknięty – komplet' : 'Nabór otwarty'}
                  </span>
                  <span className="block font-bold text-slate-900 text-sm mt-2 mb-1">{camp.campaign_name}</span>
                  <span className="block text-sm text-slate-600 mb-3 line-clamp-2">{camp.goal_description}</span>
                  <span className="block text-xs text-slate-700 mb-4">
                    <strong>Kogo szukamy:</strong> {camp.tester_profile_needed}
                  </span>
                </div>

                <span className="block w-full">
                  <span className="flex justify-between text-xs text-slate-700 mb-1">
                    <span>Miejsca: {camp.slots_taken} / {camp.slots_total}</span>
                    <span>{pctTaken}%</span>
                  </span>
                  <span
                    className="block w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={camp.slots_total}
                    aria-valuenow={camp.slots_taken}
                    aria-label="Zajęte miejsca"
                  >
                    <span className="block h-full bg-emerald-600 rounded-full" style={{ width: `${pctTaken}%` }} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedCampaign && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Wybrany pilotaż</span>
              <h2 className="text-xl font-black text-slate-900">{selectedCampaign.campaign_name}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setRegError(''); setRegisterModal(true); }}
                disabled={isFull(selectedCampaign)}
                className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors shadow"
              >
                {isFull(selectedCampaign) ? 'Brak wolnych miejsc' : 'Zgłoś się na testy'}
              </button>
              <button
                type="button"
                onClick={() => { setSusError(''); setFeedbackModal(true); }}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors shadow"
              >
                Oceń prototyp (ankieta SUS)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-slate-900 font-bold mb-1">Cel i zakres testów</h3>
              <p className="text-slate-700 leading-relaxed">{selectedCampaign.goal_description}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-slate-900 font-bold mb-1">Profil testera</h3>
              <p className="text-slate-700 leading-relaxed">{selectedCampaign.tester_profile_needed}</p>
              <p className="text-slate-700 mt-2">Testy do: <strong>{formatDate(selectedCampaign.deadline)}</strong></p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-slate-900 font-bold mb-1">Wyniki ankiet</h3>
              {report && report.total_feedbacks > 0 ? (
                <p className="text-slate-700 leading-relaxed">
                  Średni SUS: <strong>{report.average_sus_score} pkt</strong> ({report.sus_grade})<br />
                  Liczba ankiet: {report.total_feedbacks}<br />
                  Zadowolenie: {report.satisfaction_rate}%
                </p>
              ) : (
                <p className="text-slate-700">Brak ankiet – Twoja opinia będzie pierwsza.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejestracja testera */}
      {registerModal && selectedCampaign && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setRegisterModal(false)}>
          <div
            ref={regRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reg-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 id="reg-title" className="text-lg font-bold text-slate-900 mb-1">Zapis na testy</h2>
            <p className="text-sm text-slate-600 mb-4">{selectedCampaign.campaign_name}</p>
            <form onSubmit={handleRegister} className="space-y-3 text-sm">
              <div>
                <label htmlFor="reg-name" className="block font-bold text-slate-800 mb-1">Imię i nazwisko</label>
                <input id="reg-name" type="text" required minLength={2} autoComplete="name" value={regForm.tester_name}
                  onChange={(e) => setRegForm({ ...regForm, tester_name: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
              </div>
              <div>
                <label htmlFor="reg-email" className="block font-bold text-slate-800 mb-1">Adres e-mail</label>
                <input id="reg-email" type="email" required autoComplete="email" value={regForm.tester_email}
                  onChange={(e) => setRegForm({ ...regForm, tester_email: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
              </div>
              <div>
                <label htmlFor="reg-role" className="block font-bold text-slate-800 mb-1">Kim jesteś</label>
                <select id="reg-role" value={regForm.tester_role}
                  onChange={(e) => setRegForm({ ...regForm, tester_role: e.target.value, guardian_consent: false })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white">
                  {TESTER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="reg-motivation" className="block font-bold text-slate-800 mb-1">Dlaczego chcesz testować? (opcjonalnie)</label>
                <textarea id="reg-motivation" rows={2} maxLength={2000} value={regForm.motivation}
                  onChange={(e) => setRegForm({ ...regForm, motivation: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
              </div>
              {regForm.tester_role === 'mlodziez' && (
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-lg">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" required checked={regForm.guardian_consent}
                      onChange={(e) => setRegForm({ ...regForm, guardian_consent: e.target.checked })} className="mt-1" />
                    <span>Jestem rodzicem/opiekunem prawnym osoby niepełnoletniej lub mam ich pisemną zgodę na udział w testach. Koordynator potwierdzi zgodę przed testem.</span>
                  </label>
                </div>
              )}
              <label className="flex items-start gap-2">
                <input type="checkbox" required checked={regForm.rodo_consent}
                  onChange={(e) => setRegForm({ ...regForm, rodo_consent: e.target.checked })} className="mt-1" />
                <span>Zgadzam się na przetwarzanie moich danych kontaktowych w celu organizacji testów (RODO). Dane zostaną usunięte po zakończeniu kampanii.</span>
              </label>
              {regError && <p role="alert" className="text-rose-800 bg-rose-50 border border-rose-200 p-2 rounded-lg">{regError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRegisterModal(false)} className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800">Anuluj</button>
                <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg">Zapisz się</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ankieta SUS */}
      {feedbackModal && selectedCampaign && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setFeedbackModal(false)}>
          <div
            ref={susRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sus-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 id="sus-title" className="text-lg font-bold text-slate-900 mb-1">Ocena prototypu – kwestionariusz SUS</h2>
            <p className="text-sm text-slate-600 mb-4">Zaznacz, na ile zgadzasz się z każdym zdaniem. Nie ma dobrych ani złych odpowiedzi.</p>
            <form onSubmit={handleFeedback} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sus-name" className="block font-bold text-slate-800 mb-1">Imię</label>
                  <input id="sus-name" type="text" required minLength={2} value={susForm.tester_name}
                    onChange={(e) => setSusForm({ ...susForm, tester_name: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label htmlFor="sus-role" className="block font-bold text-slate-800 mb-1">Kim jesteś</label>
                  <select id="sus-role" value={susForm.tester_role}
                    onChange={(e) => setSusForm({ ...susForm, tester_role: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300 bg-white">
                    {TESTER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <ol className="space-y-3">
                {SUS_ITEMS.map((item, i) => (
                  <li key={i}>
                    <fieldset className="border border-slate-200 rounded-lg p-3">
                      <legend className="font-semibold text-slate-900 px-1">{i + 1}. {item}</legend>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {SCALE.map((opt) => (
                          <label key={opt.value} className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer ${susForm.answers[i] === opt.value ? 'bg-blue-50 border-blue-500' : 'border-slate-300'}`}>
                            <input
                              type="radio"
                              name={`sus-${i}`}
                              value={opt.value}
                              checked={susForm.answers[i] === opt.value}
                              onChange={() => {
                                const answers = [...susForm.answers];
                                answers[i] = opt.value;
                                setSusForm({ ...susForm, answers });
                              }}
                            />
                            <span className="text-xs">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </li>
                ))}
              </ol>

              <fieldset className="border border-slate-200 rounded-lg p-3">
                <legend className="font-semibold text-slate-900 px-1">Ogólna ocena prototypu (1 – bardzo źle, 5 – bardzo dobrze)</legend>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className={`px-3 py-1 rounded border cursor-pointer ${susForm.usability_rating === n ? 'bg-blue-50 border-blue-500' : 'border-slate-300'}`}>
                      <input type="radio" name="overall" className="mr-1" checked={susForm.usability_rating === n}
                        onChange={() => setSusForm({ ...susForm, usability_rating: n })} />
                      {n}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="sus-barriers" className="block font-bold text-slate-800 mb-1">Zauważone bariery lub trudności</label>
                <textarea id="sus-barriers" rows={2} maxLength={4000} value={susForm.identified_barriers}
                  onChange={(e) => setSusForm({ ...susForm, identified_barriers: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
              </div>
              <div>
                <label htmlFor="sus-improvements" className="block font-bold text-slate-800 mb-1">Propozycje ulepszeń</label>
                <textarea id="sus-improvements" rows={2} maxLength={4000} value={susForm.improvement_proposals}
                  onChange={(e) => setSusForm({ ...susForm, improvement_proposals: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
              </div>
              {susError && <p role="alert" className="text-rose-800 bg-rose-50 border border-rose-200 p-2 rounded-lg">{susError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setFeedbackModal(false)} className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800">Anuluj</button>
                <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg">Wyślij ocenę</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
