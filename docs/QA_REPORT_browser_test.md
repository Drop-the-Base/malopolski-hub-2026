# QA Report: Małopolski Hub Innowacji Społecznych (HackYeah 2026, ROPS Kraków challenge)

**Tested:** 2026-10-03, ~15:25–15:50 (Warsaw), `http://localhost:3000`, built-in browser (desktop ~785–1366 px, mobile 375 px)
**Method:** Manual walkthrough of every module, direct API probing (`/api/v1/*`), DOM/accessibility checks via JS, a contrast scan, and keyboard navigation.
**Reference:** Challenge brief "Zaprojektuj inteligentne narzędzie wspierające rozwój Małopolskiego Hubu Innowacji Społecznych".

> ⚠️ **The app was redeployed while I was testing.** The JS bundle changed from `index-CL730o6h.js` to `index-Bqz_dFHM.js` and a new module, `/problemy`, appeared. **After the redeploy, Matchmaking (the mandatory module) returns HTTP 500 on every request.** See P0-1. Everything else below was observed on the first build unless marked otherwise.

---

## 0. TL;DR for the team

| # | What | Why it matters for scoring |
|---|------|---------------------------|
| 🔴 1 | **Matchmaking is down after the latest deploy.** The SQLite table `problem_reports` has no `title` column, so every request returns 500, and the UI shows nothing at all. | The mandatory module is worth 10% outright, and "trafność dopasowania" is one of the key judging aspects. |
| 🔴 2 | **Matchmaking quality is not credible.** Gibberish (`asdfgh qwerty zxcv`) scores **68%**, higher than relevant matches (55%). Every "AI justification" is the same template ("…dotykające osoby starsze…"), even for a youth-comics innovation. Results aren't sorted by score. | Judges will type their own queries, so they'll see this within a minute. |
| 🔴 3 | **Every innovation's `video_url` is a Rick Roll** (`youtube.com/watch?v=dQw4w9WgXcQ`). It isn't rendered in the UI yet, but it's in the API and the DB. | If anyone wires up "show video", it's embarrassing in front of a public-sector jury. |
| 🔴 4 | **The admin moderation queue is hardcoded.** Ideas submitted through "Fiszka" never appear in the Panel ROPS. "Zatwierdź/Odrzuć" only changes local state, with no API call. | The brief explicitly asks how the admin is notified of a new idea and how the reply reaches the author. Right now the answer is: they aren't. |
| 🔴 5 | **The "high contrast" mode makes contrast worse.** In yellow-on-black mode the nav links and buttons are cyan `#00FFFF` on white (1.25:1). | Accessibility is worth 20%, and the homepage claims "100% zgodność z WCAG 2.1 AA". |
| 🟠 6 | Most form fields have **no programmatic label** (Canvas ×10, Fiszka ×6, Middleman ×5, Tester, Dialog, Baza search, Problemy). | WCAG 1.3.1 / 4.1.2 failure, and the easiest a11y fix with the biggest payoff. |
| 🟠 7 | Personal data is exposed with no auth: `GET /api/v1/ideas` returns author names and emails, `/api/v1/admin/trends` is public, and there's no RODO consent anywhere. | Covers "bezpieczeństwo danych" and implementation potential (20%). |

---

## 1. Coverage vs. the brief (module checklist)

| Module from brief | Implemented as | Status | Notes |
|---|---|---|---|
| I. Matchmaking społeczny (**obligatory**) | `/matchmaking` + homepage search | 🔴 Broken after deploy; weak before | See §2.1 |
| II. Zasobnik wiedzy | `/baza-wiedzy` (Biblioteka, Mapa, Materiały) | 🟡 Partial | Only 10 innovations (homepage says "200+"), no videos, the "map" is a list of tiles, downloads link to the rops.krakow.pl homepage. Admin-only need-trends live in `/admin`. |
| III. Kreator pomysłów (fiszka, generator wniosków, canvas, AI assistant) | `/kreator-pomyslow` | 🟡 Good demo, shallow logic | The AI autofill really calls an LLM. The audit and grant generator are templates. There's no "etap realizacji" field, even though the brief requires one. |
| IV. Tester innowacji | `/tester` | 🟡 Partial | Registration works but allows overbooking and duplicates. The "SUS" form is a single 0–100 slider, which isn't SUS. |
| V. Platforma aktywnej komunikacji | `/dialog` | 🟡 Partial | Threads and replies work. No identity, no notifications, and no booking even though the page promises "rezerwacja konsultacji". |
| VI. Panel administratora | `/admin` | 🔴 Mostly static | Hardcoded queue, no knowledge CRUD (`POST /knowledge/innovations` returns 405), no reply-to-author. |
| VII. Middleman innowacji (AI) | `/middleman` | 🟡 Template, not AI | Polish grammar bugs in the generated resolution. Only 5 of 10 innovations are selectable, and the deep link breaks for the rest. |
| (extra) Rejestr wyzwań JST | `/problemy` (new) | 🔴 500 on GET and POST | Appeared mid-test. |

