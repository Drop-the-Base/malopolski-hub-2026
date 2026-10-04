import { CaseMessage } from '../types';

/** Podpis wiadomości w sprawie: autor, koordynator ROPS albo mentor (imię i specjalizacja z bazy mentorów). */
export const caseSenderLabel = (m: CaseMessage, authorLabel: string): string => {
  if (m.sender === 'author') return authorLabel;
  if (m.sender === 'mentor') {
    const name = m.sender_name || 'Mentor';
    return m.sender_role ? `${name}, ${m.sender_role}` : `${name}, mentor`;
  }
  return 'Koordynator ROPS';
};
