# Task 12: Frontend – Kreator Pomysłów (Canwa Innowacji) i Asystent Middleman dla JST
## Małopolski Hub Innowacji Społecznych (MHIS)

> **Typ zadania**: Frontend UI & Interactive Forms / GovTech Tools  
> **Waga w wyzwaniu**: Moduł III (+5%) + Moduł VII (+5%) + **Główny wyróżnik wdrożeniowy (20%)**  
> **Szacowany czas realizacji**: 45 minut  
> **Zależności**: Task 05, Task 06, Task 10  
> **Status**: Ready to pick up

---

## 1. Cel Zadania
Zbudowanie dwóch zaawansowanych modułów interaktywnych:
1. **Kreator Pomysłów i Canwa Innowacji (`IdeaCreatorView.tsx` & `SocialInnovationCanvas.tsx`)**:
   - Formularz ciągłego zgłaszania fiszek (24/7).
   - 9-kafelkowa cyfrowa Canwa Innowacji Społecznych z asystentem AI podpowiadającym luki i generującym koncept wizualny.
   - Generator wniosków grantowych na bieżące konkursy ROPS.
2. **Asystent Middleman Innowacji dla JST (`MiddlemanView.tsx`)**:
   - Narzędzie dla wójtów, burmistrzów i dyrektorów CUS/OPS.
   - Generowanie kompletnego Pakietu Wdrożeniowego Usługi (Service Blueprint) wraz z kosztorysem i projektem uchwały rady gminy.

---

## 2. Pliki do Utworzenia / Modyfikacji
- `frontend/src/components/canvas/SocialInnovationCanvas.tsx`
- `frontend/src/views/IdeaCreatorView.tsx`
- `frontend/src/views/MiddlemanView.tsx`

---

## 3. Szczegóły Implementacji

### 3.1. Komponent Canwy Innowacji (`SocialInnovationCanvas.tsx`)
Siatka (Grid 3x3) reprezentująca 9 filarów innowacji:
1. Problem społeczny
2. Grupa docelowa (beneficjenci)
3. Unikalna propozycja wartości
4. Bariery i ryzyka
5. Dostępne zasoby lokalne
6. Partnerzy międzysektorowi
7. Plan testowania prototypu
8. Mierniki i wskaźniki sukcesu
9. Potencjał skalowania w regionie

Poniżej siatki: Przycisk **"Audytuj Canwę z Asystentem AI"**, który wyświetla wynik punktowy (0-100), mocne strony i luki logiczne.

### 3.2. Widok Middlemana Innowacji (`MiddlemanView.tsx`)
Kroki interfejsu dla przedstawiciela samorządu:
1. Wybór innowacji z listy rozwijanej (np. *Mobilny Doradca Seniora*).
2. Uzupełnienie danych gminy (nazwa, powiat małopolski, liczba mieszkańców, szacowany budżet).
3. Generowanie blueprintu z animacją postępu.
4. Prezentacja wyników w czytelnych kartach:
   - Harmonogram wdrożenia (Etapy 1-4)
   - Kosztorys z kalkulacją etatów i źródeł dotacji (Fundusze Europejskie dla Małopolski)
   - Gotowy szablon prawny: *"PROJEKT UCHWAŁY RADY GMINY..."*
   - Przycisk *"Drukuj / Pobierz oficjalny PDF"*.

---

## 4. Kryteria Akceptacji i Weryfikacja
1. Wypełnienie 9 pól Canwy i kliknięcie audytu zwraca ocenę logiczną z podpowiedziami.
2. Wybór innowacji w module Middlemana i kliknięcie "Generuj pakiet dla gminy" generuje dostosowany kosztorys oraz projekt uchwały.
3. Wszystkie formularze są w pełni dostępne z klawiatury (tabindex, focus-ring).