Formal deliverables to double-check (not testable in the browser): the PDF deck (≤10 slides) or a video (≤3 min), the UX/UI mockups link, and the **maintenance cost estimate**. The homepage claims "< 100 zł TCO/month"; back it with a breakdown that includes LLM API costs.

---

## 2. Bugs by module

### 2.1 Matchmaking (`/matchmaking`, `POST /api/v1/matchmaking`)

**P0-1. 500 error after the latest deploy (current state)**
- `POST /api/v1/matchmaking {"problem_description":"…"}` returns 500 with:
  `sqlite3.OperationalError: table problem_reports has no column named title`
- Cause: the model gained new columns (`title, gmina, reporter_name, reporter_role, urgency, affected_count, assigned_*`), but the existing SQLite DB wasn't migrated. `create_all()` doesn't alter existing tables.
- UI impact: the search runs and **nothing renders, with no error message**. This includes the homepage hero search, the 4 jury scenario buttons, and `?q=` deep links.
- Fix: delete or recreate the DB file and re-seed (fast), or add Alembic. Before the demo, add a startup self-test that runs one matchmaking query.
- Also: **the error leaks raw SQL and parameters to the client**. Return a generic message and log the details server-side.

**P0-2. Scoring is inverted and uninformative (first build)**
| Query | Top results (score) |
|---|---|
| `asdfgh qwerty zxcv` (nonsense) | Mobilny Doradca 0.68, Łazienka 0.68, koMIX 0.68 |
| `dziury w drodze i brak oświetlenia` (out of scope) | the same three, 0.68 |
| `lonely elderly people in villages` (EN) | the same three, 0.68 |
| `Samotni seniorzy w małych wsiach bez dojazdu` | 4 results, **all exactly 0.55** |
| Jury scenario "Senior w Limanowej (łazienka)" | Cichy Kącik **0.55**, then Mobilny Doradca / Łazienka / koMIX **0.68**. Unsorted, and youth comics show up for an 82-year-old's bathroom. |
| `Stany lękowe i depresja u młodzieży` | koMIX 0.55, **Dzielnik Żywności** 0.55, Paszport 0.55 |

- No-match fallback scores (0.68) are higher than keyword hits (0.55–0.59). Results aren't sorted. There's no relevance threshold, so out-of-scope queries still get 3–4 "matches".
- `why_matched` is one hardcoded sentence for every result: *"…skutecznie niweluje bariery dotykające osoby starsze w środowisku wiejskim i miejskim"*. It even appears under koMIX (teenagers).
- Diacritics aren't normalized: `samotnosc` vs `samotność`.
- Response time is ~25 ms. That's fine, but it shows there's no embedding or LLM step, despite the "Hybrydowy rurociąg wektorowo-leksykalny" / "RAG" copy. Judges with AI backgrounds will ask about this.
- The fast-track bar says "Kojarzenie AI (98%)", but real scores are 55–68%.

