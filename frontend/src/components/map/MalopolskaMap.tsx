import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { RegionalChallenge } from '../../types';
import { useAccessibility } from '../../store/useAccessibilityStore';
import { powiatLabel } from '../../constants/domain';

/**
 * Mapa Wyzwań Społecznych – heksagonalny kartogram 22 powiatów Małopolski (19 ziemskich + 3 miasta na prawach powiatu).
 * Układ jest schematyczny: każdy powiat ma jedno pole w przybliżeniu w swoim położeniu geograficznym.
 * Dostępność: pola są przyciskami (Tab + strzałki, Enter/Spacja), etykiety zawierają wartość wskaźnika,
 * legenda i wartość w polu nie opierają się wyłącznie na kolorze, pod mapą jest tabela z danymi.
 */

interface MapProps {
  challenges: RegionalChallenge[];
  onSelectPowiat?: (powiatName: string) => void;
  /** Przejście do Biblioteki z filtrem „sprawdzone w powiecie” */
  onShowInnovations?: (powiatName: string) => void;
}

// [kolumna, wiersz] – wiersze nieparzyste są przesunięte o pół pola (siatka „odd-r”)
const LAYOUT: Record<string, [number, number]> = {
  olkuski: [1, 0],
  miechowski: [2, 0],
  chrzanowski: [0.5, 1],
  krakowski: [1.5, 1],
  proszowicki: [2.5, 1],
  dąbrowski: [4.5, 1],
  oświęcimski: [0, 2],
  'm. Kraków': [1, 2],
  wielicki: [2, 2],
  bocheński: [3, 2],
  brzeski: [4, 2],
  tarnowski: [5, 2],
  'm. Tarnów': [6, 2],
  wadowicki: [0.5, 3],
  myślenicki: [1.5, 3],
  limanowski: [2.5, 3],
  nowosądecki: [3.5, 3],
  'm. Nowy Sącz': [4.5, 3],
  gorlicki: [5.5, 3],
  suski: [1, 4],
  nowotarski: [2, 4],
  tatrzański: [1.5, 5]
};

const R = 48; // promień heksu
const HEX_W = Math.sqrt(3) * R;
const PAD = 14;
const VIEW_W = Math.round(PAD * 2 + HEX_W * 7);
const VIEW_H = Math.round(PAD * 2 + R * 9.5);

const center = (col: number, row: number) => ({ x: PAD + HEX_W * (col + 0.5), y: PAD + R + row * 1.5 * R });

const hexPoints = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

