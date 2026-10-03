# Zadanie 16: 3-Etapowy Kreator Pomysłów (Stepped Wizard) & Profesjonalny Eksport PDF

## Cel Zadania
Przebudowa zakładki Kreatora Pomysłów z niepowiązanych ze sobą zakładek na spójny, progresywny proces 3-krokowy:
1. **Krok 1: Temat, Krótki Opis i Lokalizacja (Inicjacja)**
2. **Krok 2: Generowanie i Audyt Canwy 3x3 z AI (Groq Fast-Track)**
3. **Krok 3: Wygenerowanie Wniosku Grantowego AI & Profesjonalny Eksport PDF**

---

## Zakres Prac

### 1. Frontend (`frontend/src/`)
- **Przebudowa Widoku** (`views/IdeaCreatorView.tsx`):
  - Wprowadzenie nawigacji krokowej (Stepper: Krok 1 ➔ Krok 2 ➔ Krok 3) z możliwością cofania i płynnego przechodzenia.
  - **Krok 1**: Formularz inicjacyjny (Tytuł pomysłu, 1-3 zdania opisu problemu, powiat i gmina, grupa docelowa, dane wnioskodawcy).
  - **Krok 2**: Automatyczne przeniesienie danych do `api.autofillCanvas` i wygenerowanie 9 pól Canwy Innowacji Społecznej ROPS Kraków. Możliwość edycji każdego pola, audyt luk logicznych oraz prompt wizualizatora.
  - **Krok 3**: Automatyczne zasilenie formularza wniosku grantowego danymi z Canwy i Kroku 1. Wygenerowanie pełnego wniosku grantowego z budżetem (40/35/15/10%), wskaźnikami i metodyką.
  - **Stylowy Szablon Wydruku PDF**:
    - Dedykowany komponent lub widok `@media print` stylizujący wniosek jako oficjalny urzędowy dokument:
      - Nagłówek: *Województwo Małopolskie / Regionalny Ośrodek Polityki Społecznej w Krakowie*.
      - Nadany automatycznie identyfikator wniosku (np. `ROPS/IWS/2026/0481`).
      - Tabele budżetowe, harmonogram, matryca ryzyk, oświadczenie o braku PII.
      - Stopka z miejscem na podpisy wnioskodawcy i datę.

### 2. Backend (`backend/app/`)
- Upewnienie się, że endpoint `/api/v1/grant-applications/generate` precyzyjnie uwzględnia dane z Canwy (wskaźniki, zasoby, partnerzy) przy tworzeniu wniosku.

---

## Kryteria Sukcesu
1. Użytkownik przechodzi logiczną ścieżkę: od 1 zdania opisu, przez Canwę 3x3, aż po kompletny wniosek grantowy.
2. Kliknięcie "Drukuj / Pobierz PDF" generuje sformatowany dokument A4 gotowy do złożenia w naborze ROPS.