**P1. Other matchmaking issues**
- **The PII scrubber is partial.** PESEL, phone, and email are masked, but **first and last names and street addresses are not**: `"Jan Kowalski … ul. Długa 5 Kraków"` passes through unchanged. Yet the UI promises "Żadne dane osobowe nie trafiają do modelu".
- The powiat dropdown has **12 of 22 powiaty** in random order, **defaults to "gorlicki"** (so every query is attributed to Gorlice unless the user changes it), and has no "nie wiem / cała Małopolska" option. Meanwhile the API's `/knowledge/challenges` has all 22.
- The category dropdown is missing `edukacja`, `usługi opiekuńcze`, and `usamodzielnienie`, which do exist in the data.
- The API accepts an unknown powiat (`"xyz"`) and echoes it into the alert: *"W powiecie xyz odnotowano wzrost…"*.
- Grammar: the alert reads *"W powiecie gorlicki"*; it should be *gorlickim*. You need locative forms.
- "Trend alert" is always **+24%**, which is obviously hardcoded.
- `similar_cases_count` is a fixed-looking 11/15/19.
- There's no upper length limit on the query: 35 KB was accepted.
- Raw enum category labels are shown to users: `ZDROWIE_PSYCHICZNE`, `DOSTEPNOSC` (no Polish characters).
- Result cards have **no "details / video / handbook" link**, only "Adaptuj dla Gminy". A resident has no next step. There's also no "nic nie pasuje → zgłoś problem do ROPS / stwórz fiszkę" CTA.
- Homepage example chips only fill the input; they don't run the search. The matchmaking page's scenario buttons do auto-run, so the two behave inconsistently.

### 2.2 Baza wiedzy (`/baza-wiedzy`)
- **The "200+ innowacji" claim on the homepage vs. 10 in the DB.** Either import more of the real Biblioteka Innowacji or change the KPI to "10 (demo), docelowo 200+".
- **All 10 `video_url` values point to a Rick Roll**, and `handbook_url` values are invented `rops.krakow.pl/...pdf` paths that likely 404. Use real ROPS links or leave them empty.
- "Pobierz szablon PDF / poradnik JST / wytyczne ETR" all link to `https://rops.krakow.pl/` (the homepage).
- Search only works on submit, is case- and diacritic-sensitive, and matches substrings only (`samotnosc` returns 0 even though "osoby samotne" exists). **There's no empty-state message**: the grid just disappears.
- The category filter is missing 3 categories (Usługi opiekuńcze, Integracja, Usamodzielnienie).
- **Innovation modal:**
  - no `role="dialog"` / `aria-modal`;
  - focus isn't moved into the modal;
  - **Escape doesn't close it**;
  - the sticky header renders above the overlay (z-index).
  - Content is thin: description + ETR only. No budget, target groups, readiness, video, handbook, contact, or "Adaptuj dla gminy" CTA.
  - No shareable URL (e.g. `/baza-wiedzy/rops-inn-002`).
- The "Mapa Wyzwań" isn't a map; it's a grid of 22 tiles. Color carries the meaning (red = depopulation, blue = growth), which raises a WCAG 1.4.1 concern. A real SVG choropleth of Małopolska would be a big visual win.
- The tabs (Biblioteka / Mapa / Materiały) have no `role="tablist"` / `aria-selected`.
- The search input has no label.

### 2.3 Kreator pomysłów (`/kreator-pomyslow`)
- **Canvas AI autofill works** and calls the LLM (~0.9–1.8 s). Good. However:
  - It **hallucinates institutions**: "Centrum Utrzymania Środowiska", "Gmina Ochrony Pracy i Szkolenia", "Koło Gospodyń Mieszkaniowych". A ROPS jury will spot these. Constrain the prompt with a whitelist of partner types: GOPS/CUS, KGW, OSP, szkoła, parafia, NGO, uczelnia.
  - It uses "SUS > 80" as a satisfaction metric for a café. SUS is a usability scale for systems.
  - The generated title has a stray trailing `"`.
  - The copy says "~1s", but the measured latency was 1.8 s.
- **AI audit**: the canvas got 98/100 with zero logic gaps despite the hallucinated partners. A canvas with `"x"` in every field still gets **50/100**. The strengths list is generic. It's a heuristic, not AI. Either call the LLM or rename it "Automatyczna checklista".
- No visualization image is generated. Only a prompt is offered to copy, while the brief mentions "robi jego wizualizację".
- The canvas isn't saved anywhere (no "Zapisz / wyślij jako fiszkę").
- **Fiszka:**
  - **Missing "etap realizacji"** (required by the brief). The API stores `implementation_stage:"pomysl"` but the UI never asks for it.
  - Powiat is free text; it should be a select.
  - No RODO/consent checkbox, although name and email are collected.
  - Labels aren't associated with inputs.
  - The server accepts an invalid email (`not-an-email`) and an unknown powiat; only the client validates.
  - After submit, the user is promised a mentor contact, but nothing reaches the admin (see §2.7).