const fmt = (v: number, digits = 1) => v.toLocaleString('pl-PL', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

const shortName = (name: string) => (name.startsWith('m. ') ? name.slice(3) : name);

// Trend demograficzny jako skala porządkowa (od silnego spadku do dynamicznego wzrostu)
const TRENDS: { key: string; score: number; label: string; mark: string }[] = [
  { key: 'silna depopulacja', score: -3, label: 'Silny spadek liczby mieszkańców', mark: '▼▼▼' },
  { key: 'depopulacja', score: -2, label: 'Spadek liczby mieszkańców', mark: '▼▼' },
  { key: 'umiarkowany spadek', score: -1, label: 'Lekki spadek', mark: '▼' },
  { key: 'stabilny', score: 0, label: 'Bez większych zmian', mark: '=' },
  { key: 'wzrost umiarkowany', score: 1, label: 'Lekki wzrost', mark: '▲' },
  { key: 'dynamiczny wzrost', score: 2, label: 'Szybki wzrost liczby mieszkańców', mark: '▲▲' }
];
const trendOf = (t: string) => TRENDS.find((x) => x.key === t.trim().toLowerCase()) ?? TRENDS[3];

// Skala sekwencyjna na Niebieskim Małopolski; tekst w polu dobrany do kontrastu ≥ 4,5:1
const SEQ_FILL = ['#EEF4FB', '#C9DAF0', '#8FB2DE', '#2F6CB5', '#06336E'];
const SEQ_TEXT = ['#17233A', '#17233A', '#17233A', '#FFFFFF', '#FFFFFF'];
const TREND_FILL: Record<number, string> = { [-3]: '#9E1B2F', [-2]: '#E08A96', [-1]: '#F6D3D8', 0: '#ECEEEA', 1: '#C7E1D1', 2: '#2F6B4F' };
const TREND_TEXT: Record<number, string> = { [-3]: '#FFFFFF', [-2]: '#17233A', [-1]: '#17233A', 0: '#17233A', 1: '#17233A', 2: '#FFFFFF' };

type IndicatorId = 'seniorzy' | 'mlodziez' | 'potrzeby' | 'innowacje' | 'trend';

interface Indicator {
  id: IndicatorId;
  label: string;
  etrLabel: string;
  hint: string;
  value: (c: RegionalChallenge) => number;
  format: (v: number) => string;
  /** true: wyższa wartość = większe wyzwanie (do opisu miejsca w rankingu) */
  higherIsHarder: boolean;
}

const INDICATORS: Indicator[] = [
  {
    id: 'seniorzy',
    label: 'Udział seniorów',
    etrLabel: 'Ilu jest seniorów',
    hint: 'Odsetek mieszkańców w wieku senioralnym.',
    value: (c) => c.senior_share_pct,
    format: (v) => `${fmt(v)}%`,
    higherIsHarder: true
  },
  {
    id: 'mlodziez',
    label: 'Udział dzieci i młodzieży',
    etrLabel: 'Ilu jest młodych',
    hint: 'Odsetek dzieci i młodzieży wśród mieszkańców.',
    value: (c) => c.youth_share_pct,
    format: (v) => `${fmt(v)}%`,
    higherIsHarder: false
  },
  {
    id: 'potrzeby',
    label: 'Zgłoszone potrzeby',
    etrLabel: 'Ile jest zgłoszeń',
    hint: 'Liczba zgłoszonych potrzeb mieszkańców na 10 tys. osób (żeby duże i małe powiaty dało się porównać).',
    value: (c) => (c.population ? (c.reported_problems_count / c.population) * 10000 : 0),
    format: (v) => fmt(v),
    higherIsHarder: true
  },
  {
    id: 'innowacje',
    label: 'Działające innowacje',
    etrLabel: 'Ile jest pomocy',
    hint: 'Liczba działających innowacji na 100 tys. mieszkańców. Niska wartość = mniej sprawdzonych rozwiązań na miejscu.',
    value: (c) => (c.population ? (c.active_innovations_count / c.population) * 100000 : 0),
    format: (v) => fmt(v),
    higherIsHarder: false
  },
  {
    id: 'trend',
    label: 'Zmiana liczby mieszkańców',
    etrLabel: 'Czy ludzi przybywa',
    hint: 'Trend demograficzny: czy mieszkańców ubywa, czy przybywa.',
    value: (c) => trendOf(c.demographic_trend).score,
    format: (v) => TRENDS.find((t) => t.score === v)?.mark ?? '=',
    higherIsHarder: false
  }
];

const CLASSES = 5;

export const MalopolskaMap: React.FC<MapProps> = ({ challenges, onSelectPowiat, onShowInnovations }) => {
  const { etrMode, contrastMode } = useAccessibility();
  const highContrast = contrastMode !== 'default';
  const hcFg = contrastMode === 'yellow-black' ? '#FFFF00' : '#000000';
  const hcBg = contrastMode === 'yellow-black' ? '#000000' : '#FFFFFF';

  const [indicatorId, setIndicatorId] = useState<IndicatorId>('seniorzy');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [focusedCode, setFocusedCode] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const hexRefs = useRef<Record<string, SVGGElement | null>>({});
  const detailsRef = useRef<HTMLHeadingElement>(null);

  const indicator = INDICATORS.find((i) => i.id === indicatorId)!;

  // Domyślny wybór po wczytaniu danych (powiat gorlicki – najwyższe zapotrzebowanie w danych demo)
  useEffect(() => {
    if (!selectedCode && challenges.length) {
      setSelectedCode((challenges.find((c) => c.powiat_name === 'gorlicki') ?? challenges[0]).powiat_code);
    }
  }, [challenges, selectedCode]);

  const placed = useMemo(
    () =>
      challenges
        .filter((c) => LAYOUT[c.powiat_name])
        .map((c) => {
          const [col, row] = LAYOUT[c.powiat_name];
          return { item: c, ...center(col, row) };
        }),
    [challenges]
  );

  // Przedziały równej szerokości między min a max – legenda pokazuje zakresy, nie tylko kolory
  const scale = useMemo(() => {
    const values = challenges.map(indicator.value);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    const step = (max - min) / CLASSES || 1;
    const classOf = (v: number) => Math.min(CLASSES - 1, Math.max(0, Math.floor((v - min) / step)));
    const ranges = Array.from({ length: CLASSES }, (_, i) => ({ from: min + i * step, to: min + (i + 1) * step }));
    return { classOf, ranges };
  }, [challenges, indicator]);

  const ranked = useMemo(
    () => [...challenges].sort((a, b) => indicator.value(b) - indicator.value(a)),
    [challenges, indicator]
  );

  const colorsFor = (c: RegionalChallenge) => {
    if (indicator.id === 'trend') {
      const s = trendOf(c.demographic_trend).score;
      return { fill: TREND_FILL[s], text: TREND_TEXT[s] };
    }
    const k = scale.classOf(indicator.value(c));
    return { fill: SEQ_FILL[k], text: SEQ_TEXT[k] };
  };

  const ariaFor = (c: RegionalChallenge) => {
    const v = indicator.value(c);
    const valueText =
      indicator.id === 'trend' ? trendOf(c.demographic_trend).label.toLowerCase() : indicator.format(v);
    return `${powiatLabel(c.powiat_name)}: ${indicator.label.toLowerCase()} ${valueText}`;
  };

  const selected = challenges.find((c) => c.powiat_code === selectedCode) ?? null;

  const select = (c: RegionalChallenge, moveToDetails = false) => {
    setSelectedCode(c.powiat_code);
    setAnnouncement(`Wybrano: ${powiatLabel(c.powiat_name)}. Szczegóły obok mapy.`);
    onSelectPowiat?.(c.powiat_name);
    if (moveToDetails) detailsRef.current?.focus();
  };

  // Strzałki przenoszą fokus do najbliższego pola w danym kierunku
  const onHexKeyDown = (e: React.KeyboardEvent, from: (typeof placed)[number]) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(from.item);
      return;
    }
    const dirs: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1]
    };
    const d = dirs[e.key];
    if (!d) return;
    e.preventDefault();
    let best: (typeof placed)[number] | null = null;
    let bestScore = Infinity;
    for (const p of placed) {
      if (p === from) continue;
      const dx = p.x - from.x;
      const dy = p.y - from.y;
      const along = dx * d[0] + dy * d[1];
      if (along <= 1) continue;
      const across = Math.abs(dx * d[1] - dy * d[0]);
      const score = along + across * 2;
      if (score < bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (best) hexRefs.current[best.item.powiat_code]?.focus();
  };

  const tabStop = selectedCode ?? placed[0]?.item.powiat_code;
  const rank = selected ? ranked.findIndex((c) => c.powiat_code === selected.powiat_code) + 1 : 0;

  const legendItems =
    indicator.id === 'trend'
      ? TRENDS.map((t) => ({ key: t.key, fill: TREND_FILL[t.score], text: TREND_TEXT[t.score], mark: t.mark, label: t.label }))
      : scale.ranges.map((r, i) => ({
          key: String(i),
          fill: SEQ_FILL[i],
          text: SEQ_TEXT[i],
          mark: '',
          label: `${indicator.format(r.from)} – ${indicator.format(r.to)}`
        }));

  if (!challenges.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-600" role="status">
        Wczytywanie mapy wyzwań…
      </div>
    );
  }

  return (
    <section aria-labelledby="map-title" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="mb-5">
        <h2 id="map-title" className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" aria-hidden="true" />
          {etrMode ? 'Mapa wyzwań: jak żyje się w powiatach Małopolski' : 'Mapa Wyzwań Społecznych Małopolski'}
        </h2>
        <p className="mt-1 text-sm text-slate-600 max-w-prose">
          {etrMode
            ? 'Wybierz, co chcesz zobaczyć. Potem kliknij swój powiat. Ciemniejszy kolor znaczy więcej.'
            : '22 powiaty (19 ziemskich i 3 miasta na prawach powiatu) w układzie schematycznym. Wybierz wskaźnik, a potem powiat, aby zobaczyć diagnozę i dopasowane rozwiązania.'}
        </p>
      </div>

      {/* Wybór wskaźnika */}
      <fieldset className="mb-5">
        <legend className="text-sm font-bold text-slate-900 mb-2">{etrMode ? 'Co pokazać na mapie?' : 'Wskaźnik na mapie'}</legend>
        <div className="flex flex-wrap gap-2">
          {INDICATORS.map((ind) => {
            const checked = ind.id === indicatorId;
            return (
              <label
                key={ind.id}
                className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-amber-400 ${
                  checked ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="map-indicator"
                  value={ind.id}
                  checked={checked}
                  onChange={() => setIndicatorId(ind.id)}
                  className="w-4 h-4 accent-amber-400"
                />
                {etrMode ? ind.etrLabel : ind.label}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-slate-600">{indicator.hint}</p>
      </fieldset>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kartogram */}
        <div className="lg:col-span-7">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="block w-full min-w-[30rem] h-auto"
              role="group"
              aria-labelledby="map-svg-title"
              aria-describedby="map-svg-help"
            >
              <title id="map-svg-title">{`Mapa powiatów Małopolski – ${indicator.label.toLowerCase()}`}</title>
              {placed.map((p) => {
                const c = p.item;
                const isSelected = c.powiat_code === selectedCode;
                const isCity = c.powiat_name.startsWith('m. ');
                const colors = highContrast
                  ? { fill: isSelected ? hcFg : hcBg, text: isSelected ? hcBg : hcFg }
                  : colorsFor(c);
                const name = shortName(c.powiat_name);
                const nameSize = name.length > 10 ? 12 : 13.5;
                return (
                  <g
                    key={c.powiat_code}
                    ref={(el) => {
                      hexRefs.current[c.powiat_code] = el;
                    }}
                    role="button"
                    tabIndex={c.powiat_code === tabStop ? 0 : -1}
                    aria-pressed={isSelected}
                    aria-label={ariaFor(c)}
                    className="map-hex cursor-pointer"
                    onClick={() => select(c)}
                    onKeyDown={(e) => onHexKeyDown(e, p)}
                    onFocus={() => setFocusedCode(c.powiat_code)}
                    onBlur={() => setFocusedCode((cur) => (cur === c.powiat_code ? null : cur))}
                  >
                    <polygon
                      points={hexPoints(p.x, p.y, R - 1.5)}
                      fill={colors.fill}
                      stroke={highContrast ? hcFg : '#FFFFFF'}
                      strokeWidth={highContrast ? 2 : 3}
                    />
                    {isCity && (
                      <polygon
                        points={hexPoints(p.x, p.y, R - 8)}
                        fill="none"
                        stroke={colors.text}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        aria-hidden="true"
                      />
                    )}
                    <text
                      x={p.x}
                      y={p.y - 4}
                      textAnchor="middle"
                      fontSize={nameSize}
                      fontWeight={700}
                      fill={colors.text}
                      stroke="none"
                      aria-hidden="true"
                    >
                      {name}
                    </text>
                    <text
                      x={p.x}
                      y={p.y + 16}
                      textAnchor="middle"
                      fontSize={15}
                      fontWeight={800}
                      fill={colors.text}
                      stroke="none"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                      aria-hidden="true"
                    >
                      {indicator.format(indicator.value(c))}
                    </text>
                  </g>
                );
              })}

              {/* Obrys wybranego pola i pierścień fokusu rysowane na wierzchu, żeby sąsiednie pola ich nie zasłaniały */}
              {placed
                .filter((p) => p.item.powiat_code === selectedCode)
                .map((p) => (
                  <polygon
                    key="sel"
                    points={hexPoints(p.x, p.y, R - 2.5)}
                    fill="none"
                    stroke={highContrast ? hcFg : '#17233A'}
                    strokeWidth={4}
                    pointerEvents="none"
                    aria-hidden="true"
                  />
                ))}
              {placed
                .filter((p) => p.item.powiat_code === focusedCode)
                .map((p) => (
                  <g key="focus" pointerEvents="none" aria-hidden="true">
                    <polygon points={hexPoints(p.x, p.y, R + 2)} fill="none" stroke={highContrast ? hcBg : '#FFD100'} strokeWidth={7} />
                    <polygon points={hexPoints(p.x, p.y, R + 2)} fill="none" stroke={highContrast ? hcFg : '#17233A'} strokeWidth={3} />
                  </g>
                ))}
            </svg>
          </div>
          <p id="map-svg-help" className="mt-2 text-sm text-slate-600">
            {etrMode
              ? 'Kliknij powiat. Możesz też użyć klawisza Tab i strzałek, a potem Enter.'
              : 'Kliknij powiat albo przejdź do mapy klawiszem Tab, poruszaj się strzałkami i wybierz Enterem.'}
          </p>

          {/* Legenda */}
          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Legenda: {indicator.label.toLowerCase()}
              {indicator.id === 'potrzeby' && ' (na 10 tys. mieszkańców)'}
              {indicator.id === 'innowacje' && ' (na 100 tys. mieszkańców)'}
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700">
              {legendItems.map((l) => (
                <li key={l.key} className="flex items-center gap-2">
                  <svg width="28" height="20" aria-hidden="true" className="shrink-0">
                    <rect x="1" y="1" width="26" height="18" rx="3" fill={highContrast ? hcBg : l.fill} stroke={highContrast ? hcFg : '#C3C9CB'} />
                    {l.mark && (
                      <text x="14" y="14" textAnchor="middle" fontSize="9" fontWeight={800} stroke="none" fill={highContrast ? hcFg : l.text}>
                        {l.mark}
                      </text>
                    )}
                  </svg>
                  {l.label}
                </li>
              ))}
              <li className="flex items-center gap-2">
                <svg width="28" height="20" aria-hidden="true" className="shrink-0">
                  <rect x="1" y="1" width="26" height="18" rx="3" fill={highContrast ? hcBg : '#FFFFFF'} stroke={highContrast ? hcFg : '#C3C9CB'} />
                  <rect x="5" y="5" width="18" height="10" rx="2" fill="none" stroke={highContrast ? hcFg : '#17233A'} strokeDasharray="3 2" />
                </svg>
                Miasto na prawach powiatu
              </li>
            </ul>
            {!highContrast && indicator.id !== 'trend' && (
              <p className="mt-1 text-sm text-slate-600">Ciemniejszy kolor oznacza wyższą wartość. Wartość jest też wpisana w każde pole.</p>
            )}
          </div>
        </div>

        {/* Szczegóły wybranego powiatu */}
        <div className="lg:col-span-5 bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-xl p-5">
          <div aria-live="polite" className="sr-only">
            {announcement}
          </div>
          {selected ? (
            <div>
              <p className="text-sm font-semibold text-slate-600">{selected.powiat_name.startsWith('m. ') ? 'Miasto na prawach powiatu' : 'Powiat'}</p>
              <h3 ref={detailsRef} tabIndex={-1} className="text-2xl font-extrabold text-slate-900 focus:outline-none">
                {shortName(selected.powiat_name)}
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                {indicator.label}: <strong className="text-slate-900">{indicator.id === 'trend' ? trendOf(selected.demographic_trend).label : indicator.format(indicator.value(selected))}</strong>
                {indicator.id !== 'trend' && (
                  <>
                    {' '}· {rank}. miejsce na {challenges.length}
                    <span className="sr-only"> (od najwyższej wartości)</span>
                  </>
                )}
              </p>

              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-slate-900 mb-1">{etrMode ? 'Największa trudność' : 'Kluczowe wyzwanie społeczne'}</h4>
                <p className="text-sm leading-relaxed text-slate-800">{selected.key_social_challenge}</p>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-slate-600">Mieszkańcy</dt>
                  <dd className="font-bold text-slate-900 tabular-nums">{selected.population.toLocaleString('pl-PL')}</dd>
                </div>
                <div>
                  <dt className="text-slate-600">Seniorzy</dt>
                  <dd className="font-bold text-slate-900 tabular-nums">{fmt(selected.senior_share_pct)}%</dd>
                </div>
                <div>
                  <dt className="text-slate-600">Dzieci i młodzież</dt>
                  <dd className="font-bold text-slate-900 tabular-nums">{fmt(selected.youth_share_pct)}%</dd>
                </div>
                <div>
                  <dt className="text-slate-600">Zmiana liczby mieszkańców</dt>
                  <dd className="font-bold text-slate-900">
                    <span aria-hidden="true">{trendOf(selected.demographic_trend).mark} </span>
                    {trendOf(selected.demographic_trend).label}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600">Zgłoszone potrzeby</dt>
                  <dd className="font-bold text-slate-900 tabular-nums">{selected.reported_problems_count}</dd>
                </div>
                <div>
                  <dt className="text-slate-600">Działające innowacje</dt>
                  <dd className="font-bold text-slate-900 tabular-nums">{selected.active_innovations_count}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-col gap-2">
                <Link
                  to={`/matchmaking?powiat=${encodeURIComponent(selected.powiat_name)}&q=${encodeURIComponent(selected.key_social_challenge)}`}
                  className="text-center bg-blue-600 hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg text-sm"
                >
                  {etrMode ? 'Znajdź pomoc na ten problem' : 'Znajdź rozwiązania dla tego wyzwania'}
                </Link>
                {onShowInnovations && (
                  <button
                    type="button"
                    onClick={() => onShowInnovations(selected.powiat_name)}
                    className="text-center border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-bold px-4 py-2 rounded-lg text-sm"
                  >
                    {etrMode ? 'Pomysły sprawdzone w tym powiecie' : 'Innowacje sprawdzone w tym powiecie'}
                  </button>
                )}
                <Link
                  to={`/middleman?powiat=${encodeURIComponent(selected.powiat_name)}`}
                  className="text-center border border-slate-300 text-slate-800 hover:bg-slate-100 font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  {etrMode ? 'Plan dla gminy' : 'Zaplanuj wdrożenie w gminie'}
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Wybierz powiat na mapie, aby zobaczyć szczegóły.</p>
          )}
        </div>
      </div>

      {/* Alternatywa tekstowa: tabela danych (WCAG 1.1.1, 1.3.1) */}
      <details className="mt-6 border-t border-slate-200 pt-4">
        <summary className="cursor-pointer text-sm font-bold text-blue-700 hover:underline underline-offset-4">
          {etrMode ? 'Pokaż te same dane w tabeli' : 'Pokaż dane mapy w tabeli'}
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <caption className="text-left text-sm text-slate-600 mb-2">
              Wskaźniki społeczne powiatów Małopolski, posortowane według: {indicator.label.toLowerCase()} (od najwyższej wartości).
            </caption>
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-900">
                <th scope="col" className="py-2 pr-3">Powiat</th>
                <th scope="col" className="py-2 pr-3 text-right">Mieszkańcy</th>
                <th scope="col" className="py-2 pr-3 text-right">Seniorzy</th>
                <th scope="col" className="py-2 pr-3 text-right">Dzieci i młodzież</th>
                <th scope="col" className="py-2 pr-3">Zmiana liczby mieszkańców</th>
                <th scope="col" className="py-2 pr-3 text-right">Zgłoszone potrzeby (na 10 tys.)</th>
                <th scope="col" className="py-2 text-right">Innowacje (na 100 tys.)</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((c) => (
                <tr key={c.powiat_code} className={`border-b border-slate-200 ${c.powiat_code === selectedCode ? 'bg-blue-50' : ''}`}>
                  <th scope="row" className="py-2 pr-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => select(c, true)}
                      className="text-left text-blue-700 underline underline-offset-4 hover:text-blue-900"
                      aria-label={`Pokaż szczegóły: ${powiatLabel(c.powiat_name)}`}
                    >
                      {c.powiat_name}
                    </button>
                  </th>
                  <td className="py-2 pr-3 text-right tabular-nums">{c.population.toLocaleString('pl-PL')}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmt(c.senior_share_pct)}%</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmt(c.youth_share_pct)}%</td>
                  <td className="py-2 pr-3">{trendOf(c.demographic_trend).label}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {fmt(INDICATORS[2].value(c))} <span className="text-slate-600">({c.reported_problems_count})</span>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {fmt(INDICATORS[3].value(c))} <span className="text-slate-600">({c.active_innovations_count})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="mt-4 text-sm text-slate-600">
        Dane demonstracyjne (przybliżone) przygotowane na potrzeby prototypu. W wersji docelowej mapa pobiera dane z Banku
        Danych Lokalnych GUS i ze zgłoszeń na platformie.
      </p>
    </section>
  );
};
