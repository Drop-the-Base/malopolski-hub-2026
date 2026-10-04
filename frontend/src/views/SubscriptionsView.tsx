import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BellRing, CheckCircle2, MailX } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { SubscriptionInfo, SubscriptionResult, SubscriptionTopic } from '../types';
import { CATEGORIES, POWIATY, categoryLabel, powiatLabel } from '../constants/domain';

const TOPICS: { value: SubscriptionTopic; label: string; hint: string }[] = [
  { value: 'nabory', label: 'Nabory na granty', hint: 'gdy ROPS otworzy nowy nabór albo zmieni termin lub zasady' },
  { value: 'innowacje', label: 'Nowe rozwiązania w Bibliotece innowacji', hint: 'gdy pojawi się nowe sprawdzone rozwiązanie' }
];

const describe = (s: { topics: string[]; categories: string[]; powiaty: string[] }) => ({
  topics: s.topics.map((t) => TOPICS.find((x) => x.value === t)?.label ?? t).join(', '),
  categories: s.categories.length ? s.categories.map(categoryLabel).join(', ') : 'wszystkie tematy',
  powiaty: s.powiaty.length ? s.powiaty.map(powiatLabel).join(', ') : 'cała Małopolska'
});

const checkboxCls = 'w-5 h-5 mt-0.5 shrink-0 accent-blue-700';