- **Grant generator:**
  - Pure string template.
  - Mixes state: the title is a default ("Świetlica Sąsiedzka") while the target group comes from the last fiszka ("Seniorzy po urazach"). It doesn't use the canvas content.
  - No nabór selection and no time-gating, though the brief says it's available only during calls and is tailored per call.
  - Accepts negative or 1e12 budgets.
  - Always claims "Badania i dane ROPS Kraków potwierdzają wysokie zapotrzebowanie".

### 2.4 Middleman JST (`/middleman`)
- **The innovation select only contains 5 of 10 innovations** (001–004, 006). `/middleman?inn=rops-inn-010` (the top Limanowa match) **silently falls back to "Mobilny Doradca Seniora"**.
- The API returns a generic "Innowacja Społeczna ROPS" for valid ID `rops-inn-010` and **200 OK for a nonexistent ID**. It doesn't look the innovation up.
- No input validation: `population: -5`, `senior_percentage: 250` produce a blueprint.
- **Polish grammar in the generated resolution** (very visible to a public-administration jury):
  - "dla **Gmina** Słaboszów", "RADY GMINY **GMINA** SŁABOSZÓW", "na terenie Gminy **Gmina** Słaboszów"
  - "Kierownikowi **Gminny Ośrodek** Pomocy Społecznej"; it should be *Gminnego Ośrodka*.
  - "populacja: **3,800**" uses an English thousands separator; Polish is "3 800".
- §4 of the resolution covers only the start-up cost; the monthly running cost is ignored.
- The legal basis (`Dz. U. z 2024 r. poz. 609`, art. 17 ust. 2 pkt 4 u.p.s.) should be verified against the current consolidated texts. Add a "projekt do weryfikacji przez radcę prawnego" disclaimer.
- "OFICJALNY PAKIET WDROŻENIOWY" wording: it's not official. Use "Projekt pakietu".
- It's marketed as "Asystent AI", but the output is deterministic templates. Either use the LLM to adapt the text, or call it a generator.
- With `?powiat=limanowski` the default gmina stays "Słaboszów", which is in powiat miechowski.
- The CUS checkbox exists, but it's unclear whether it changes anything beyond GOPS vs CUS wording.
- Labels aren't associated (5 fields).

### 2.5 Tester (`/tester`)
- **Overbooking**: a campaign reached **11/10** places and stays "NABÓR OTWARTY". The progress bar shows **110%**.
- **Duplicate registrations** are accepted (same email twice counts 2 slots).
- No success message after "Zapisz się"; the form just closes.
- **The "SUS" form isn't SUS.** Real SUS is 10 Likert items. Here it's a single slider **pre-set to 85**, which biases answers.
- The campaign cards are clickable `<div>`s with no tabindex or role, so they **aren't keyboard accessible** (WCAG 2.1.1).
- A campaign recruits "młodzież 13–15 lat", but there's no parental consent flow, and the role select has no "uczeń/młodzież" option.
- Fields are unlabeled.

### 2.6 Dialog (`/dialog`)
- Replies post as anonymous "Przedstawiciel Społeczności (mieszkaniec)", with no identity or session.
- Output is escaped correctly (XSS payload rendered as text ✅).
- Raw enum labels: `POSZUKIWANIE_PARTNERA`, `(ngo)`.
- Times are shown without dates.
- When you switch to the "Baza Mentorów" tab, the "Nowy wątek" form stays open underneath.
- The mentors list has **no booking or contact action** (the page copy promises "rezerwacja konsultacji"). Mentor emails use `mentor-rops.pl`, a real-looking domain. Prefer `example.org` for demo data.
- There are no notifications: no email, no "nowa odpowiedź" badge, no unread count. For the jury's "szybkość komunikacji" criterion, this is the gap to close.
- No `aria-live` region for new messages.

### 2.7 Panel ROPS (`/admin`)
- **The idea queue is hardcoded in the frontend.** The two real submissions in `GET /api/v1/ideas` (my test entries) are never shown. The "Oczekujące fiszki: 2" counter is static.
- "Zatwierdź/Odrzuć" makes **no API call**, and there's no `PATCH /ideas/{id}` endpoint (404).
- No knowledge management: you can't add or edit innovations, materials, or challenges. The brief requires "szybka aktualizacja danych" and "modyfikowanie, weryfikacja i udostępnianie wiedzy".
- No reply-to-author channel.
- **No authentication.** Anyone can open `/admin` and `GET /api/v1/admin/trends`.
- Trend data bug: `top_problem_category` holds the first word of a sentence ("Zapewnienie", "Aktywizacja", "Transformacja", "Odpływ"), a split bug.
- "Przeanalizowane zgłoszenia: 770 → 771" barely moves after ~15 queries, and "+18.4%" is static.
- The bar chart only labels 5 of 22 powiaty on the axis.

