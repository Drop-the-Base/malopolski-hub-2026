import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Accessibility,
  Briefcase,
  Bus,
  CookingPot,
  Download,
  GraduationCap,
  HeartHandshake,
  Leaf,
  Lightbulb,
  MessageCircleHeart,
  Printer,
  RefreshCw,
  Smartphone,
  Stethoscope,
  Users,
  Wrench
} from 'lucide-react';
import { api, apiErrorMessage } from '../../services/api';
import { CanvasData, PosterHints } from '../../types';
import { IMPLEMENTATION_STAGES, powiatLabel } from '../../constants/domain';

/**
 * „Plakat pomysłu” (backlog G11): jednostronicowa wizualizacja pomysłu generowana w przeglądarce z fiszki i Canwy.
 * Plakat to czysty SVG (bez zewnętrznych zasobów), wyświetlany jako obrazek z opisem tekstowym,
 * do pobrania jako SVG/PNG i do wydruku na A4.
 */

interface IdeaPosterProps {
  title: string;
  summary: string;
  targetAudience: string;
  stage: string;
  powiat: string;
  gmina: string;
  canvas: CanvasData;
}

// Kolory z design systemu (docs/design_system.md)
const C = {
  paper: '#F5F6F3',
  card: '#FFFFFF',
  ink: '#17233A',
  inkSoft: '#3D4A5F',
  blue: '#034EA2',
  blueSoft: '#E8EFF8',
  yellow: '#FFD100',
  rule: '#BCD0EA',
  margin: '#C8102E',
  line: '#DCE0DE'
};
const FONT = "'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', 'Segoe UI', Arial, sans-serif";
const W = 800;
const H = 1131; // proporcje A4

/** Piktogram dobierany do tematu pomysłu po słowach kluczowych. */
const CATEGORIES: { keys: string[]; icon: LucideIcon; name: string }[] = [
  { keys: ['niepełnospr', 'dostępn', 'wózk', 'niewidom', 'głuch', 'barier'], icon: Accessibility, name: 'dostępność' },
  { keys: ['senior', 'starsz', '70+', '75+', '65+', 'opiek'], icon: HeartHandshake, name: 'seniorzy i opieka' },
  { keys: ['psych', 'emocj', 'samotn', 'lęk', 'depres', 'kryzys', 'wytchnien'], icon: MessageCircleHeart, name: 'zdrowie psychiczne i wsparcie' },
  { keys: ['młodzie', 'uczni', 'szkoł', 'nastolat', 'dzieci', 'edukac'], icon: GraduationCap, name: 'dzieci, młodzież i edukacja' },
  { keys: ['napraw', 'majsterk', 'rower', 'narzędz'], icon: Wrench, name: 'naprawa i rzemiosło' },
  { keys: ['ekolog', 'odpad', 'klimat', 'ogród', 'zieleń', 'środowisk'], icon: Leaf, name: 'ekologia' },
  { keys: ['dojazd', 'dowóz', 'transport', 'autobus', 'komunikac'], icon: Bus, name: 'transport i dojazdy' },
  { keys: ['cyfrow', 'internet', 'aplikac', 'telefon', 'komputer', 'e-recept'], icon: Smartphone, name: 'włączenie cyfrowe' },
  { keys: ['zdrow', 'lekarz', 'aptek', 'rehabil', 'udar', 'pielęg'], icon: Stethoscope, name: 'zdrowie' },
  { keys: ['jedzen', 'posił', 'kuchn', 'gotow', 'żywn'], icon: CookingPot, name: 'żywność i wspólne gotowanie' },
  { keys: ['prac', 'zatrudn', 'bezroboc', 'zawod'], icon: Briefcase, name: 'praca i aktywizacja' },
  { keys: ['sąsiad', 'integrac', 'międzypokolen', 'wolontar', 'społeczn'], icon: Users, name: 'wspólnota i sąsiedztwo' }
];

const pickCategory = (text: string) => {
  const t = text.toLowerCase();
  return CATEGORIES.find((c) => c.keys.some((k) => t.includes(k))) ?? { icon: Lightbulb, name: 'innowacja społeczna', keys: [] };
};

