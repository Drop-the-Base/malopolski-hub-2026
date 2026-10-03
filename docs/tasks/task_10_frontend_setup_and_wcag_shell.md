# Task 10: Frontend Setup, Szkielet Aplikacji i Pasek Dostępności WCAG 2.1 AA
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: Frontend Core & Accessibility Engineering  
> **Waga w wyzwaniu**: **20% oceny sędziów (Dostępność i intuicyjność)**  
> **Szacowany czas realizacji**: 40 minut  
> **Zależności**: Task 01  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Konfiguracja nowoczesnej, dostępnej aplikacji React 18 z TypeScriptem i Tailwind CSS, zawierającej wzorcowy **Pasek Dostępności WCAG 2.1 AA** (wysoki kontrast, powiększanie tekstu, tryb prostego języka ETR), nawigację główną, stopkę oraz routing między wszystkimi modułami wyzwania.

---

## 2. Pliki do Utworzenia / Modyfikacji
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/tailwind.config.js`
- `frontend/src/index.css`
- `frontend/src/store/useAccessibilityStore.ts`
- `frontend/src/components/accessibility/AccessibilityBar.tsx`
- `frontend/src/components/layout/Navbar.tsx`
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`

---

## 3. Szczegóły Implementacji

### 3.1. Store Dostępności (`useAccessibilityStore.ts`)
Zarządzanie stanem ułatwień dostępowych (Zustand):
```typescript
interface AccessibilityState {
  contrastMode: 'default' | 'yellow-black' | 'black-white';
  fontSize: 'normal' | 'large' | 'huge'; // 100%, 125%, 150%
  etrMode: boolean; // Easy-to-Read (Prosty Język)
  setContrastMode: (mode: 'default' | 'yellow-black' | 'black-white') => void;
  setFontSize: (size: 'normal' | 'large' | 'huge') => void;
  toggleEtrMode: () => void;
}
```

### 3.2. Pasek Dostępności (`AccessibilityBar.tsx`)
Komponent umieszczony na samej górze ekranu:
- Przycisk **"Tekst Łatwy (ETR)"** z ikoną książki i piktogramu.
- Przełącznik kontrastu: Standardowy / Kontrast Żółty / Kontrast Czarno-Biały.
- Przyciski rozmiaru czcionki: **A** (100%), **A+** (125%), **A++** (150%).
- Przycisk **"Odsłuchaj stronę"** wykorzystujący standardowy syntezator przeglądarki `window.speechSynthesis`.

### 3.3. Stylowanie Tailwind (`index.css` & `tailwind.config.js`)
- Klasy dla trybu żółto-czarnego:
  ```css
  body.theme-yellow-black {
    background-color: #000000 !important;
    color: #ffff00 !important;
  }
  body.theme-yellow-black a, 
  body.theme-yellow-black button {
    color: #00ffff !important;
    border-color: #ffff00 !important;
  }
  ```
- Klasy dla powiększenia:
  ```css
  html.font-large { font-size: 20px; }
  html.font-huge { font-size: 24px; }
  ```
- Focus outline:
  ```css
  :focus-visible {
    outline: 3px solid #f59e0b !important;
    outline-offset: 2px !important;
  }
  ```

### 3.4. Główna Nawigacja (`Navbar.tsx`)
- Logo ROPS Kraków i Małopolski Hub Innowacji Społecznych.
- Linki nawigacyjne do wszystkich modułów:
  - Matchmaking (Kojarzenie potrzeb)
  - Baza Innowacji & Mapa Wyzwań
  - Kreator Pomysłów (Canwa)
  - Tester Innowacji
  - Dialog & Mentorzy
  - Middleman JST (Asystent Samorządu)
  - Panel ROPS

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Uruchomienie aplikacji:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Kliknięcie przycisku "Wysoki Kontrast" natychmiast zmienia tło na czarne z żółtymi tekstami.
3. Kliknięcie A+ / A++ powiększa tekst w całym interfejsie.
4. Przejście klawiszem Tab podświetla kolejne linki wyraźną żółtą ramką.
