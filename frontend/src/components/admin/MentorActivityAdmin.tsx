import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { api, apiErrorMessage } from '../../services/api';
import { MentorActivitySummary } from '../../types';
import { formatDateTime } from '../../constants/domain';

/** Panel ROPS (G15): aktywność mentorów – przydzielone fiszki, wysłane opinie, odpowiedzi w Dialogu, konsultacje. */
export const MentorActivityAdmin: React.FC = () => {
  const [data, setData] = useState<MentorActivitySummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMentorActivity()
      .then(setData)
      .catch((err) => setError(apiErrorMessage(err, 'Nie udało się wczytać aktywności mentorów.')));
  }, []);

  return (
    <section aria-labelledby="mentor-activity-title" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
      <div>
        <h2 id="mentor-activity-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-700" aria-hidden="true" /> Aktywność mentorów
        </h2>
        <p className="text-sm text-slate-700">
          Opinie mentorów trafiają do autora (e-mail i „Moje sprawy”) i do powiadomień powyżej. Mentorzy pracują w{' '}
          <Link to="/mentor" className="font-bold text-blue-700 underline">panelu mentora</Link>.
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-200 p-3 rounded-lg">{error}</p>}
      {data && (
        <>
          <p className="text-sm text-slate-800">
            Wysłane opinie: <strong className="tabular-nums">{data.total_feedback}</strong> · odpowiedzi w Dialogu:{' '}
            <strong className="tabular-nums">{data.total_thread_replies}</strong> · przydzielone fiszki bez opinii:{' '}
            <strong className="tabular-nums">{data.fiszki_without_feedback}</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <caption className="sr-only">Aktywność mentorów</caption>
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th scope="col" className="p-2">Mentor</th>
                  <th scope="col" className="p-2 text-right">Przydzielone fiszki</th>
                  <th scope="col" className="p-2 text-right">Opinie</th>
                  <th scope="col" className="p-2 text-right">Odpowiedzi w Dialogu</th>
                  <th scope="col" className="p-2 text-right">Konsultacje (nadchodzące / wszystkie)</th>
                  <th scope="col" className="p-2">Ostatnia aktywność</th>
                </tr>
              </thead>
              <tbody>
                {data.mentors.map((m) => (
                  <tr key={m.mentor_id} className="border-b border-slate-200 align-top">
                    <th scope="row" className="p-2 font-semibold text-slate-900">
                      {m.full_name}
                      <span className="block font-normal text-slate-600">{m.specialization}</span>
                    </th>
                    <td className="p-2 text-right tabular-nums">{m.assigned_fiszki}</td>
                    <td className="p-2 text-right tabular-nums">{m.feedback_sent}</td>
                    <td className="p-2 text-right tabular-nums">{m.thread_replies}</td>
                    <td className="p-2 text-right tabular-nums">{m.upcoming_bookings} / {m.total_bookings}</td>
                    <td className="p-2">{m.last_activity_at ? formatDateTime(m.last_activity_at) : 'brak'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
