import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../services/api';
import { BookingConfirmation, CommunicationThreadItem, MentorItem, MentorSlot } from '../types';
import { Users, MessageSquare, Send, UserCheck, Calendar, Mail, Plus, Download, CheckCircle2 } from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';
import { useDialog } from '../hooks/useDialog';
import { PARTICIPANT_ROLES, POWIATY, THREAD_CATEGORIES, formatDateTime, powiatLabel } from '../constants/domain';

const SEEN_KEY = 'mhis_seen_threads';
const IDENTITY_KEY = 'mhis_dialog_identity';

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignoruj */
  }
};

// Godziny dyżurów mentorów są lokalne (Europe/Warsaw) – formatujemy bez przeliczania stref
const formatSlot = (iso: string) => {
  const [date, time] = iso.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).toLocaleDateString('pl-PL', { weekday: 'long' });
  return `${weekday}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}, ${time.slice(0, 5)}`;
};

const downloadIcs = (b: BookingConfirmation) => {
  const stamp = (iso: string) => iso.replace(/[-:]/g, '').slice(0, 15);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MHIS//Konsultacje//PL',
    'BEGIN:VEVENT',
    `UID:${b.id}@mhis`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=Europe/Warsaw:${stamp(b.slot_start)}`,
    `DTEND;TZID=Europe/Warsaw:${stamp(b.slot_end)}`,
    `SUMMARY:Konsultacja z mentorem: ${b.mentor_name}`,
    `DESCRIPTION:${b.topic.replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'konsultacja-mhis.ics';
  a.click();
  URL.revokeObjectURL(url);
};

export const CommunicationView: React.FC = () => {
  const { etrMode } = useAccessibility();
  const [threads, setThreads] = useState<CommunicationThreadItem[]>([]);
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [activeTab, setActiveTab] = useState<'threads' | 'mentors'>('threads');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seen, setSeen] = useState<Record<string, number>>(() => readJSON(SEEN_KEY, {}));
  const [identity, setIdentity] = useState(() => readJSON(IDENTITY_KEY, { name: '', role: 'mieszkaniec' }));
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');
  const [status, setStatus] = useState('');

  const [newThreadModal, setNewThreadModal] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [newThreadForm, setNewThreadForm] = useState({
    title: '',
    category: 'poszukiwanie_partnera',
    author_name: '',
    author_role: 'ngo',
    powiat: 'tarnowski',
    initial_message: ''
  });

  // Rezerwacja konsultacji
  const [bookingMentor, setBookingMentor] = useState<MentorItem | null>(null);
  const [slots, setSlots] = useState<MentorSlot[]>([]);
  const [bookingForm, setBookingForm] = useState({ slot_start: '', requester_name: '', requester_email: '', topic: '', rodo_consent: false });
  const [bookingError, setBookingError] = useState('');
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);

  const threadRef = useDialog<HTMLDivElement>(newThreadModal, () => setNewThreadModal(false));
  const bookingRef = useDialog<HTMLDivElement>(!!bookingMentor, () => setBookingMentor(null));

  const selectedThread = threads.find((t) => t.id === selectedId) ?? null;

  const loadData = async (keepId?: string) => {
    try {
      const [thData, mData] = await Promise.all([api.getThreads(), api.getMentors()]);
      setThreads(thData);
      setMentors(mData);
      setSelectedId(keepId ?? thData[0]?.id ?? null);
    } catch (err) {
      setStatus(apiErrorMessage(err, 'Nie udało się wczytać wątków.'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Oznacz wątek jako przeczytany po otwarciu
  useEffect(() => {
    if (!selectedThread) return;
    const next = { ...seen, [selectedThread.id]: selectedThread.messages.length };
    setSeen(next);
    writeJSON(SEEN_KEY, next);
  }, [selectedThread?.id, selectedThread?.messages.length]);

  const unreadCount = (t: CommunicationThreadItem) => Math.max(0, t.messages.length - (seen[t.id] ?? 0));

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyText.trim()) return;
    setReplyError('');
    try {
      await api.replyThread(selectedThread.id, identity.name, identity.role, replyText);
      writeJSON(IDENTITY_KEY, identity);
      setReplyText('');
      setStatus('Odpowiedź dodana.');
      loadData(selectedThread.id);
    } catch (err) {
      setReplyError(apiErrorMessage(err, 'Nie udało się dodać odpowiedzi.'));
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setThreadError('');
    try {
      const t = await api.createThread(newThreadForm);
      setNewThreadModal(false);
      setNewThreadForm({ ...newThreadForm, title: '', initial_message: '' });
      setStatus('Wątek został utworzony.');
      loadData(t.id);
    } catch (err) {
      setThreadError(apiErrorMessage(err, 'Nie udało się utworzyć wątku.'));
    }
  };

  const openBooking = async (m: MentorItem) => {
    setBookingMentor(m);
    setBooking(null);
    setBookingError('');
    setBookingForm({ slot_start: '', requester_name: identity.name, requester_email: '', topic: '', rodo_consent: false });
    try {
      setSlots(await api.getMentorSlots(m.id));
    } catch (err) {
      setSlots([]);
      setBookingError(apiErrorMessage(err, 'Nie udało się pobrać terminów.'));
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingMentor) return;
    if (!bookingForm.slot_start) {
      setBookingError('Wybierz termin konsultacji.');
      return;
    }
    setBookingError('');
    try {
      setBooking(await api.bookMentor(bookingMentor.id, bookingForm));
      setSlots(await api.getMentorSlots(bookingMentor.id));
    } catch (err) {
      setBookingError(apiErrorMessage(err, 'Nie udało się zarezerwować terminu.'));
    }
  };

  const switchTab = (tab: 'threads' | 'mentors') => {
    setActiveTab(tab);
    setNewThreadModal(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Rozmowa z ekspertami i pomoc' : 'Dialog międzysektorowy i konsultacje z mentorami'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Pytania do koordynatorów, giełda partnerstw (NGO szuka gminy, gmina szuka realizatora) oraz rezerwacja konsultacji u mentorów z potwierdzeniem e-mail i plikiem do kalendarza.
        </p>
        <p className="text-sm text-slate-700 mt-2">
          Jesteś mentorem lub ekspertem ROPS?{' '}
          <Link to="/mentor" className="font-bold text-blue-700 underline">Otwórz panel mentora</Link> – pomysły do oceny, pytania i Twoje konsultacje.
        </p>

        <div role="tablist" aria-label="Sekcje dialogu" className="flex flex-wrap border-b border-slate-200 mt-6 gap-x-6 text-sm font-bold">
          {([['threads', `Wątki i partnerstwa (${threads.length})`, MessageSquare], ['mentors', `Mentorzy (${mentors.length})`, UserCheck]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`panel-${id}`}
              onClick={() => switchTab(id)}
              className={`pb-3 border-b-2 flex items-center gap-2 ${activeTab === id ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">{status}</p>

      {activeTab === 'threads' && (
        <div id="panel-threads" role="tabpanel" aria-labelledby="tab-threads" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700 ">Tematy</h2>
              <button
                type="button"
                onClick={() => { setThreadError(''); setNewThreadModal(true); }}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 shadow"
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> Nowy wątek
              </button>
            </div>

            <ul className="space-y-2">
              {threads.map((t) => {
                const isSelected = selectedId === t.id;
                const unread = unreadCount(t);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      aria-pressed={isSelected}
                      className={`w-full text-left bg-white p-4 rounded-xl border transition-all text-sm ${isSelected ? 'border-blue-600 ring-2 ring-blue-100 shadow' : 'border-slate-200 hover:border-slate-400'}`}
                    >
                      <span className="flex justify-between text-xs text-slate-600 mb-1">
                        <span className="font-bold text-blue-800">{THREAD_CATEGORIES[t.category] ?? t.category}</span>
                        <span>{powiatLabel(t.powiat)}</span>
                      </span>
                      <span className="block font-bold text-slate-900 line-clamp-2 mb-1">{t.title}</span>
                      <span className="text-slate-600 flex justify-between items-center text-xs mt-2">
                        <span>{t.author_name}</span>
                        <span className="flex items-center gap-1">
                          {unread > 0 && !isSelected && (
                            <span className="bg-rose-700 text-white px-2 py-0.5 rounded-full font-bold">{unread} nowe</span>
                          )}
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-bold">{t.messages.length} wiad.</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[450px]">
            {selectedThread ? (
              <div>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <span className="text-xs font-bold text-blue-800">{THREAD_CATEGORIES[selectedThread.category] ?? selectedThread.category}</span>
                  <h2 className="text-lg font-bold text-slate-900">{selectedThread.title}</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Autor: <strong>{selectedThread.author_name}</strong> ({PARTICIPANT_ROLES[selectedThread.author_role] ?? selectedThread.author_role}) · {powiatLabel(selectedThread.powiat)} · {formatDateTime(selectedThread.created_at)}
                  </p>
                </div>

                <ol role="log" aria-live="polite" aria-label="Wiadomości w wątku" className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
                  {selectedThread.messages.map((m) => (
                    <li key={m.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm">
                      <div className="flex flex-wrap justify-between gap-2 font-bold text-slate-900 mb-1">
                        <span>{m.sender_name} <span className="font-normal text-slate-600">({PARTICIPANT_ROLES[m.sender_role] ?? m.sender_role})</span></span>
                        <time dateTime={m.created_at} className="text-xs text-slate-600 font-normal">{formatDateTime(m.created_at)}</time>
                      </div>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-line">{m.content}</p>
                    </li>
                  ))}
                </ol>

                <form onSubmit={handleReply} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="reply-name" className="block text-xs font-bold text-slate-800 mb-1">Podpis (imię lub organizacja)</label>
                      <input id="reply-name" required minLength={2} value={identity.name}
                        onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                        className="w-full text-sm p-2 rounded-lg border border-slate-300" />
                    </div>
                    <div>
                      <label htmlFor="reply-role" className="block text-xs font-bold text-slate-800 mb-1">Występuję jako</label>
                      <select id="reply-role" value={identity.role} onChange={(e) => setIdentity({ ...identity, role: e.target.value })}
                        className="w-full text-sm p-2 rounded-lg border border-slate-300 bg-white">
                        {Object.entries(PARTICIPANT_ROLES).filter(([k]) => k !== 'rops_ekspert').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <label htmlFor="reply-text" className="block text-xs font-bold text-slate-800">Twoja odpowiedź</label>
                  <div className="flex gap-2">
                    <textarea id="reply-text" rows={2} required maxLength={4000} value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 text-sm p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600" />
                    <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1 shadow self-end">
                      <Send className="w-4 h-4" aria-hidden="true" /> Wyślij
                    </button>
                  </div>
                  {replyError && <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-200 p-2 rounded-lg">{replyError}</p>}
                </form>
              </div>
            ) : (
              <p className="text-center py-20 text-slate-600 text-sm">Wybierz wątek z listy.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'mentors' && (
        <ul id="panel-mentors" role="tabpanel" aria-labelledby="tab-mentors" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mentors.map((m) => (
            <li key={m.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 font-black flex items-center justify-center text-base mb-3" aria-hidden="true">
                  {m.full_name.split(' ').filter((w) => /^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(w)).map((w) => w[0]).slice(0, 2).join('')}
                </div>
                <h2 className="font-bold text-slate-900 text-sm">{m.full_name}</h2>
                <span className="text-sm text-blue-800 font-semibold block mb-2">{m.specialization}</span>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{m.bio}</p>
              </div>
              <div className="border-t border-slate-100 pt-3 text-sm space-y-2">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Calendar className="w-4 h-4 text-amber-700" aria-hidden="true" /> Dyżur: {m.available_hours}
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="w-4 h-4 text-blue-700" aria-hidden="true" /> {m.contact_email}
                </div>
                <button type="button" onClick={() => openBooking(m)}
                  className="w-full mt-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-2 rounded-lg text-sm">
                  Zarezerwuj konsultację<span className="sr-only"> z: {m.full_name}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Nowy wątek */}
      {newThreadModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setNewThreadModal(false)}>
          <div ref={threadRef} role="dialog" aria-modal="true" aria-labelledby="new-thread-title" tabIndex={-1}
            onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 id="new-thread-title" className="text-lg font-bold text-slate-900 mb-3">Nowy wątek</h2>
            <form onSubmit={handleCreateThread} className="space-y-3 text-sm">
              <div>
                <label htmlFor="nt-title" className="block font-bold text-slate-800 mb-1">Tytuł</label>
                <input id="nt-title" type="text" required minLength={5} maxLength={200} value={newThreadForm.title}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, title: e.target.value })}
                  placeholder="np. Szukamy partnera do projektu senioralnego" className="w-full p-2 rounded-lg border border-slate-300" />
              </div>
              <div>
                <label htmlFor="nt-category" className="block font-bold text-slate-800 mb-1">Kategoria</label>
                <select id="nt-category" value={newThreadForm.category}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, category: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300 bg-white">
                  {Object.entries(THREAD_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="nt-author" className="block font-bold text-slate-800 mb-1">Imię / organizacja</label>
                  <input id="nt-author" type="text" required minLength={2} value={newThreadForm.author_name}
                    onChange={(e) => setNewThreadForm({ ...newThreadForm, author_name: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label htmlFor="nt-role" className="block font-bold text-slate-800 mb-1">Rola</label>
                  <select id="nt-role" value={newThreadForm.author_role}
                    onChange={(e) => setNewThreadForm({ ...newThreadForm, author_role: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300 bg-white">
                    {Object.entries(PARTICIPANT_ROLES).filter(([k]) => k !== 'rops_ekspert').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="nt-powiat" className="block font-bold text-slate-800 mb-1">Powiat</label>
                <select id="nt-powiat" value={newThreadForm.powiat}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, powiat: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300 bg-white">
                  {POWIATY.map((p) => <option key={p} value={p}>{powiatLabel(p)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="nt-message" className="block font-bold text-slate-800 mb-1">Wiadomość</label>
                <textarea id="nt-message" rows={3} required minLength={5} maxLength={4000} value={newThreadForm.initial_message}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, initial_message: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
              </div>
              {threadError && <p role="alert" className="text-rose-900 bg-rose-50 border border-rose-200 p-2 rounded-lg">{threadError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setNewThreadModal(false)} className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800">Anuluj</button>
                <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg">Utwórz wątek</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rezerwacja konsultacji */}
      {bookingMentor && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setBookingMentor(null)}>
          <div ref={bookingRef} role="dialog" aria-modal="true" aria-labelledby="booking-title" tabIndex={-1}
            onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 id="booking-title" className="text-lg font-bold text-slate-900">Konsultacja: {bookingMentor.full_name}</h2>
            <p className="text-sm text-slate-600 mb-4">{bookingMentor.specialization} · 60 minut, online lub telefonicznie</p>

            {booking ? (
              <div role="status" className="space-y-3">
                <p className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3 rounded-lg text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                  Zarezerwowano: {formatSlot(booking.slot_start)}. Potwierdzenie wysłaliśmy e-mailem do Ciebie i mentora.
                </p>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => downloadIcs(booking)} className="flex items-center gap-1.5 border border-slate-300 px-3 py-2 rounded-lg text-sm font-bold">
                    <Download className="w-4 h-4" aria-hidden="true" /> Dodaj do kalendarza (.ics)
                  </button>
                  <button type="button" onClick={() => setBookingMentor(null)} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Zamknij</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-3 text-sm">
                <fieldset>
                  <legend className="font-bold text-slate-800 mb-1">Wybierz termin</legend>
                  {slots.length === 0 && <p className="text-slate-600">Brak wolnych terminów w najbliższych 3 tygodniach.</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {slots.map((s) => (
                      <label key={s.start} className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${!s.available ? 'opacity-60 line-through' : bookingForm.slot_start === s.start ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>
                        <input type="radio" name="slot" value={s.start} disabled={!s.available} checked={bookingForm.slot_start === s.start}
                          onChange={() => setBookingForm({ ...bookingForm, slot_start: s.start })} />
                        <span>{formatSlot(s.start)}{!s.available && ' (zajęty)'}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="bk-name" className="block font-bold text-slate-800 mb-1">Imię i nazwisko</label>
                    <input id="bk-name" required minLength={2} autoComplete="name" value={bookingForm.requester_name}
                      onChange={(e) => setBookingForm({ ...bookingForm, requester_name: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
                  </div>
                  <div>
                    <label htmlFor="bk-email" className="block font-bold text-slate-800 mb-1">E-mail</label>
                    <input id="bk-email" type="email" required autoComplete="email" value={bookingForm.requester_email}
                      onChange={(e) => setBookingForm({ ...bookingForm, requester_email: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
                  </div>
                </div>
                <div>
                  <label htmlFor="bk-topic" className="block font-bold text-slate-800 mb-1">Temat konsultacji</label>
                  <textarea id="bk-topic" rows={2} required minLength={5} maxLength={1000} value={bookingForm.topic}
                    onChange={(e) => setBookingForm({ ...bookingForm, topic: e.target.value })} className="w-full p-2 rounded-lg border border-slate-300" />
                </div>
                <label className="flex items-start gap-2">
                  <input type="checkbox" required checked={bookingForm.rodo_consent}
                    onChange={(e) => setBookingForm({ ...bookingForm, rodo_consent: e.target.checked })} className="mt-1" />
                  <span>Zgadzam się na przekazanie moich danych kontaktowych mentorowi w celu organizacji konsultacji (RODO).</span>
                </label>
                {bookingError && <p role="alert" className="text-rose-900 bg-rose-50 border border-rose-200 p-2 rounded-lg">{bookingError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setBookingMentor(null)} className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800">Anuluj</button>
                  <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg">Rezerwuj</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
