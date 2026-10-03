# Specyfikacja Danych Początkowych (Seed Data Spec)
## Małopolski Hub Innowacji Społecznych – ROPS Kraków

> **Rygor**: 100% syntetycznych danych osobowych (Zero PII), 100% autentyczności kontekstu merytorycznego ROPS Kraków i Województwa Małopolskiego.

---

## 1. Zbiór Sprawdzonych Innowacji Społecznych ROPS (10 Kart)

Każda innowacja w bazie posiada unikalny identyfikator, tagi dziedzinowe, opis merytoryczny, wersję ETR (łatwy język) oraz parametry wdrożeniowe dla samorządów:

| ID | Tytuł Innowacji | Kategoria | Grupa Docelowa | Szacowany Budżet | Dojrzałość |
|---|---|---|---|---|---|
| `rops-inn-001` | **Mobilny Doradca Seniora** | Seniorzy, Wykluczenie transportowe | Seniorzy 65+, osoby z niepełnosprawnościami w gminach wiejskich | 45 000 zł (pojazd + wyposażenie) | Gotowa do skalowania |
| `rops-inn-002` | **Modularna Łazienka Wytchnieniowa** | Dostępność, Niepełnosprawność | Osoby po udarach, seniorzy leżący, opiekunowie | 32 000 zł / moduł tymczasowy | Wdrożona w 3 gminach |
| `rops-inn-003` | **koMIX Życiowy** | Zdrowie psychiczne, Młodzież | Młodzież 13-19 lat, pedagodzy, psycholodzy szkolni | 12 000 zł (pakiety warsztatowe) | Przetestowana, wysoka ocena SUS |
| `rops-inn-004` | **Terapeuta Przestrzeni** | Dostępność architektoniczna | Seniorzy mieszkający samotnie, osoby o ograniczonej mobilności | 18 000 zł (audyty + montaż uchwytów) | Gotowa do skalowania |
| `rops-inn-005` | **Zmysłoteka (Mobilna Sala Doświadczania Świata)** | Edukacja włączająca, Neuroatypowość | Dzieci w spektrum autyzmu, z zaburzeniami SI | 28 000 zł | Gotowa do skalowania |
| `rops-inn-006` | **Spółdzielnia Cyfrowa Senior+** | Wykluczenie cyfrowe | Seniorzy 70+, liderzy cyfrowi | 15 000 zł (sprzęt + cykl spotkań) | Wdrożona w Krakowie i Nowym Sączu |
| `rops-inn-007` | **Przystanek Wytchnienie (Bony Opiekuńcze)** | Usługi opiekuńcze | Główni opiekunowie osób zależnych i chorych na Alzheimera | 50 000 zł / gminę rocznie | W fazie rozszerzonego pilotażu |
| `rops-inn-008` | **Sąsiedzki Dzielnik Żywności i Sadzonek** | Integracja społeczna, Ekologia | Mieszkańcy małych miasteczek, emeryci, rodziny wielodzietne | 8 000 zł | Gotowa do skalowania |
| `rops-inn-009` | **Paszport Samodzielności Młodzieży** | Usamodzielnienie, Piecza zastępcza | Wychowankowie domów dziecka i rodzin zastępczych (17-24 lata) | 22 000 zł / rocznik | Gotowa do skalowania |
| `rops-inn-010` | **Cichy Kącik Urzędowy (Strefa Wyciszenia AAC)** | Dostępność instytucjonalna | Klienci urzędów z nadwrażliwością sensoryczną, osoby z afazją | 14 000 zł | Gotowa do skalowania |

---

## 2. Mapa Wyzwań i Statystyki 22 Powiatów Małopolski

Baza danych zawiera zintegrowany profil każdego powiatu Małopolski, odzwierciedlający rzeczywiste zjawiska demograficzne:

```json
[
  {
    "powiat_code": "PL-1206",
    "powiat_name": "gorlicki",
    "population": 105800,
    "senior_share_pct": 27.8,
    "youth_share_pct": 14.1,
    "demographic_trend": "depopulacja",
    "reported_problems_count": 42,
    "active_innovations_count": 5,
    "key_social_challenge": "Wykluczenie komunikacyjne seniorów i brak wyspecjalizowanej opieki geriatrycznej w sołectwach górskich."
  },
  {
    "powiat_code": "PL-1219",
    "powiat_name": "wielicki",
    "population": 134200,
    "senior_share_pct": 19.2,
    "youth_share_pct": 21.4,
    "demographic_trend": "dynamiczny wzrost (suburbanizacja)",
    "reported_problems_count": 38,
    "active_innovations_count": 7,
    "key_social_challenge": "Niewydolność infrastruktury opiekuńczej i przedszkolnej przy gwałtownym napływie młodych rodzin z Krakowa."
  },
  {
    "powiat_code": "PL-1261",
    "powiat_name": "m. Kraków",
    "population": 804000,
    "senior_share_pct": 25.1,
    "youth_share_pct": 16.8,
    "demographic_trend": "stabilny",
    "reported_problems_count": 128,
    "active_innovations_count": 24,
    "key_social_challenge": "Kryzys zdrowia psychicznego młodzieży akademickiej i szkolnej oraz anonimowość i samotność osób w podeszłym wieku w blokowiskach."
  },
  {
    "powiat_code": "PL-1208",
    "powiat_name": "miechowski",
    "population": 48300,
    "senior_share_pct": 29.4,
    "youth_share_pct": 13.2,
    "demographic_trend": "silna depopulacja",
    "reported_problems_count": 31,
    "active_innovations_count": 3,
    "key_social_challenge": "Wysoki wskaźnik starości demograficznej, gospodarstwa jednoosobowe seniorów i bariery architektoniczne w starym budownictwie."
  },
  {
    "powiat_code": "PL-1212",
    "powiat_name": "oświęcimski",
    "population": 151000,
    "senior_share_pct": 24.6,
    "youth_share_pct": 15.3,
    "demographic_trend": "umiarkowany spadek",
    "reported_problems_count": 56,
    "active_innovations_count": 6,
    "key_social_challenge": "Integracja społeczna osób z niepełnosprawnościami na rynku pracy oraz wsparcie psychologiczne rodzin w kryzysie."
  }
]
```

---

## 3. Przykładowe Zgłoszenia Problemów (Test Cases do Matchmakingu)

1. **Przypadek A (Seniorzy / Transport)**:
   - *Tekst*: *"W naszej wsi w gminie Uście Gorlickie większość mieszkańców to emeryci. Autobus jeździ dwa razy dziennie, brak apteki. Starsi ludzie proszą kierowców busów o przywiezienie leków, a w zimie są odcięci od świata."*
   - *Oczekiwane dopasowanie*: `rops-inn-001` (Mobilny Doradca Seniora) + `rops-inn-007` (Bony Opiekuńcze).
2. **Przypadek B (Młodzież / Depresja)**:
   - *Tekst*: *"W naszym liceum w Nowym Sączu obserwujemy lawinowy wzrost stanów lękowych i wycofania po pandemii. Młodzież boi się rozmawiać z psychologiem, tradycyjne pogadanki wywołują drwiny. Szukamy nieinwazyjnej metody otwarcia rozmowy."*
   - *Oczekiwane dopasowanie*: `rops-inn-003` (koMIX Życiowy).
3. **Przypadek C (Opiekunowie / Wypalenie)**:
   - *Tekst*: *"Córka opiekuje się 84-letnią mamą z zaawansowaną demencją w Tarnowie. Nie spała spokojnie od pół roku, nie ma z kim zostawić mamy na 2 godziny, by pójść na własne badania lekarskie."*
   - *Oczekiwane dopasowanie*: `rops-inn-007` (Przystanek Wytchnienie) + `rops-inn-002` (Modularna Łazienka).

---

## 4. Aktywne Kampanie Testowe (Dla Modułu IV - Tester Innowacji)

```json
[
  {
    "id": "test-camp-001",
    "innovation_id": "rops-inn-003",
    "campaign_name": "Testy podręcznika warsztatowego koMIX Życiowy v2.0",
    "goal_description": "Sprawdzenie czy nowe scenariusze komiksowe są zrozumiałe dla uczniów klas 7-8 szkół podstawowych z małych miast.",
    "tester_profile_needed": "Pedagodzy szkolni, psycholodzy, młodzież 13-15 lat",
    "slots_total": 25,
    "slots_taken": 18,
    "status": "open",
    "deadline": "2026-11-15"
  },
  {
    "id": "test-camp-002",
    "innovation_id": "rops-inn-002",
    "campaign_name": "Test montażu szybkiej łazienki modułowej w gminie wiejskiej",
    "goal_description": "Ewaluacja ergonomii wózków kąpielowych i czasu instalacji przez lokalną ekipę remontową.",
    "tester_profile_needed": "Opiekunowie osób zależnych, pracownicy GOPS",
    "slots_total": 10,
    "slots_taken": 7,
    "status": "open",
    "deadline": "2026-11-30"
  }
]
```