/** Łamanie tekstu na linie wg przybliżonej szerokości znaku (SVG nie zawija tekstu sam). */
const wrap = (text: string, maxWidth: number, fontSize: number, maxLines: number, bold = false): string[] => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const perLine = Math.max(8, Math.floor(maxWidth / (fontSize * (bold ? 0.56 : 0.52))));
  const words = clean.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (let i = 0; i < words.length; i++) {
    const w = words[i].length > perLine ? `${words[i].slice(0, perLine - 1)}…` : words[i];
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= perLine) {
      cur = next;
      continue;
    }
    lines.push(cur);
    cur = w;
    if (lines.length === maxLines) {
      cur = '';
      const last = lines[maxLines - 1];
      lines[maxLines - 1] = `${last.length > perLine - 1 ? last.slice(0, perLine - 1) : last}…`.replace(/[\s,.;:]+…$/, '…');
      return lines;
    }
  }
  if (cur) lines.push(cur);
  return lines;
};

const firstSentences = (text: string, max = 260) => {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const dot = cut.lastIndexOf('. ');
  return dot > 80 ? cut.slice(0, dot + 1) : cut;
};

const splitPartners = (text: string) =>
  text
    .split(/[,;\n]|\s+oraz\s+|\.\s+/)
    .map((p) => p.replace(/^[\s\-–•]+|[\s.]+$/g, '').replace(/^(np\.|m\.in\.)\s*/i, ''))
    .filter((p) => p.length > 1)
    .slice(0, 6)
    .map((p) => (p.length > 34 ? `${p.slice(0, 33)}…` : p));

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'pomysl';

const TextLines: React.FC<{ x: number; y: number; lines: string[]; size: number; lh: number; fill: string; weight?: number; italic?: boolean }> = ({
  x,
  y,
  lines,
  size,
  lh,
  fill,
  weight = 400,
  italic
}) => (
  <text x={x} y={y} fontSize={size} fill={fill} fontWeight={weight} fontFamily={FONT} fontStyle={italic ? 'italic' : undefined}>
    {lines.map((l, i) => (
      <tspan key={i} x={x} dy={i === 0 ? 0 : lh}>
        {l}
      </tspan>
    ))}
  </text>
);

