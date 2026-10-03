# Task 13: Frontend – Panel Administratora, Radar Trendów ROPS, Tester i Komunikacja
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: Frontend UI & Admin Dashboards  
> **Waga w wyzwaniu**: Moduły IV, V, VI (+15% punktów)  
> **Szacowany czas realizacji**: 40 minut  
> **Zależności**: Task 07, Task 08, Task 09, Task 10  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Dostarczenie widoków dla pozostałych modułów platformy:
1. **Tester Innowacji (`TesterView.tsx`)**: Kafelki otwartych naborów na testy prototypów, formularz zgłoszeniowy i ankieta oceny użyteczności SUS.
2. **Platforma Komunikacji (`CommunicationView.tsx`)**: Wątki pytań do ROPS Kraków, giełda partnerstw międzysektorowych oraz wizytówki mentorów.
3. **Panel Administratora i Radar Trendów (`AdminDashboardView.tsx`)**:
   - Wykresy Recharts przedstawiające rozkład zgłoszeń per powiat i kategorię.
   - Alerty dynamicznych trendów społecznych w Małopolsce.
   - Kolejka moderacji nadesłanych fiszek z przyciskami "Zatwierdź do publikacji" / "Odrzuć".

---

## 2. Pliki do Utworzenia / Modyfikacji
- `frontend/src/views/TesterView.tsx`
- `frontend/src/views/CommunicationView.tsx`
- `frontend/src/views/AdminDashboardView.tsx`

---

## 3. Szczegóły Implementacji

### 3.1. Tester Innowacji (`TesterView.tsx`)
- Lista kart aktywnych kampanii testowych (np. `koMIX Życiowy v2.0`, `Szybka Łazienka Modułowa`).
- Pasek postępu zapełnienia miejsc testowych (np. *"Zgłoszono 18 / 25 osób"*).
- Przycisk *"Dołącz do grona testerów"* otwierający modal zgłoszeniowy.
- Przycisk *"Wypełnij ankietę z testu (SUS)"* otwierający kwestionariusz oceny prototypu.

### 3.2. Platforma Komunikacji (`CommunicationView.tsx`)
- Zakładki:
  - **Pytania do ROPS Kraków (Q&A)**
  - **Giełda Partnerstw Międzysektorowych** (np. NGO szuka gminy do projektu)
  - **Baza Mentorów Regionalnych** (zdjęcie, specjalizacja, przycisk *"Zarezerwuj konsultację"*).

### 3.3. Panel Administratora ROPS (`AdminDashboardView.tsx`)
- Metryki KPI na górze: Łącznie zbadanych potrzeb, Aktywnych innowacji w regionie, Fiszki oczekujące na weryfikację.
- Wykres słupkowy / liniowy (Recharts) dynamiki problemów w powiatach (Gorlice, Tarnów, Nowy Sącz, Miechów).
- Tabela moderacji fiszek z akcjami zatwierdzenia.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. W widoku AdminDashboard wyświetlają się interaktywne wykresy Recharts.
2. Kliknięcie "Zatwierdź" w tabeli moderacji zmienia status zgłoszenia.
3. W widoku TesterView można wysłać formularz rejestracji testera.
