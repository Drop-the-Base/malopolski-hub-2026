import { useEffect, useState } from 'react';

/** Teczka porównania (G16): do 3 innowacji zapamiętanych w przeglądarce (localStorage, bez danych osobowych). */
export const COMPARE_MAX = 3;
const KEY = 'mhis_compare_folder';
const EVENT = 'mhis:compare-changed';

export interface CompareEntry {
  id: string;
  title: string;
}

const read = (): CompareEntry[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((e): e is CompareEntry => !!e && typeof e.id === 'string' && typeof e.title === 'string').slice(0, COMPARE_MAX)
      : [];
  } catch {
    return [];
  }
};

let memory: CompareEntry[] | null = null;

const current = () => memory ?? read();

const write = (entries: CompareEntry[]) => {
  memory = entries;
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* brak dostępu do storage – teczka działa do odświeżenia strony */
  }
  window.dispatchEvent(new Event(EVENT));
};

export const compareFolder = {
  list: current,
  has: (id: string) => current().some((e) => e.id === id),
  add: (entry: CompareEntry): boolean => {
    const entries = current();
    if (entries.some((e) => e.id === entry.id)) return true;
    if (entries.length >= COMPARE_MAX) return false;
    write([...entries, entry]);
    return true;
  },
  remove: (id: string) => write(current().filter((e) => e.id !== id)),
  clear: () => write([])
};

/** Aktualna zawartość teczki, odświeżana po zmianie w dowolnym komponencie i w innych kartach przeglądarki. */
export const useCompareFolder = (): CompareEntry[] => {
  const [entries, setEntries] = useState<CompareEntry[]>(current);
  useEffect(() => {
    const sync = () => setEntries(current());
    const fromOtherTab = (e: StorageEvent) => {
      if (e.key === KEY) {
        memory = null;
        sync();
      }
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', fromOtherTab);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', fromOtherTab);
    };
  }, []);
  return entries;
};