/** G5: zapis na powiadomienia e-mail o naborach i nowych innowacjach (wg tematu i powiatu). */
export const SubscriptionsView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [topics, setTopics] = useState<SubscriptionTopic[]>(['nabory', 'innowacje']);
  const [categories, setCategories] = useState<string[]>([]);
  const [powiaty, setPowiaty] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubscriptionResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const toggle = <T extends string>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (topics.length === 0) {
      setError('Wybierz co najmniej jeden rodzaj powiadomień.');
      return;
    }
    if (!consent) {
      setError('Zaznacz zgodę na przetwarzanie adresu e-mail.');
      return;
    }
    setBusy(true);
    try {
      setResult(await api.subscribe({ email: email.trim(), topics, categories, powiaty, rodo_consent: consent }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się zapisać na powiadomienia.'));
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const d = describe(result);
    return (
      <div className="max-w-2xl mx-auto">
        <div ref={resultRef} tabIndex={-1} role="status" className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-600 shadow-sm space-y-4 focus:outline-none">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-700" aria-hidden="true" /> Gotowe
          </h1>
          <p className="text-base text-slate-800">{result.message}</p>
          <dl className="text-base text-slate-800 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="font-bold">Adres</dt><dd>{result.email_masked}</dd>
            <dt className="font-bold">Powiadomienia</dt><dd>{d.topics}</dd>
            <dt className="font-bold">Tematy</dt><dd>{d.categories}</dd>
            <dt className="font-bold">Obszar</dt><dd>{d.powiaty}</dd>
          </dl>
          <p className="text-sm text-slate-700">W każdym e-mailu jest link, którym wypiszesz się jednym kliknięciem.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setResult(null)} className="px-4 py-2.5 rounded-lg border border-slate-400 font-semibold hover:bg-slate-100">
              Zmień ustawienia
            </button>
            <Link to="/moje-sprawy" className="px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold">
              Przejdź do Moich spraw
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-2">
          <BellRing className="w-7 h-7 text-blue-700" aria-hidden="true" /> Powiadomienia e-mail
        </h1>
        <p className="text-base text-slate-700">
          Nie musisz codziennie sprawdzać strony. Napiszemy do Ciebie, gdy pojawi się nowy nabór na granty albo nowe
          rozwiązanie w wybranym temacie lub powiecie. To nic nie kosztuje i możesz się wypisać w każdej chwili.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6" noValidate>
        <div>
          <label htmlFor="sub-email" className="block text-base font-bold text-slate-900 mb-1">Twój adres e-mail</label>
          <input
            id="sub-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-base p-2.5 rounded-lg border border-slate-400"
          />
        </div>

        <fieldset>
          <legend className="text-base font-bold text-slate-900 mb-2">O czym chcesz dostawać wiadomości?</legend>
          <div className="space-y-2">
            {TOPICS.map((t) => (
              <label key={t.value} className="flex items-start gap-3 p-3 rounded-lg border border-slate-300 cursor-pointer hover:bg-slate-50">
                <input type="checkbox" className={checkboxCls} checked={topics.includes(t.value)} onChange={() => toggle(topics, t.value, setTopics)} />
                <span>
                  <span className="block font-semibold text-slate-900">{t.label}</span>
                  <span className="block text-sm text-slate-700">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-base font-bold text-slate-900">Tematy</legend>
          <p className="text-sm text-slate-700 mb-2">Nie zaznaczysz nic – dostaniesz wiadomości ze wszystkich tematów.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <label key={c.value} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" className={checkboxCls} checked={categories.includes(c.value)} onChange={() => toggle(categories, c.value, setCategories)} />
                <span className="text-base text-slate-900">{c.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-base font-bold text-slate-900">Powiaty</legend>
          <p className="text-sm text-slate-700 mb-2">Nie zaznaczysz nic – dostaniesz wiadomości z całej Małopolski.</p>
          <details className="border border-slate-300 rounded-lg">
            <summary className="cursor-pointer p-3 font-semibold text-slate-900">
              Wybierz powiaty {powiaty.length > 0 && `(wybrano: ${powiaty.length})`}
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-3 pt-0">
              {POWIATY.map((p) => (
                <label key={p} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" className={checkboxCls} checked={powiaty.includes(p)} onChange={() => toggle(powiaty, p, setPowiaty)} />
                  <span className="text-base text-slate-900">{powiatLabel(p)}</span>
                </label>
              ))}
            </div>
          </details>
        </fieldset>

        <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-300 cursor-pointer">
          <input type="checkbox" className={checkboxCls} checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          <span className="text-sm text-slate-800">
            Wyrażam zgodę na przetwarzanie mojego adresu e-mail przez koordynatora Hubu wyłącznie w celu wysyłania wybranych
            powiadomień (RODO). Zgodę mogę wycofać w każdej chwili linkiem w e-mailu.
          </span>
        </label>

        {error && <p role="alert" className="text-base text-rose-900 bg-rose-50 border border-rose-300 p-3 rounded-lg">{error}</p>}

        <button type="submit" disabled={busy} className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold px-5 py-3 rounded-lg text-base">
          {busy ? 'Zapisywanie…' : 'Zapisz mnie na powiadomienia'}
        </button>
      </form>
    </div>
  );
};

/** Wypisanie z powiadomień linkiem z e-maila (token) – bez logowania. */
export const UnsubscribeView: React.FC = () => {
  const { token = '' } = useParams();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.getSubscription(token).then(setInfo).catch((err) => setError(apiErrorMessage(err, 'Nie udało się wczytać subskrypcji.')));
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    try {
      setInfo(await api.unsubscribe(token));
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się wypisać.'));
    } finally {
      setBusy(false);
    }
  };

  const d = info ? describe(info) : null;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
        <MailX className="w-7 h-7 text-blue-700" aria-hidden="true" /> Wypisz się z powiadomień
      </h1>
      <div aria-live="polite">
        {error && <p role="alert" className="text-base text-rose-900 bg-rose-50 border border-rose-300 p-3 rounded-lg">{error}</p>}
        {!error && !info && <p>Wczytywanie…</p>}
        {info && d && (
          info.is_active ? (
            <div className="space-y-4">
              <p className="text-base text-slate-800">
                Adres <strong>{info.email_masked}</strong> dostaje powiadomienia: {d.topics.toLowerCase()} ({d.categories}; {d.powiaty}).
              </p>
              <button type="button" onClick={confirm} disabled={busy} className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold px-5 py-3 rounded-lg text-base">
                {busy ? 'Wypisywanie…' : 'Tak, wypisz mnie'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p role="status" className="text-base text-emerald-900 bg-emerald-50 border border-emerald-300 p-3 rounded-lg">
                {done ? 'Wypisaliśmy Cię. Nie będziemy już wysyłać powiadomień na ten adres.' : 'Ten adres jest już wypisany z powiadomień.'}
              </p>
              <Link to="/powiadomienia" className="font-bold text-blue-700 underline">Zapisz się ponownie</Link>
            </div>
          )
        )}
      </div>
    </div>
  );
};
