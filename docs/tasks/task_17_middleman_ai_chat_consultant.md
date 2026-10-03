# Zadanie 17: Czat AI z Kontekstem Inicjatywy w Module Middlemana JST (Doradca Samorządowy)

## Cel Zadania
Rozszerzenie modułu adaptacji innowacji dla samorządów (Middleman JST) o **Wirtualnego Doradcę Samorządowego AI**. Samorządowiec (Wójt, Burmistrz, Kierownik CUS lub GOPS) może na żywo zadać dowolne pytanie dotyczące wdrożenia wybranej innowacji, a model AI odpowiada z pełnym uwzględnieniem specyfiki gminy (populacja, odsetek seniorów, budżet, CUS) oraz wygenerowanego Service Blueprintu i projektu uchwały.

---

## Zakres Prac

### 1. Backend (`backend/app/`)
- **Schemat Zapytania i Odpowiedzi** (`schemas/chat_schema.py`):
  - `MiddlemanChatRequest`: wiadomość użytkownika, historia rozmowy, metadane gminy (nazwa, powiat, populacja, seniorzy, has_cus), wybrana innowacja, podsumowanie blueprintu.
  - `MiddlemanChatResponse`: odpowiedź doradcy, latency_ms.
- **Endpoint API** (`api/v1/middleman.py`):
  - `POST /api/v1/middleman/chat`
- **Integracja Groq** (`services/groq_client.py`):
  - System prompt: Doświadczony radca prawny i ekspert ds. polityki społecznej ROPS Kraków doradzający wójtom i radom gmin.
  - Precyzyjne odniesienia do Ustawy o pomocy społecznej, Ustawy o realizowaniu usług społecznych przez centrum usług społecznych (CUS) oraz programu Fundusze Europejskie dla Małopolski 2021-2027.

### 2. Frontend (`frontend/src/`)
- **Komponent Czatu w Widoku Middlemana** (`views/MiddlemanView.tsx`):
  - Dedykowany, estetyczny panel czatu umieszczony obok / pod Service Blueprintem.
  - Szybkie podpowiedzi pytań (Chips):
    - *"Jakie kwalifikacje musi posiadać koordynator w CUS?"*
    - *"Jak pozyskać dofinansowanie 85% z FEM 2021-2027?"*
    - *"Jak przekonać radnych do podjęcia uchwały?"*
    - *"Czy możemy zlecić usługę lokalnej spółdzielni socjalnej?"*
  - Wskaźnik pisania (Typing indicator), bąbelki czatu i zachowanie historii sesji.

---

## Kryteria Sukcesu
1. Czat odpowiada w czasie poniżej 1.5 sekundy za pośrednictwem Groq API.
2. Odpowiedzi zawierają konkretne dane liczbowe i organizacyjne odnoszące się do wybranej gminy.
3. W przypadku braku połączenia sieciowego czat posiada gotowe odpowiedzi rezerwowe.
