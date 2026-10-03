import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CommunicationThreadItem, MentorItem } from '../types';
import {
  Users,
  MessageSquare,
  Sparkles,
  Send,
  UserCheck,
  Calendar,
  Mail,
  Plus
} from 'lucide-react';
import { useAccessibility } from '../store/useAccessibilityStore';

export const CommunicationView: React.FC = () => {
  const { etrMode } = useAccessibility();
  const [threads, setThreads] = useState<CommunicationThreadItem[]>([]);
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [activeTab, setActiveTab] = useState<'threads' | 'mentors'>('threads');
  const [selectedThread, setSelectedThread] = useState<CommunicationThreadItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newThreadModal, setNewThreadModal] = useState(false);

  const [newThreadForm, setNewThreadForm] = useState({
    title: '',
    category: 'poszukiwanie_partnera',
    author_name: '',
    author_role: 'ngo',
    powiat: 'tarnowski',
    initial_message: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [thData, mData] = await Promise.all([
        api.getThreads(),
        api.getMentors()
      ]);
      setThreads(thData);
      setMentors(mData);
      if (thData.length > 0) setSelectedThread(thData[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyText.trim()) return;

    try {
      await api.replyThread(
        selectedThread.id,
        'Przedstawiciel Społeczności',
        'mieszkaniec',
        replyText
      );
      setReplyText('');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Błąd dodawania odpowiedzi.');
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createThread(newThreadForm);
      setNewThreadModal(false);
      loadData();
      alert('Wątek został utworzony!');
    } catch (err) {
      console.error(err);
      alert('Błąd tworzenia wątku.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Nagłówek */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>Moduł V: Platforma Aktywnej Komunikacji i Dialogu</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {etrMode ? 'Rozmowa z Ekspertami i Pomoc' : 'Dialog Międzysektorowy i Baza Mentorów ROPS'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Zintegrowana przestrzeń współpracy: bezpośredni kontakt z koordynatorami ROPS Kraków, giełda partnerstw międzysektorowych (NGO szuka gminy / uczelni) oraz rezerwacja konsultacji u certyfikowanych mentorów.
        </p>

        {/* Zakładki */}
        <div className="flex border-b border-slate-200 mt-6 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('threads')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'threads' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Wątki Dyskusyjne i Partnerstwa ({threads.length})
          </button>
          <button
            onClick={() => setActiveTab('mentors')}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'mentors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Baza Mentorów Regionalnych ({mentors.length})
          </button>
        </div>
      </div>

      {/* Zakładka 1: Wątki Dyskusyjne */}
      {activeTab === 'threads' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Lewa kolumna: lista wątków */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Otwarte tematy</span>
              <button
                onClick={() => setNewThreadModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Nowy Wątek
              </button>
            </div>

            <div className="space-y-2">
              {threads.map((t) => {
                const isSelected = selectedThread?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedThread(t)}
                    className={`bg-white p-4 rounded-xl border cursor-pointer transition-all text-xs ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-100 shadow'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-blue-600 uppercase tracking-wider">{t.category}</span>
                      <span>Pow. {t.powiat}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 line-clamp-2 mb-1">{t.title}</h4>
                    <div className="text-slate-500 flex justify-between items-center text-[11px] mt-2">
                      <span>{t.author_name}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                        {t.messages.length} odp.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prawa kolumna: Szczegóły wybranego wątku */}
          <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between min-h-[450px]">
            {selectedThread ? (
              <div>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Kategoria: {selectedThread.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedThread.title}</h3>
                  <div className="text-xs text-slate-400 mt-1">
                    Autor: <strong>{selectedThread.author_name}</strong> ({selectedThread.author_role}) | Powiat {selectedThread.powiat}
                  </div>
                </div>

                {/* Wiadomości */}
                <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
                  {selectedThread.messages.map((m) => (
                    <div key={m.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{m.sender_name} ({m.sender_role})</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{m.content}</p>
                    </div>
                  ))}
                </div>

                {/* Formularz odpowiedzi */}
                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Wpisz odpowiedź w wątku..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
                  >
                    <Send className="w-3.5 h-3.5" /> Odpowiedz
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">Wybierz wątek z listy</div>
            )}
          </div>
        </div>
      )}

      {/* Zakładka 2: Baza Mentorów */}
      {activeTab === 'mentors' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mentors.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-base mb-3">
                  {m.full_name.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{m.full_name}</h3>
                <span className="text-xs text-blue-600 font-semibold block mb-2">{m.specialization}</span>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{m.bio}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dyżur: {m.available_hours}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>{m.contact_email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nowego Wątku */}
      {newThreadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Utwórz Nowy Wątek Dyskusji</h3>
            <form onSubmit={handleCreateThread} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tytuł wątku:</label>
                <input
                  type="text"
                  required
                  value={newThreadForm.title}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, title: e.target.value })}
                  placeholder="np. Poszukujemy partnera do projektu senioralnego"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategoria:</label>
                <select
                  value={newThreadForm.category}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, category: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="poszukiwanie_partnera">Giełda Partnerstw (NGO / JST)</option>
                  <option value="rops_qa">Pytanie do ekspertów ROPS Kraków</option>
                  <option value="konsultacja_mentorska">Wsparcie metodyczne innowacji</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Twoje imię / organizacja:</label>
                <input
                  type="text"
                  required
                  value={newThreadForm.author_name}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, author_name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Wiadomość początkowa:</label>
                <textarea
                  rows={3}
                  required
                  value={newThreadForm.initial_message}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, initial_message: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewThreadModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded-lg"
                >
                  Utwórz wątek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