### 2.8 Rejestr wyzwań JST (`/problemy`, new module)
- `GET` and `POST /api/v1/problems` both return **500 Internal Server Error** (same migration issue).
- The UI says "Rejestr Wyzwań (0)" and shows no error after a failed submit. The user thinks it saved.
- The powiat filter lists 7 powiaty; the form uses free text.
- Fields are unlabeled.
- The copy says "Oficjalne narzędzie dla włodarzy"; avoid "oficjalne".

### 2.9 Global / cross-cutting
- **No 404 page**: unknown routes render an empty `<main>` (HTTP 200).
- **`document.title` never changes per route** (WCAG 2.4.2). Every page is titled "Małopolski Hub Innowacji Społecznych | ROPS Kraków".
- The footer reads "**© 2026 Samorząd Województwa Małopolskiego & ROPS Kraków. Wszelkie prawa zastrzeżone.**" A hackathon prototype shouldn't claim the Voivodeship's copyright. Use "Prototyp HackYeah 2026 – koncepcja dla ROPS Kraków".
- At ~785 px width the "Jury Fast-Track" bar takes about 40% of the first screen and pushes the content below the fold. Collapse it by default, or after the first visit.
- On mobile (375 px) there's no hamburger menu. The nav is a horizontally scrolling pill list with a visible scrollbar, and the accessibility toolbar wraps onto 2 rows.
- "A++ (150%)" actually sets the root font to 22 px, which is 137.5%.
- The ETR toggle only swaps the page H1. Body text stays the same.
- The contrast and font buttons have no `aria-pressed` (only ETR does).
- In the standard theme, small 11–12 px grey text fails 4.5:1. Examples: "Termin testów" (2.45:1), "Wymagają weryfikacji merytorycznej" (2.56:1), admin author lines (2.56:1), footer (3.75:1), amber "Zatwierdź"/"Zgłoś się" buttons (3.77:1). Gradient areas weren't measured automatically; verify the hero manually.
- API validation is inconsistent: some endpoints enforce `min_length`, but none enforce enums (powiat, category) or ranges.

### ✅ What works well (keep and showcase)
- A skip link is present, and the **keyboard focus ring is clearly visible** (amber 2.4 px).
- `lang="pl"`, good heading hierarchy, and all icon buttons have names.
- Settings for contrast, font size, and ETR persist in `localStorage`.
- Chat output is escaped (no XSS).
- PESEL, phone, and email masking works.
- Canvas autofill with a real LLM is fast and impressive in a demo.
- Clear module structure that maps 1:1 to the brief (I–VII), plus extras: jury scenarios, auto-tour, ETR summaries per innovation, voice input.
- `/api/v1/health` endpoint, sensible REST structure, 404 handling on `/knowledge/innovations/{id}`.

---

## 3. Fix list in priority order (before judging)

1. **Fix the DB schema** (drop and re-seed, or migrate), then re-run matchmaking, `/problemy`, and fiszka end-to-end. Add a smoke-test script.
2. **Matchmaking scoring**:
   - normalize scores so the no-keyword fallback is below any hit;
   - sort descending and apply a threshold, with an "Nie znaleźliśmy dopasowania – zgłoś problem do ROPS" state;
   - generate `why_matched` per item (an LLM call with the innovation description, or at least template it from matched keywords and target groups);
   - normalize diacritics.
   - If time allows, add real embeddings (e.g. `sentence-transformers` multilingual, precomputed for 10 items).
3. **Replace every `dQw4w9WgXcQ` URL**, and either embed real ROPS videos in the modal or hide the field.
4. **Wire `/admin` to `GET /api/v1/ideas`**, add `PATCH /ideas/{id}` (status + comment to author), and show a toast or badge on new ideas. That directly answers "jak system powiadamia administratora i jak wygląda ścieżka odpowiedzi".
5. **Fix the high-contrast theme** (yellow/white on black everywhere, no cyan on white).
6. Add `<label for>` / `aria-label` to every field (about an hour of work).
7. Modal: add `role="dialog"`, a focus trap, and Escape to close.
8. Fix Middleman grammar (strip a leading "Gmina", decline names, use `toLocaleString('pl-PL')`) and include all 10 innovations.
9. Mask names and addresses in Zero-PII (a simple regex for `ul.`, `al.`, plus spaCy `pl_core_news_sm` NER if available) or soften the claim.
10. Protect `/admin` and `GET /ideas` behind at least a demo login, and add a RODO consent checkbox to forms.
11. Remove unverifiable claims ("100% WCAG", "200+", "98%", "Oficjalny", the © line), or qualify them.

