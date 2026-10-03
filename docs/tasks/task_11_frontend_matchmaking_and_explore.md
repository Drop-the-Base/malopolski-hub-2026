# Task 11: Frontend – Interfejs Matchmakingu, Baza Innowacji i Interaktywna Mapa Wyzwań
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: Frontend UI & Interactive Data Visualization  
> **Waga w wyzwaniu**: Kluczowa (Moduł I - Obligatoryjny + Moduł II)  
> **Szacowany czas realizacji**: 45 minut  
> **Zależności**: Task 03, Task 04, Task 10  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Stworzenie reprezentacyjnych widoków aplikacji dla mieszkańca i samorządowca:
1. **Widok Matchmakingu (`MatchmakingView.tsx`)**:
   - Przyjazne pole tekstowe wprowadzania problemu w języku potocznym.
   - Szybkie filtry powiatu i kategorii.
   - Karty wyników z procentem dopasowania, 2-zdaniowym uzasadnieniem AI, trybem prostego języka (ETR) oraz bezpośrednim przyciskiem akcji: *"Wdróż w swojej gminie"* lub *"Zgłoś nowy pomysł"*.
2. **Katalog Innowacji Społecznych (`KnowledgeView.tsx`)**:
   - Karty innowacji z filtrami tematycznymi, podglądem wideo i pobieraniem podręcznika.
3. **Interaktywna Mapa Wyzwań Małopolski (`MalopolskaMap.tsx`)**:
   - Wektorowa mapa 22 małopolskich powiatów w SVG z tooltipami demograficznymi po najechaniu i kliknięciu.

---

## 2. Pliki do Utworzenia / Modyfikacji
- `frontend/src/services/api.ts`
- `frontend/src/views/MatchmakingView.tsx`
- `frontend/src/views/KnowledgeView.tsx`
- `frontend/src/components/map/MalopolskaMap.tsx`
- `frontend/src/types/index.ts`

---

## 3. Szczegóły Implementacji

### 3.1. Serwis API (`api.ts`)
Klient Axios / Fetch zintegrowany ze zdefiniowanymi w Task 03 i Task 04 endpointami:
- `searchMatchmaking(query: MatchmakingQuery)`
- `getInnovations(filters?: InnovationFilters)`
- `getRegionalChallenges()`

### 3.2. Widok Matchmakingu (`MatchmakingView.tsx`)
- Formularz z wyraźną etykietą dostępności (`aria-describedby`).
- Sekcja propozycji pytań demonstracyjnych (szybkie kliknięcie: *"Brak transportu dla seniorów w Gorlicach"*, *"Kryzys psychiczny młodzieży w Nowym Sączu"*).
- Stan ładowania z animowanym wskaźnikiem i informacją: *"Sztuczna inteligencja przeszukuje portfolio 200 innowacji ROPS Kraków..."*.
- Sekcja wyników z powiadomieniem `aria-live="polite"`.

### 3.3. Interaktywna Mapa Małopolski (`MalopolskaMap.tsx`)
- Wektorowy komponent SVG renderujący powiaty: gorlicki, tarnowski, nowosądecki, m. Kraków, wielicki, miechowski itd.
- Kolorowanie powiatów wg natężenia wyzwań (odcień błękitu/granatu).
- Po kliknięciu w powiat: panel boczny pokazujący liczbę mieszkańców, % seniorów, główne wyzwanie oraz aktywne innowacje w tym rejonie.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Wpisanie przykładowego problemu i kliknięcie "Szukaj rozwiązań" renderuje karty dopasowanych innowacji.
2. Kliknięcie na mapie powiatu wyświetla jego statystyki.
3. Przełączenie trybu ETR na pasku dostępności natychmiast upraszcza opisy na kartach wyników.
