// Słowniki domenowe zgodne z backendem (app/core/constants.py)

export const POWIATY: string[] = [
  'bocheński', 'brzeski', 'chrzanowski', 'dąbrowski', 'gorlicki', 'krakowski', 'limanowski', 'miechowski',
  'myślenicki', 'nowosądecki', 'nowotarski', 'olkuski', 'oświęcimski', 'proszowicki', 'suski', 'tarnowski',
  'tatrzański', 'wadowicki', 'wielicki', 'm. Kraków', 'm. Nowy Sącz', 'm. Tarnów'
];

export const powiatLabel = (p: string) => (p.startsWith('m. ') ? `${p.slice(3)} (miasto na prawach powiatu)` : `powiat ${p}`);

// Przykładowa gmina dla każdego powiatu – domyślna wartość w Middleman
export const SAMPLE_GMINA: Record<string, string> = {
  'bocheński': 'Łapanów', 'brzeski': 'Szczurowa', 'chrzanowski': 'Babice', 'dąbrowski': 'Bolesław',
  'gorlicki': 'Uście Gorlickie', 'krakowski': 'Iwanowice', 'limanowski': 'Dobra', 'miechowski': 'Słaboszów',
  'myślenicki': 'Tokarnia', 'nowosądecki': 'Łososina Dolna', 'nowotarski': 'Czarny Dunajec', 'olkuski': 'Klucze',
  'oświęcimski': 'Osiek', 'proszowicki': 'Radziemice', 'suski': 'Zawoja', 'tarnowski': 'Gromnik',
  'tatrzański': 'Bukowina Tatrzańska', 'wadowicki': 'Mucharz', 'wielicki': 'Gdów', 'm. Kraków': 'Kraków',
  'm. Nowy Sącz': 'Nowy Sącz', 'm. Tarnów': 'Tarnów'
};

export const CATEGORIES: { value: string; label: string }[] = [
  { value: 'seniorzy', label: 'Seniorzy' },
  { value: 'uslugi_opiekuncze', label: 'Usługi opiekuńcze' },
  { value: 'dostepnosc', label: 'Dostępność' },
  { value: 'zdrowie_psychiczne', label: 'Zdrowie psychiczne' },
  { value: 'wykluczenie_cyfrowe', label: 'Wykluczenie cyfrowe' },
  { value: 'edukacja', label: 'Edukacja i integracja sensoryczna' },
  { value: 'integracja', label: 'Integracja sąsiedzka' },
  { value: 'usamodzielnienie', label: 'Usamodzielnienie' }
];

const CATEGORY_MAP: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export const categoryLabel = (value?: string | null) =>
  value ? CATEGORY_MAP[value] ?? value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : 'Ogólne';

export const IMPLEMENTATION_STAGES = [
  { value: 'pomysl', label: 'Pomysł (koncepcja)' },
  { value: 'prototyp', label: 'Prototyp / pierwsze testy' },
  { value: 'pilotaz', label: 'Pilotaż w społeczności' },
  { value: 'wdrozenie', label: 'Wdrożenie / skalowanie' }
];

export const AUTHOR_TYPES = [
  { value: 'mieszkaniec', label: 'Mieszkaniec' },
  { value: 'ngo', label: 'Organizacja pozarządowa' },
  { value: 'grupa_nieformalna', label: 'Grupa nieformalna' },
  { value: 'jst', label: 'Samorząd (JST)' },
  { value: 'ekspert', label: 'Ekspert' }
];

export const TESTER_ROLES = [
  { value: 'senior', label: 'Senior / seniorka' },
  { value: 'opiekun', label: 'Opiekun osoby zależnej' },
  { value: 'osoba_z_niepelnosprawnoscia', label: 'Osoba z niepełnosprawnością' },
  { value: 'mlodziez', label: 'Uczeń / młodzież (poniżej 18 lat)' },
  { value: 'pedagog', label: 'Pedagog / psycholog' },
  { value: 'pracownik_ops', label: 'Pracownik OPS/CUS' },
  { value: 'ekspert', label: 'Ekspert / specjalista' },
  { value: 'mieszkaniec', label: 'Mieszkaniec' }
];

export const THREAD_CATEGORIES: Record<string, string> = {
  rops_qa: 'Pytanie do ROPS',
  poszukiwanie_partnera: 'Poszukiwanie partnera',
  konsultacja_mentorska: 'Konsultacja mentorska'
};

export const PARTICIPANT_ROLES: Record<string, string> = {
  mieszkaniec: 'Mieszkaniec',
  ngo: 'Organizacja pozarządowa',
  jst: 'Samorząd (JST)',
  mentor: 'Mentor',
  rops_ekspert: 'Ekspert ROPS'
};

export const FISZKA_STATUSES: Record<string, string> = {
  submitted: 'Złożona',
  in_review: 'W weryfikacji ROPS',
  needs_changes: 'Do uzupełnienia',
  approved: 'Zaakceptowana – mentor przydzielony',
  rejected: 'Odrzucona'
};

export const formatDateTime = (iso: string) =>
  new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

export const formatPLN = (value: number) => `${Math.round(value).toLocaleString('pl-PL')} zł`;
