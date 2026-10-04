import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { useAccessibility } from '../../store/useAccessibilityStore';
import { NAV_ENTRIES, PRIMARY_CTA, NavEntry, NavItem, breadcrumbFor, isEntryActive } from './navConfig';

const pathMatches = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`);

/**
 * Rozwijane menu grupy (wzorzec „disclosure”): przycisk z aria-expanded, lista zwykłych linków.
 * Otwiera się kliknięciem/dotknięciem lub Enter/Spacją (nie najechaniem), Escape zamyka i oddaje fokus przyciskowi,
 * strzałka w dół otwiera i przenosi fokus na pierwszy link, wyjście fokusem poza grupę zamyka menu.
 */
const NavDisclosure: React.FC<{
  entry: Extract<NavEntry, { kind: 'group' }>;
  open: boolean;
  onToggle: (open: boolean) => void;
  etr: boolean;
  pathname: string;
}> = ({ entry, open, onToggle, etr, pathname }) => {
  const panelId = useId();
  const wrapRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const focusFirstOnOpen = useRef(false);
  const active = isEntryActive(entry, pathname);

  useEffect(() => {
    if (open && focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      wrapRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    }
  }, [open]);

  // Kliknięcie/dotknięcie poza grupą zamyka menu
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onToggle(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, onToggle]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      onToggle(false);
      buttonRef.current?.focus();
      return;
    }
    const links = Array.from(wrapRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
    const idx = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        focusFirstOnOpen.current = true;
        onToggle(true);
      } else {
        links[Math.min(idx + 1, links.length - 1)]?.focus();
      }
    } else if (e.key === 'ArrowUp' && open && idx >= 0) {
      e.preventDefault();
      if (idx === 0) buttonRef.current?.focus();
      else links[idx - 1]?.focus();
    }
  };

  return (
    <li
      ref={wrapRef}
      className="relative"
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        if (open && wrapRef.current && !wrapRef.current.contains(e.relatedTarget as Node | null)) onToggle(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(!open)}
        className={`relative flex items-center gap-1.5 px-3 h-[72px] text-[0.95rem] whitespace-nowrap transition-colors ${
          active || open ? 'text-slate-900 font-bold' : 'text-slate-700 font-semibold hover:text-slate-900'
        }`}
      >
        <span>{etr ? entry.labelEtr : entry.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        {active && <span className="absolute left-3 right-3 bottom-0 h-1 bg-amber-400" aria-hidden="true" />}
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 top-full mt-px w-80 bg-white border border-slate-200 rounded-b-xl shadow-lg p-2 z-50"
      >
        <ul>
          {entry.items.map((item) => {
            const Icon = item.icon;
            const current = pathMatches(pathname, item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={current ? 'page' : undefined}
                  onClick={() => onToggle(false)}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border-l-4 ${
                    current ? 'border-amber-400 bg-slate-50' : 'border-transparent hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mt-0.5 text-blue-700 shrink-0" aria-hidden="true" />
                  <span>
                    <span className={`block text-base text-slate-900 ${current ? 'font-bold' : 'font-semibold'}`}>
                      {etr ? item.labelEtr : item.label}
                    </span>
                    {item.hint && (
                      <span className="block text-sm text-slate-600 leading-snug">{etr ? item.hintEtr ?? item.hint : item.hint}</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
};

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const { etrMode } = useAccessibility();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  const label = (i: { label: string; labelEtr: string }) => (etrMode ? i.labelEtr : i.label);
  const ctaActive = pathMatches(pathname, PRIMARY_CTA.to);
  const CtaIcon = PRIMARY_CTA.icon;

  const mobileLink = (item: NavItem, nested = false) => {
    const Icon = item.icon;
    const current = pathMatches(pathname, item.to);
    return (
      <li key={item.to}>
        <Link
          to={item.to}
          aria-current={current ? 'page' : undefined}
          className={`flex items-center gap-2.5 ${nested ? 'pl-6' : 'pl-3'} pr-3 py-3 border-l-4 text-base ${
            current ? 'border-amber-400 bg-slate-50 font-bold text-slate-900' : 'border-transparent text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Icon className="w-5 h-5 text-blue-700 shrink-0" aria-hidden="true" />
          {label(item)}
        </Link>
      </li>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-[72px]">
          {/* Znak: prostokąt w barwie regionu z żółtą belką (jak favicon) */}
          <Link to="/" className="flex items-center gap-3 rounded p-1 -m-1 shrink-0">
            <span className="relative w-10 h-10 rounded bg-blue-600 text-white font-extrabold text-base flex items-start justify-center pt-1.5" aria-hidden="true">
              MH
              <span className="absolute left-1.5 right-1.5 bottom-1.5 h-1 bg-amber-400" />
            </span>
            <span className="leading-tight">
              <span className="block font-extrabold text-slate-900 text-[1.0625rem]">Małopolski Hub</span>
              <span className="block text-sm text-slate-600">
                Innowacji Społecznych <span className="text-slate-500">(prototyp)</span>
              </span>
            </span>
          </Link>

          {/* Nawigacja: 4 pozycje (2 z nich to grupy) + jedno wyróżnione wezwanie do działania */}
          <nav className="hidden lg:flex items-center gap-2" aria-label="Nawigacja główna">
            <ul className="flex items-stretch">
              {NAV_ENTRIES.map((entry) =>
                entry.kind === 'group' ? (
                  <NavDisclosure
                    key={entry.id}
                    entry={entry}
                    etr={etrMode}
                    pathname={pathname}
                    open={openGroup === entry.id}
                    onToggle={(o) => setOpenGroup(o ? entry.id : null)}
                  />
                ) : (
                  <li key={entry.to}>
                    <Link
                      to={entry.to}
                      aria-current={pathMatches(pathname, entry.to) ? 'page' : undefined}
                      className={`relative flex items-center px-3 h-[72px] text-[0.95rem] whitespace-nowrap transition-colors ${
                        pathMatches(pathname, entry.to) ? 'text-slate-900 font-bold' : 'text-slate-700 font-semibold hover:text-slate-900'
                      }`}
                    >
                      {label(entry)}
                      {pathMatches(pathname, entry.to) && (
                        <span className="absolute left-3 right-3 bottom-0 h-1 bg-amber-400" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                )
              )}
            </ul>
            <Link
              to={PRIMARY_CTA.to}
              aria-current={ctaActive ? 'page' : undefined}
              className={`ml-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-bold whitespace-nowrap transition-colors ${
                ctaActive ? 'bg-blue-800 text-white ring-2 ring-amber-400 ring-offset-2' : 'bg-blue-600 text-white hover:bg-blue-800'
              }`}
            >
              <CtaIcon className="w-4 h-4" aria-hidden="true" />
              {label(PRIMARY_CTA)}
            </Link>
          </nav>

          {/* Mobile: wezwanie do działania zawsze widoczne obok przycisku menu */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to={PRIMARY_CTA.to}
              aria-current={ctaActive ? 'page' : undefined}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-800 text-white text-sm font-bold"
            >
              <CtaIcon className="w-4 h-4" aria-hidden="true" />
              {label(PRIMARY_CTA)}
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-slate-100"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              <span>Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobilne: te same grupy co na komputerze, rozpisane jako sekcje (bez zagnieżdżonych rozwijań) */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Nawigacja główna (mobilna)"
          className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 max-h-[calc(100vh-72px)] overflow-y-auto"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setMobileOpen(false);
              menuButtonRef.current?.focus();
            }
          }}
        >
          <Link
            to={PRIMARY_CTA.to}
            aria-current={ctaActive ? 'page' : undefined}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 mb-3 rounded-lg bg-blue-600 hover:bg-blue-800 text-white text-base font-bold"
          >
            <CtaIcon className="w-5 h-5" aria-hidden="true" />
            {label(PRIMARY_CTA)}
          </Link>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {NAV_ENTRIES.map((entry) =>
              entry.kind === 'link' ? (
                mobileLink(entry)
              ) : (
                <li key={entry.id}>
                  <h2 id={`mnav-${entry.id}`} className="px-3 pt-3 pb-1 text-sm font-bold text-slate-600">
                    {label(entry)}
                  </h2>
                  <ul aria-labelledby={`mnav-${entry.id}`}>{entry.items.map((item) => mobileLink(item, true))}</ul>
                </li>
              )
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};

/** „Jesteś tutaj” – okruszki na podstronach (nie na stronie głównej). */
export const Breadcrumbs: React.FC = () => {
  const { pathname } = useLocation();
  const { etrMode } = useAccessibility();
  const crumb = breadcrumbFor(pathname, etrMode);
  if (!crumb) return null;
  const isDeeper = pathname !== crumb.pageTo;
  return (
    <nav aria-label="Jesteś tutaj" className="mb-4 -mt-2 text-sm text-slate-600 print:hidden">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="underline underline-offset-4 hover:text-slate-900">
            Strona główna
          </Link>
        </li>
        {crumb.group && (
          <li className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{crumb.group}</span>
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          {isDeeper ? (
            <Link to={crumb.pageTo} className="underline underline-offset-4 hover:text-slate-900">
              {crumb.page}
            </Link>
          ) : (
            <span aria-current="page" className="font-semibold text-slate-900">
              {crumb.page}
            </span>
          )}
        </li>
      </ol>
    </nav>
  );
};