export const IdeaPoster: React.FC<IdeaPosterProps> = ({ title, summary, targetAudience, stage, powiat, gmina, canvas }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgString, setSvgString] = useState('');
  const [hints, setHints] = useState<PosterHints | null>(null);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const posterTitle = title.trim() || 'Mój pomysł na zmianę';
  useEffect(() => setHints(null), [posterTitle]);

  const problem = firstSentences(canvas.problem || summary);
  const solution = firstSentences(canvas.value_proposition || summary);
  const forWhom = firstSentences(targetAudience || canvas.target_group, 160);
  const where = [gmina.trim(), powiat ? powiatLabel(powiat) : ''].filter(Boolean).join(', ');
  const partners = splitPartners(canvas.partners);
  const check = firstSentences(canvas.metrics || canvas.testing_plan, 200);
  const stageIdx = Math.max(0, IMPLEMENTATION_STAGES.findIndex((s) => s.value === stage));
  const category = useMemo(
    () => pickCategory(`${posterTitle} ${summary} ${targetAudience} ${canvas.problem} ${canvas.target_group}`),
    [posterTitle, summary, targetAudience, canvas.problem, canvas.target_group]
  );
  const Icon = category.icon;

  // ---- Układ (obliczany z góry na dół; przy długich tekstach skracamy je, aby wszystko zmieściło się na A4) ----
  const titleLines = wrap(posterTitle, 500, 44, 3, true);
  const taglineLines = hints ? wrap(hints.tagline, 500, 22, 2) : [];
  const colW = 300;
  const headerTop = 48;
  const headerH = Math.max(250, 110 + (titleLines.length - 1) * 50 + (taglineLines.length ? 14 + taglineLines.length * 30 : 0) + 56);
  const stageY = headerTop + headerH + 52;
  const twistLines = hints ? hints.twists.map((t) => wrap(t, 600, 16, 2)) : [];
  const checkLines = wrap(check, 640, 17, 3);
  const tailH = hints
    ? 36 + twistLines.reduce((acc, l) => acc + l.length * 22 + 14, 0)
    : checkLines.length
    ? 32 + checkLines.length * 25
    : 0;
  const limitY = H - 116; // nad linią stopki

  const compute = (body: number, meta: number, chipRows: number) => {
    const problemLines = wrap(problem || 'Opisz problem w Canwie (pole 01).', colW, 18, body);
    const solutionLines = wrap(solution || 'Opisz wartość pomysłu w Canwie (pole 03).', colW, 18, body);
    const forWhomLines = wrap(forWhom || 'Uzupełnij grupę odbiorców.', colW, 18, meta);
    const whereLines = wrap(where || 'Małopolska', colW, 18, Math.min(meta, 3));
    const row1Y = stageY + 96;
    const row1H = 34 + Math.max(problemLines.length, solutionLines.length) * 26;
    const row2Y = row1Y + row1H + 28;
    const row2H = 34 + Math.max(forWhomLines.length, whereLines.length) * 26;
    const partnersY = row2Y + row2H + 28;
    // Rozmieszczenie „chipów” partnerów w wierszach
    const chips: { x: number; y: number; w: number; label: string }[] = [];
    let cx = 80;
    let cy = partnersY + 18;
    for (const p of partners) {
      const w = Math.round(p.length * 15 * 0.53 + 28);
      if (cx + w > W - 80) {
        cx = 80;
        cy += 44;
      }
      if (cy > partnersY + 18 + 44 * (chipRows - 1)) break;
      chips.push({ x: cx, y: cy, w, label: p });
      cx += w + 10;
    }
    const partnersH = chips.length ? 18 + chips[chips.length - 1].y - partnersY + 36 : 0;
    const bottomY = chips.length ? partnersY + partnersH + 34 : partnersY;
    return { problemLines, solutionLines, forWhomLines, whereLines, row1Y, row1H, row2Y, partnersY, chips, bottomY };
  };
  let lay = compute(7, 4, 2);
  for (const [b, m, r] of [[6, 3, 2], [5, 3, 1], [4, 2, 1], [3, 2, 1], [2, 1, 1], [2, 1, 0]] as const) {
    if (lay.bottomY + tailH <= limitY) break;
    lay = compute(b, m, r);
  }
  const { problemLines, solutionLines, forWhomLines, whereLines, row1Y, row1H, row2Y, partnersY, chips, bottomY } = lay;

  const today = new Date().toLocaleDateString('pl-PL');
  const altText = `Plakat pomysłu „${posterTitle}”. Temat: ${category.name}. Etap: ${IMPLEMENTATION_STAGES[stageIdx].label}.${
    hints ? ` Hasło: ${hints.tagline}` : ''
  }`;
  const longDescription = [
    problem && `Problem: ${problem}`,
    solution && `Rozwiązanie: ${solution}`,
    forWhom && `Dla kogo: ${forWhom}`,
    where && `Gdzie: ${where}`,
    partners.length ? `Kluczowi partnerzy: ${partners.join(', ')}` : '',
    hints ? `Nietuzinkowe warianty: ${hints.twists.map((t, i) => `${i + 1}) ${t}`).join(' ')}` : check && `Jak sprawdzimy, że działa: ${check}`
  ].filter(Boolean) as string[];

  // Serializacja SVG z ukrytego węzła → obrazek (odporny na style trybów kontrastu) i pliki do pobrania
  useLayoutEffect(() => {
    if (!svgRef.current) return;
    const str = new XMLSerializer().serializeToString(svgRef.current);
    if (str !== svgString) setSvgString(str);
  });
  const dataUrl = svgString ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}` : '';
  const fileBase = `plakat-${slug(posterTitle)}`;

  const download = (href: string, name: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadSvg = () => {
    const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml' }));
    download(url, `${fileBase}.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setNotice(`Pobrano plik ${fileBase}.svg`);
  };

  const downloadPng = () => {
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const c = document.createElement('canvas');
      c.width = W * scale;
      c.height = H * scale;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((blob) => {
        if (!blob) {
          setNotice('Nie udało się zapisać PNG. Pobierz plakat jako SVG.');
          return;
        }
        const url = URL.createObjectURL(blob);
        download(url, `${fileBase}.png`);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setNotice(`Pobrano plik ${fileBase}.png`);
      }, 'image/png');
    };
    img.onerror = () => setNotice('Nie udało się zapisać PNG. Pobierz plakat jako SVG.');
    img.src = dataUrl;
  };

  const printPoster = () => {
    const w = window.open('', '_blank');
    if (!w) {
      setNotice('Przeglądarka zablokowała nowe okno. Pobierz plakat jako PNG lub SVG i wydrukuj plik.');
      return;
    }
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    w.document.write(
      `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${esc(`Plakat pomysłu – ${posterTitle}`)}</title>` +
        `<style>@page{size:A4 portrait;margin:0}html,body{margin:0;background:#fff}img{display:block;width:100%;height:auto}</style></head>` +
        `<body><img alt="${esc(altText)}" src="${dataUrl}"></body></html>`
    );
    w.document.close();
    const img = w.document.querySelector('img');
    const go = () => {
      w.focus();
      w.print();
    };
    if (img && !img.complete) img.addEventListener('load', go);
    else setTimeout(go, 100);
  };

  const fetchHints = async () => {
    setHintsLoading(true);
    setNotice('');
    try {
      const res = await api.getPosterHints({
        title: posterTitle,
        summary: summary || undefined,
        problem: canvas.problem || undefined,
        value_proposition: canvas.value_proposition || undefined,
        target_group: targetAudience || canvas.target_group || undefined
      });
      setHints(res);
      setNotice(
        res.ai_powered
          ? 'Dodano hasło i 3 warianty pomysłu. To tylko podpowiedzi – sprawdź, czy pasują.'
          : 'Dodano hasło i 3 warianty pomysłu z gotowych podpowiedzi. Sprawdź, czy pasują.'
      );
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Nie udało się przygotować podpowiedzi. Plakat działa bez nich.'));
    } finally {
      setHintsLoading(false);
    }
  };

  const btn = 'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border transition-colors disabled:opacity-60';

  return (
    <section aria-labelledby="poster-title" className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 id="poster-title" className="text-xl font-bold text-slate-900">
            Plakat pomysłu
          </h2>
          <p className="text-slate-600 max-w-prose">
            Jedna strona, która pokazuje Twój pomysł innym: sąsiadom, gminie, sponsorom. Plakat tworzy się sam z fiszki i Canwy –
            zmień pola powyżej, a plakat zmieni się razem z nimi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchHints}
            disabled={hintsLoading}
            aria-busy={hintsLoading}
            className={`${btn} border-slate-300 text-slate-900 bg-white hover:bg-slate-100`}
          >
            {hintsLoading ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Lightbulb className="w-4 h-4" aria-hidden="true" />}
            {hints ? 'Inne hasło i warianty' : 'Dodaj hasło i 3 nietypowe warianty'}
          </button>
          <button type="button" onClick={downloadPng} disabled={!dataUrl} className={`${btn} border-blue-600 bg-blue-600 text-white hover:bg-blue-800`}>
            <Download className="w-4 h-4" aria-hidden="true" /> Pobierz PNG
          </button>
          <button type="button" onClick={downloadSvg} disabled={!svgString} className={`${btn} border-slate-300 text-slate-900 bg-white hover:bg-slate-100`}>
            <Download className="w-4 h-4" aria-hidden="true" /> Pobierz SVG
          </button>
          <button type="button" onClick={printPoster} disabled={!dataUrl} className={`${btn} border-slate-300 text-slate-900 bg-white hover:bg-slate-100`}>
            <Printer className="w-4 h-4" aria-hidden="true" /> Drukuj plakat
          </button>
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-slate-700 min-h-[1.25rem]">
        {notice}
      </p>

      <figure className="grid grid-cols-1 lg:grid-cols-[minmax(0,26rem)_1fr] gap-6 items-start">
        {dataUrl ? (
          <img src={dataUrl} alt={altText} aria-describedby="poster-desc" className="w-full max-w-md border border-slate-200 rounded shadow-sm bg-white" />
        ) : (
          <div className="w-full max-w-md aspect-[800/1131] bg-slate-100 rounded" aria-hidden="true" />
        )}
        <figcaption id="poster-desc" className="text-slate-800 space-y-2">
          <span className="block font-bold text-slate-900">Co jest na plakacie</span>
          <span className="block text-sm text-slate-600">
            Piktogram dobrany do tematu: {category.name}. Etap: {IMPLEMENTATION_STAGES[stageIdx].label}.
          </span>
          {hints && <span className="block text-sm">Hasło: „{hints.tagline}”</span>}
          <ul className="list-disc pl-5 text-sm space-y-1">
            {longDescription.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </figcaption>
      </figure>

      {/* Źródło plakatu: ukryty węzeł SVG serializowany do obrazka i plików */}
      <div hidden aria-hidden="true">
        <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <title>{altText}</title>
          <rect width={W} height={H} fill={C.paper} />
          <rect x={40} y={40} width={W - 80} height={H - 80} fill={C.card} stroke={C.line} />
          <rect x={40} y={40} width={W - 80} height={8} fill={C.margin} />

          {/* Nagłówek */}
          <rect x={40} y={headerTop} width={W - 80} height={headerH} fill={C.blue} />
          <text x={80} y={headerTop + 46} fontSize={17} fill="#DCE6F5" fontFamily={FONT} fontWeight={600}>
            Plakat pomysłu · Małopolski Hub Innowacji Społecznych
          </text>
          <TextLines x={80} y={headerTop + 110} lines={titleLines} size={44} lh={50} fill="#FFFFFF" weight={800} />
          {taglineLines.length > 0 && (
            <TextLines x={80} y={headerTop + 110 + titleLines.length * 50 + 6} lines={taglineLines} size={22} lh={30} fill={C.yellow} weight={600} />
          )}
          <circle cx={W - 132} cy={headerTop + 120} r={62} fill={C.yellow} />
          <Icon x={W - 132 - 36} y={headerTop + 120 - 36} width={72} height={72} color={C.ink} strokeWidth={1.75} />
          {/* „Belka” jak w znaku MH */}
          <rect x={80} y={headerTop + headerH - 26} width={120} height={6} fill={C.yellow} />

          {/* Etap realizacji */}
          <text x={80} y={stageY - 16} fontSize={15} fill={C.inkSoft} fontFamily={FONT} fontWeight={700}>
            Etap
          </text>
          {IMPLEMENTATION_STAGES.map((s, i) => {
            const step = (W - 160) / (IMPLEMENTATION_STAGES.length - 1);
            const cx = 80 + 14 + i * (step - 28 / (IMPLEMENTATION_STAGES.length - 1));
            const done = i <= stageIdx;
            const shortLabel = s.label.split(/[ /(]/)[0];
            return (
              <g key={s.value}>
                {i > 0 && (
                  <line
                    x1={cx - (step - 28 / (IMPLEMENTATION_STAGES.length - 1)) + 16}
                    y1={stageY + 14}
                    x2={cx - 16}
                    y2={stageY + 14}
                    stroke={done ? C.blue : C.rule}
                    strokeWidth={4}
                  />
                )}
                <circle cx={cx} cy={stageY + 14} r={14} fill={i === stageIdx ? C.blue : done ? C.blueSoft : C.card} stroke={done ? C.blue : C.rule} strokeWidth={3} />
                <text
                  x={cx}
                  y={stageY + 54}
                  fontSize={15}
                  textAnchor={i === 0 ? 'start' : i === IMPLEMENTATION_STAGES.length - 1 ? 'end' : 'middle'}
                  dx={i === 0 ? -14 : i === IMPLEMENTATION_STAGES.length - 1 ? 14 : 0}
                  fill={i === stageIdx ? C.ink : C.inkSoft}
                  fontWeight={i === stageIdx ? 800 : 400}
                  fontFamily={FONT}
                >
                  {shortLabel}
                </text>
              </g>
            );
          })}

          {/* Problem / Rozwiązanie */}
          {[
            { x: 80, label: 'Problem', color: C.margin, lines: problemLines },
            { x: 420, label: 'Rozwiązanie', color: C.blue, lines: solutionLines }
          ].map((b) => (
            <g key={b.label}>
              <rect x={b.x} y={row1Y - 20} width={6} height={row1H} fill={b.color} />
              <text x={b.x + 18} y={row1Y} fontSize={20} fontWeight={800} fill={C.ink} fontFamily={FONT}>
                {b.label}
              </text>
              <TextLines x={b.x + 18} y={row1Y + 32} lines={b.lines} size={18} lh={26} fill={C.ink} />
            </g>
          ))}

          {/* Dla kogo / Gdzie */}
          {[
            { x: 80, label: 'Dla kogo', lines: forWhomLines },
            { x: 420, label: 'Gdzie', lines: whereLines }
          ].map((b) => (
            <g key={b.label}>
              <line x1={b.x} y1={row2Y - 22} x2={b.x + colW + 18} y2={row2Y - 22} stroke={C.rule} strokeWidth={2} />
              <text x={b.x} y={row2Y + 6} fontSize={20} fontWeight={800} fill={C.ink} fontFamily={FONT}>
                {b.label}
              </text>
              <TextLines x={b.x} y={row2Y + 36} lines={b.lines} size={18} lh={26} fill={C.ink} />
            </g>
          ))}

          {/* Partnerzy */}
          {chips.length > 0 && (
            <g>
              <text x={80} y={partnersY} fontSize={20} fontWeight={800} fill={C.ink} fontFamily={FONT}>
                Kluczowi partnerzy
              </text>
              {chips.map((c) => (
                <g key={`${c.x}-${c.y}`}>
                  <rect x={c.x} y={c.y} width={c.w} height={32} rx={16} fill={C.blueSoft} stroke={C.rule} />
                  <text x={c.x + 14} y={c.y + 21} fontSize={15} fill={C.ink} fontFamily={FONT} fontWeight={600}>
                    {c.label}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Warianty (z podpowiedzi) albo „jak sprawdzimy” */}
          {hints ? (
            <g>
              <rect x={64} y={bottomY - 34} width={W - 128} height={tailH + 34} fill={C.paper} stroke={C.line} />
              <text x={84} y={bottomY} fontSize={20} fontWeight={800} fill={C.ink} fontFamily={FONT}>
                3 nietypowe warianty
              </text>
              {twistLines.map((lines, i) => {
                const y = bottomY + 36 + twistLines.slice(0, i).reduce((acc, l) => acc + l.length * 22 + 14, 0);
                return (
                  <g key={i}>
                    <circle cx={98} cy={y - 6} r={13} fill={C.yellow} />
                    <text x={98} y={y - 1} fontSize={15} fontWeight={800} textAnchor="middle" fill={C.ink} fontFamily={FONT}>
                      {i + 1}
                    </text>
                    <TextLines x={124} y={y} lines={lines} size={16} lh={22} fill={C.ink} />
                  </g>
                );
              })}
            </g>
          ) : (
            checkLines.length > 0 && (
              <g>
                <text x={80} y={bottomY} fontSize={20} fontWeight={800} fill={C.ink} fontFamily={FONT}>
                  Jak sprawdzimy, że działa
                </text>
                <TextLines x={80} y={bottomY + 32} lines={checkLines} size={17} lh={25} fill={C.ink} />
              </g>
            )
          )}

          {/* Stopka */}
          <line x1={80} y1={H - 92} x2={W - 80} y2={H - 92} stroke={C.line} />
          <text x={80} y={H - 64} fontSize={13} fill={C.inkSoft} fontFamily={FONT}>
            Kreator pomysłów · Małopolski Hub Innowacji Społecznych (prototyp) · {today}
          </text>
        </svg>
      </div>
    </section>
  );
};
