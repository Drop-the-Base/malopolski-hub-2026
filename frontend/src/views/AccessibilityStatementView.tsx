import React from 'react';

export const AccessibilityStatementView: React.FC = () => (
  <article className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-sm text-slate-800 leading-relaxed">
    <h1 className="text-2xl font-black text-slate-900">Deklaracja dostępności (projekt)</h1>
    <p>
      Prototyp „Małopolski Hub Innowacji Społecznych” (HackYeah 2026) jest projektowany zgodnie z ustawą z dnia 4 kwietnia 2019 r.
      o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych oraz standardem WCAG 2.1 na poziomie AA.
      Docelową deklarację opublikuje podmiot prowadzący serwis po audycie.
    </p>

    <h2 className="text-lg font-bold text-slate-900">Stan dostępności</h2>
    <p>Serwis jest <strong>częściowo zgodny</strong> z WCAG 2.1 AA. Nie przeprowadzono jeszcze audytu eksperckiego ani testów z czytnikami ekranu (NVDA, VoiceOver).</p>

    <h2 className="text-lg font-bold text-slate-900">Ułatwienia</h2>
    <ul className="list-disc pl-5 space-y-1">
      <li>link „Przejdź do treści głównej” i widoczny fokus klawiatury,</li>
      <li>dwa tryby wysokiego kontrastu (żółty na czarnym, czarny na białym),</li>
      <li>powiększenie tekstu do 125% i 150%,</li>
      <li>tryb prostego języka (ETR) i streszczenia ETR kart innowacji,</li>
      <li>odczyt treści strony syntezatorem mowy i zgłaszanie problemu głosem,</li>
      <li>etykiety pól formularzy, tytuły stron i okna dialogowe obsługiwane klawiaturą (Escape zamyka okno).</li>
    </ul>

    <h2 className="text-lg font-bold text-slate-900">Znane ograniczenia</h2>
    <ul className="list-disc pl-5 space-y-1">
      <li>wykres w Panelu ROPS nie ma jeszcze pełnej alternatywy tekstowej (tabela danych jest planowana),</li>
      <li>tryb ETR upraszcza nagłówki i wybrane opisy, ale nie wszystkie teksty mają wersję uproszczoną,</li>
      <li>wygenerowane dokumenty PDF (wnioski, uchwały) nie są jeszcze otagowane pod czytniki ekranu.</li>
    </ul>

    <h2 className="text-lg font-bold text-slate-900">Informacje zwrotne</h2>
    <p>
      Problemy z dostępnością prosimy zgłaszać w module „Dialog i Mentorzy” (kategoria „Pytanie do ROPS”).
      W wersji produkcyjnej zostaną tu podane dane kontaktowe koordynatora dostępności i procedura wnioskowo-skargowa.
    </p>
    <p className="text-slate-600">Data sporządzenia projektu deklaracji: 3 października 2026 r.</p>
  </article>
);
