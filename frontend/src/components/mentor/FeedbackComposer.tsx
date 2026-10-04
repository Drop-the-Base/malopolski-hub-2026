import React, { useId, useRef, useState } from 'react';
import { Send } from 'lucide-react';

export interface FeedbackTemplate {
  id: string;
  label: string;
  text: string;
}

export const DEFAULT_TEMPLATES: FeedbackTemplate[] = [
  {
    id: 'mocne',
    label: 'Mocne strony',
    text: 'Mocne strony pomysłu: …\nTo dobrze odpowiada na potrzebę mieszkańców, bo …'
  },
  {
    id: 'doprecyzowac',
    label: 'Do doprecyzowania',
    text: 'Do doprecyzowania przed kolejnym krokiem:\n1. …\n2. …'
  },
  {
    id: 'partner',
    label: 'Proponowany partner',
    text: 'Proponowany partner do współpracy: … (na przykład ośrodek pomocy społecznej, szkoła albo koło gospodyń wiejskich). Warto się z nim skontaktować, bo …'
  },
  {
    id: 'krok',
    label: 'Następny krok',
    text: 'Proponuję taki następny krok: … Jeśli chcesz porozmawiać, zapisz się na konsultację w module „Dialog i mentorzy”.'
  }
];

const templatesKey = (mentorId: string) => `mhis_mentor_templates_${mentorId}`;

/** Szablony mentora zapamiętane w tej przeglądarce (localStorage); przy błędzie – domyślne. */
export const loadTemplates = (mentorId: string): FeedbackTemplate[] => {
  try {
    const raw = localStorage.getItem(templatesKey(mentorId));
    const saved = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return DEFAULT_TEMPLATES.map((t) => ({ ...t, text: typeof saved[t.id] === 'string' && saved[t.id].trim() ? saved[t.id] : t.text }));
  } catch {
    return DEFAULT_TEMPLATES;
  }
};

export const saveTemplates = (mentorId: string, templates: FeedbackTemplate[]) => {
  try {
    localStorage.setItem(templatesKey(mentorId), JSON.stringify(Object.fromEntries(templates.map((t) => [t.id, t.text]))));
  } catch {
    /* brak dostępu do storage – szablony tylko do odświeżenia strony */
  }
};

interface FeedbackComposerProps {
  label: string;
  hint: string;
  submitLabel: string;
  templates?: FeedbackTemplate[];
  busy: boolean;
  onSubmit: (body: string) => Promise<boolean>;
}

/** Pole odpowiedzi z szablonami („Mocne strony…”, „Do doprecyzowania…”) wstawianymi jednym kliknięciem. */
export const FeedbackComposer: React.FC<FeedbackComposerProps> = ({ label, hint, submitLabel, templates, busy, onSubmit }) => {
  const uid = useId();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = (t: FeedbackTemplate) => {
    setDraft((d) => (d.trim() ? `${d.trimEnd()}\n\n${t.text}` : t.text));
    setError('');
    window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      const pos = el.value.indexOf('…');
      if (pos >= 0) el.setSelectionRange(pos, pos + 1);
    }, 0);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (body.length < 10) {
      setError('Napisz co najmniej 10 znaków.');
      ref.current?.focus();
      return;
    }
    if (body.includes('…')) {
      setError('Uzupełnij miejsca oznaczone wielokropkiem (…) albo je usuń.');
      ref.current?.focus();
      return;
    }
    setError('');
    if (await onSubmit(body)) setDraft('');
  };

  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      {templates && templates.length > 0 && (
        <div role="group" aria-label="Wstaw szablon" className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => insert(t)}
              className="px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-blue-800 text-sm font-semibold hover:bg-blue-50"
            >
              {t.label}
              <span className="sr-only"> – wstaw szablon</span>
            </button>
          ))}
        </div>
      )}
      <label htmlFor={`${uid}-body`} className="block text-sm font-bold text-slate-900">
        {label}
      </label>
      <textarea
        id={`${uid}-body`}
        ref={ref}
        rows={5}
        maxLength={4000}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        aria-describedby={`${uid}-hint${error ? ` ${uid}-err` : ''}`}
        aria-invalid={!!error}
        className="w-full text-base p-2.5 rounded-lg border border-slate-400 bg-white"
      />
      <p id={`${uid}-hint`} className="text-sm text-slate-600">{hint}</p>
      {error && (
        <p id={`${uid}-err`} role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-300 p-2 rounded-lg">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-2"
      >
        <Send className="w-4 h-4" aria-hidden="true" /> {busy ? 'Wysyłanie…' : submitLabel}
      </button>
    </form>
  );
};

interface TemplatesEditorProps {
  mentorId: string;
  templates: FeedbackTemplate[];
  onChange: (templates: FeedbackTemplate[]) => void;
}

/** Edycja własnych szablonów (zapis w tej przeglądarce). */
export const TemplatesEditor: React.FC<TemplatesEditorProps> = ({ mentorId, templates, onChange }) => {
  const uid = useId();
  const [local, setLocal] = useState(templates);
  const [saved, setSaved] = useState('');

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = local.map((t, i) => ({ ...t, text: t.text.trim() || DEFAULT_TEMPLATES[i].text }));
    saveTemplates(mentorId, cleaned);
    setLocal(cleaned);
    onChange(cleaned);
    setSaved('Zapisano szablony w tej przeglądarce.');
  };

  const reset = () => {
    setLocal(DEFAULT_TEMPLATES);
    saveTemplates(mentorId, DEFAULT_TEMPLATES);
    onChange(DEFAULT_TEMPLATES);
    setSaved('Przywrócono szablony domyślne.');
  };

  return (
    <form onSubmit={save} className="space-y-4">
      {local.map((t, i) => (
        <div key={t.id}>
          <label htmlFor={`${uid}-${t.id}`} className="block text-sm font-bold text-slate-900 mb-1">
            Szablon „{t.label}”
          </label>
          <textarea
            id={`${uid}-${t.id}`}
            rows={3}
            maxLength={1500}
            value={t.text}
            onChange={(e) => setLocal(local.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
            className="w-full text-sm p-2 rounded-lg border border-slate-400 bg-white"
          />
        </div>
      ))}
      <p className="text-sm text-slate-600">Wielokropek (…) oznacza miejsce do uzupełnienia – po wstawieniu szablonu kursor przejdzie do pierwszego z nich.</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg text-sm">
          Zapisz szablony
        </button>
        <button type="button" onClick={reset} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-100">
          Przywróć domyślne
        </button>
      </div>
      <p role="status" className={saved ? 'text-sm text-emerald-900' : 'sr-only'}>{saved}</p>
    </form>
  );
};