---

## 4. Room for improvement (implementation potential, 20%)
- **Data layer**: SQLite to PostgreSQL + pgvector (one DB for relational and vector search), with Alembic migrations. This would have prevented the current outage.
- **Real RAG**: embed innovations plus ROPS reports and the Mapa Wyzwań, retrieve top-k, then have the LLM rerank and write the justification. Cache embeddings; the cost is negligible for 200 items.
- **Auth and roles**: resident / NGO / JST / expert / ROPS admin (e.g. Keycloak or a simple JWT). Gate admin and PII endpoints.
- **Notifications**: email (SMTP / SendGrid) plus in-app for new fiszka, reply in thread, test-slot confirmation, and new nabór. The brief explicitly asks for automated notifications about new ideas and call changes.
- **Integration**: webhook/REST for the grant database and an export of fiszki to CSV/XLSX for ROPS staff.
- **Content management**: a simple admin CRUD (or a headless CMS like Strapi or Directus) so ROPS staff can update the Biblioteka without developers.
- **Observability**: structured logs, Sentry, and a `/health` that checks DB schema plus LLM availability.
- **Cost model slide**: hosting plus LLM tokens per month at expected volume (e.g. 5k queries × ~1k tokens), plus a maintenance FTE fraction.
- **Accessibility audit**: run axe-core / Lighthouse in CI, and test with NVDA. Publish a "Deklaracja dostępności" page (required for Polish public bodies).

## 5. Nice-to-haves (bonus points for innovation and UX)
- **A real SVG map of Małopolska** (22 powiaty choropleth: senior share, reported needs, innovation coverage, "białe plamy"). Click a powiat to filter innovations. This could be the visual hero of the demo.
- **Video-first innovation cards** (the brief explicitly asks for "ciekawa forma prezentacji, m.in. filmów"): a 30-second clip, an ETR summary, and a "wdrożono w X gminach" badge with a mini map.
- **"Ścieżka mieszkańca" wizard**: 3 big-button steps (Kogo dotyczy? → Gdzie? → Opisz / nagraj), aimed at seniors, with voice input and read-aloud results.
- **Match explanation chips**: highlight which words in the user's text matched which target groups or tags.
- **Status tracker for submitters**: "Twoja fiszka: Złożona → W weryfikacji → Mentor przydzielony" with a public link instead of login.
- **Image generation for the canvas visualizer** (the brief mentions visualizing the innovation object).
- **Grant generator tied to a call config** (open/close dates, criteria, budget limits) that auto-pulls canvas fields and shows a "wniosek kompletny w 78%" checklist.
- **Real SUS (10 items)** with an auto-computed score, an aggregate per campaign, and a comparison chart.
- **Mentor booking** with calendar slots (even a mock) and an `.ics` download.
- **Partnership matchmaking**: an NGO's need ↔ a JST's capability ↔ an expert, reusing the same engine.
- **Print or PDF of the Middleman package with ROPS-style layout** (header, page numbers), DOCX export of the resolution draft.
- **Multilingual (UA/EN)**, given the Ukrainian refugee population in the region.
- **Offline-tolerant PWA** for field social workers in areas with poor coverage (the canvas already mentions "brak zasięgu w dolinach").

---

## 6. Test data I created (clean up before the demo)
- `POST /api/v1/ideas` ×2: "TEST-QA Sąsiedzka Wypożyczalnia Balkoników", "QA-TEST \<b\>x\</b\>"
- `POST /api/v1/testing/register`: test-camp-001 +1, **test-camp-002 +4 (now 11/10)**
- Dialog thread-001: one reply starting "QA-TEST odpowiedź …"
- Several `grant-applications/generate` and `middleman/adapt` calls (may be persisted)
- Browser localStorage keys `mhis_contrast` / `mhis_font` / `mhis_etr` (reset to standard)

Re-seeding the DB (which also fixes P0-1) will clear all of the above.
