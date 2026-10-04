import type { LucideIcon } from 'lucide-react';
import {
  Compass,
  Lightbulb,
  Building2,
  Users,
  ShieldCheck,
  FlaskConical,
  FolderOpen,
  BellRing,
  Database,
  Search,
  Map as MapIcon
} from 'lucide-react';

/** Pojedynczy link nawigacji (wersja zwykła i w prostym języku – ETR). */
export interface NavItem {
  to: string;
  label: string;
  labelEtr: string;
  /** Krótkie wyjaśnienie pod nazwą w rozwijanym menu – pomaga seniorom wybrać właściwą pozycję. */
  hint?: string;
  hintEtr?: string;
  icon: LucideIcon;
}

/** Pozycja najwyższego poziomu: zwykły link albo grupa z rozwijanym menu. */
export type NavEntry =
  | ({ kind: 'link' } & NavItem)
  | { kind: 'group'; id: string; label: string; labelEtr: string; icon: LucideIcon; items: NavItem[] };

/** Główne wezwanie do działania – jedno, wyróżnione w nagłówku. */
export const PRIMARY_CTA: NavItem = {
  to: '/matchmaking',
  label: 'Znajdź rozwiązanie',
  labelEtr: 'Znajdź pomoc',
  icon: Search
};

/** Nawigacja główna: maks. 4 pozycje + wyróżnione wezwanie (backlog G13). */
export const NAV_ENTRIES: NavEntry[] = [
  {
    kind: 'link',
    to: '/baza-wiedzy',
    label: 'Biblioteka i mapa',
    labelEtr: 'Biblioteka i mapa',
    icon: Compass
  },
  {
    kind: 'group',
    id: 'dzialaj',
    label: 'Działaj',
    labelEtr: 'Działaj',
    icon: Lightbulb,
    items: [
      {
        to: '/kreator-pomyslow',
        label: 'Zgłoś pomysł',
        labelEtr: 'Zgłoś pomysł',
        hint: 'Fiszka, Canwa, plakat i szkic wniosku',
        hintEtr: 'Opisz pomysł i wyślij go do ROPS',
        icon: Lightbulb
      },
      {
        to: '/tester',
        label: 'Testuj i oceniaj',
        labelEtr: 'Testuj i oceniaj',
        hint: 'Kampanie testowe i głosowanie na pomysły',
        hintEtr: 'Sprawdź nowe pomysły i powiedz, co myślisz',
        icon: FlaskConical
      },
      {
        to: '/moje-sprawy',
        label: 'Moje sprawy',
        labelEtr: 'Moje sprawy',
        hint: 'Status zgłoszeń i odpowiedzi z ROPS',
        hintEtr: 'Zobacz, co dzieje się z Twoim zgłoszeniem',
        icon: FolderOpen
      },
      {
        to: '/powiadomienia',
        label: 'Powiadomienia o naborach',
        labelEtr: 'Powiadomienia e-mail',
        hint: 'E-mail o nowych naborach i innowacjach',
        hintEtr: 'Dostaniesz e-mail, gdy pojawi się nabór',
        icon: BellRing
      }
    ]
  },
  {
    kind: 'link',
    to: '/dialog',
    label: 'Dialog i mentorzy',
    labelEtr: 'Rozmowa i pomoc',
    icon: Users
  },
  {
    kind: 'group',
    id: 'samorzad',
    label: 'Dla samorządu',
    labelEtr: 'Dla samorządu',
    icon: Building2,
    items: [
      {
        to: '/middleman',
        label: 'Plan wdrożenia dla gminy',
        labelEtr: 'Plan dla gminy',
        hint: 'Kroki, kosztorys i projekt uchwały',
        hintEtr: 'Jak uruchomić pomysł w gminie i ile to kosztuje',
        icon: Building2
      },
      {
        to: '/problemy',
        label: 'Rejestr wyzwań gmin',
        labelEtr: 'Problemy gmin',
        hint: 'Dla urzędników JST – wymaga logowania',
        hintEtr: 'Dla urzędników – trzeba się zalogować',
        icon: MapIcon
      },
      {
        to: '/admin',
        label: 'Panel ROPS',
        labelEtr: 'Dla urzędnika ROPS',
        hint: 'Zgłoszenia, decyzje i trendy – wymaga logowania',
        hintEtr: 'Dla pracowników ROPS – trzeba się zalogować',
        icon: ShieldCheck
      },
      {
        to: '/otwarte-dane',
        label: 'Otwarte dane i API',
        labelEtr: 'Otwarte dane',
        hint: 'Eksport JSON/CSV i webhooki dla systemów gmin',
        hintEtr: 'Dane do pobrania dla gmin i programistów',
        icon: Database
      }
    ]
  }
];

/** Ścieżka → okruszki (nazwa grupy i strony) dla nagłówka „Jesteś tutaj”. */
export function breadcrumbFor(pathname: string, etr: boolean): { group?: string; page: string; pageTo: string } | null {
  if (pathname === '/') return null;
  const pick = (i: { label: string; labelEtr: string }) => (etr ? i.labelEtr : i.label);
  const matches = (to: string) => pathname === to || pathname.startsWith(`${to}/`);
  if (matches(PRIMARY_CTA.to)) return { page: pick(PRIMARY_CTA), pageTo: PRIMARY_CTA.to };
  for (const entry of NAV_ENTRIES) {
    if (entry.kind === 'link') {
      if (matches(entry.to)) return { page: pick(entry), pageTo: entry.to };
    } else {
      const item = entry.items.find((i) => matches(i.to));
      if (item) return { group: pick(entry), page: pick(item), pageTo: item.to };
    }
  }
  if (matches('/status')) return { group: 'Działaj', page: 'Status zgłoszenia', pageTo: '/status' };
  if (matches('/deklaracja-dostepnosci')) return { page: 'Deklaracja dostępności', pageTo: '/deklaracja-dostepnosci' };
  return null;
}

/** Czy ścieżka należy do danej pozycji (link lub dowolny link w grupie). */
export function isEntryActive(entry: NavEntry, pathname: string): boolean {
  const matches = (to: string) => pathname === to || pathname.startsWith(`${to}/`);
  return entry.kind === 'link' ? matches(entry.to) : entry.items.some((i) => matches(i.to));
}

