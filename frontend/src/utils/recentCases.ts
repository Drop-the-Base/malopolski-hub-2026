// „Moje sprawy”: numery ostatnio sprawdzanych zgłoszeń zapamiętane tylko w tej przeglądarce.
// Zapisujemy wyłącznie numery spraw (bez e-maili i innych danych osobowych).

const KEY = 'mhis_my_cases';
const MAX = 10;

export type CaseKind = 'fiszka' | 'problem';

export const caseKind = (id: string): CaseKind | null => {
  const v = id.trim().toLowerCase();
  if (v.startsWith('fiszka-')) return 'fiszka';
  if (v.startsWith('prob-')) return 'problem';
  return null;
};

export const loadRecentCases = (): string[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
};

const save = (ids: string[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
  } catch {
    /* brak dostępu do pamięci przeglądarki – lista działa tylko w tej sesji */
  }
};

export const rememberCase = (id: string): string[] => {
  const clean = id.trim();
  if (!clean || !caseKind(clean)) return loadRecentCases();
  const next = [clean, ...loadRecentCases().filter((x) => x !== clean)].slice(0, MAX);
  save(next);
  return next;
};

export const forgetCase = (id: string): string[] => {
  const next = loadRecentCases().filter((x) => x !== id);
  save(next);
  return next;
};
