# Ocena trafności Matchmakingu (G3)

Cel: sprawdzić, czy moduł I podpowiada **istniejące innowacje na podstawie słów z opisu** (kryterium walidacji §6
wyzwania) i poprawić ranking tam, gdzie wynik był wyraźnie błędny.

**Metoda.** Świeża baza z seedem (10 innowacji ROPS, 6 wpisów Rejestru Wyzwań), bez klucza LLM (`GROQ_API_KEY=""`,
uzasadnienia z szablonu – ranking nie zależy od LLM). Każde zapytanie wysłane przez `process_matchmaking` tak jak
z formularza (z powiatem). Skrypt: zapytania poniżej + wydruk `match_score`, `matched_needs`, `matched_keywords`.
Data: 2026-10-04.

## Wyniki przed i po strojeniu

| # | Zapytanie (skrót) | Przed strojeniem (top) | Po strojeniu (top) | Ocena |
|---|---|---|---|---|
| 1 | „**Starsi** ludzie w naszej gminie są **samotni**, dzieci wyjechały za granicę, nikt ich nie **odwiedza**…” | 0.57 koMIX Życiowy (komiksy dla młodzieży), 0.51 Zmysłoteka, 0.42 Dzielnik, 0.40 Terapeuta Przestrzeni | **0.70 Terapeuta Przestrzeni** (grupa: osoby samotne, seniorzy 75+), 0.58 Mobilny Doradca Seniora, 0.46 Sąsiedzki Dzielnik, 0.45 Spółdzielnia Cyfrowa Senior+ | było **błędne** → poprawione |
| 2 | „Coraz więcej **nastolatków** w liceum ma **depresję** i myśli **samobójcze**, na wizytę u **psychiatry** **dziecięcego** czeka się pół roku.” | 0.85 koMIX Życiowy, 0.48 Zmysłoteka, 0.38 Paszport Samodzielności | **0.85 koMIX Życiowy** (jedyny wynik) | trafne; usunięte wyniki pasujące tylko grupą „dzieci” |
| 3 | „Emeryci nie umieją korzystać z e-**recepty** ani profilu zaufanego, boją się **oszustów** przez telefon i **internet**.” | 0.95 Spółdzielnia Cyfrowa Senior+, 0.41 Mobilny Doradca Seniora | **0.95 Spółdzielnia Cyfrowa Senior+** | trafne |
| 4 | „Na naszej **wsi** nie ma **autobusu**, ludzie bez **samochodu** nie mogą **dojechać** do **lekarza** ani do **apteki**.” | 0.80 Mobilny Doradca Seniora, 0.45 Zmysłoteka, 0.45 Sąsiedzki Dzielnik | **0.80 Mobilny Doradca Seniora** (bus do odległych wsi) | było częściowo błędne (Zmysłoteka przez „skrzynie transportowe”) → poprawione |
| 5 | „Mama **opiekuje** się dorosłym synem na **wózku** z **niepełnosprawnością**, jest **wyczerpana**, nikt by jej nie **zastąpił**…” | 0.72 Modularna Łazienka Wytchnieniowa, 0.50 Przystanek Wytchnienie | 0.72 Modularna Łazienka Wytchnieniowa, **0.58 Przystanek Wytchnienie – Bony Opiekuńcze** | akceptowalne (patrz uwagi) |
| 6 | „Rodzice dzieci w **spektrum** **autyzmu** skarżą się, że w **urzędzie** gminy jest głośno… przeciążenie **sensoryczne**.” | 0.83 Zmysłoteka, 0.61 Cichy Kącik Urzędowy | 0.79 Zmysłoteka, 0.65 Cichy Kącik Urzędowy (Strefa AAC) | akceptowalne (patrz uwagi) |
| 7 | Kontrolne, spoza katalogu: „Na drodze powiatowej są dziury w asfalcie i brakuje oświetlenia.” | brak dopasowania | **brak dopasowania** (`no_match=true`, propozycja zgłoszenia problemu / pomysłu) | trafne – bez przypadkowych wyników |

Pogrubione słowa w zapytaniach to te, które system teraz zaznacza użytkownikowi jako powód dopasowania
(`highlights` i `matched_keywords`).

## Co poprawiono w rankingu (`backend/app/services/matchmaking_service.py`)

1. **„Starsi” nie było rozpoznawane jako seniorzy** (wyzwalacz `starsz` nie pasował do odmiany „starsi”) – dodany wyzwalacz.
2. **„dzieci wyjechały” w opisie problemu seniora** uruchamiało potrzebę „dzieci i młodzież” i wypychało na górę
   komiksy dla nastolatków. Jeśli w opisie są seniorzy, a młodzież wynika wyłącznie ze słowa „dzieci/dziecko”, pojęcie
   jest pomijane.
3. **Kontekst a potrzeba.** Pojęcia „seniorzy”, „dzieci i młodzież”, „obszary wiejskie”, „niepełnosprawność” mówią,
   *kogo/gdzie* dotyczy problem, a nie *czego brakuje*. Mają teraz wagę 0,6 w pokryciu potrzeb, a innowacja, która
   pasuje tylko kontekstem (nie odpowiada na żadną potrzebę z opisu w głównym zakresie), dostaje ocenę × 0,7. To usuwa
   wyniki typu „Zmysłoteka dla problemu z dojazdem do lekarza, bo też jest dla wsi”.
4. **Samotność ← integracja sąsiedzka.** Innowacje integracyjne odpowiadają na samotność (waga 0,6).
5. **Opieka wytchnieniowa** – nowe wyzwalacze: „wyczerpana”, „wypalenie”, „odpoczynek”, „zastąpić” (bez „zastępcza”,
   które myliło się z pieczą zastępczą).

## Uwagi i ograniczenia

- **#5:** Modularna Łazienka Wytchnieniowa ma w nazwie i grupach docelowych zarówno opiekunów, jak i osoby z
  niepełnosprawnością, więc pokrywa obie potrzeby z opisu. Przystanek Wytchnienie jest drugi z wyraźnym wynikiem 0,58.
  Uznajemy to za poprawne zachowanie słownikowe; lepsze rozróżnienie wymagałoby oznaczenia w katalogu „głównej
  potrzeby” innowacji (np. pole `primary_need` edytowane w Panelu ROPS).
- **#6:** obie innowacje są adekwatne (integracja sensoryczna dzieci w spektrum vs. strefa wyciszenia w urzędzie);
  Zmysłoteka wygrywa podobieństwem słownikowym. Nie stroimy pod jeden przypadek.
- Katalog demonstracyjny ma 10 innowacji, więc oceny są wrażliwe na pojedyncze słowa. Wraz z rozbudową katalogu warto
  dodać zestaw zapytań testowych z oczekiwanym top-1 jako test regresji (zaczątek: `tests/test_matchmaking_keywords.py`).
- Słowa ogólne („brak”, „pomoc”, „korzystać”…) liczą się w podobieństwie TF-IDF, ale nie są pokazywane jako powód
  dopasowania (`GENERIC_STEMS`), żeby uzasadnienie było czytelne.
