import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { api, apiErrorMessage } from '../../services/api';

interface LoginFormProps {
  onLoggedIn: () => void;
  title?: string;
  description?: string;
}

/** Logowanie koordynatora / urzędnika – wspólne dla Panelu ROPS i Rejestru Wyzwań JST. */
export const LoginForm: React.FC<LoginFormProps> = ({
  onLoggedIn,
  title = 'Dla Urzędnika – Panel ROPS',
  description = 'Dostęp chroniony do bazy wniosków, grupowania, moderacji i wydruków urzędowych.'
}) => {
  const [username, setUsername] = useState('sedzia.hackyeah@malopolska.pl');
  const [password, setPassword] = useState('rops-demo-2026');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const doLogin = async (usr: string, pwd: string) => {
    setBusy(true);
    setError('');
    try {
      await api.login(pwd, usr);
      onLoggedIn();
    } catch (err) {
      setError(apiErrorMessage(err, 'Nie udało się zalogować.'));
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-5 h-5 text-slate-800" aria-hidden="true" />
        <h1 className="text-xl font-black text-slate-900">{title}</h1>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        {description}
      </p>

      {/* Baner szybkiego dostępu dla Sędziego */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 mb-5 space-y-2">
        <p className="text-xs font-black text-amber-900">Dostęp dla jury</p>
        <p className="text-xs text-amber-950 leading-relaxed">
          Dla potrzeb sprawnej weryfikacji konkursowej login i hasło zostały uzupełnione automatycznie. Kliknij przycisk poniżej, aby od razu wejść do panelu:
        </p>
        <button
          type="button"
          onClick={() => doLogin('sedzia.hackyeah@malopolska.pl', 'rops-demo-2026')}
          disabled={busy}
          className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-black py-2 px-3 rounded-lg text-xs shadow transition-all flex items-center justify-center gap-1.5"
        >
          {busy ? 'Logowanie…' : 'Zaloguj jako jury'}
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          doLogin(username, password);
        }}
        className="space-y-4 pt-2 border-t border-slate-100"
      >
        <div>
          <label htmlFor="admin-username" className="block text-xs font-bold text-slate-800 mb-1">
            Identyfikator / Login urzędnika
          </label>
          <input
            id="admin-username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="block text-xs font-bold text-slate-800 mb-1">
            Hasło służbowe
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-sm p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose-900 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            {error}
          </p>
        )}

        <div className="space-y-2 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-60 transition-colors shadow"
          >
            {busy ? 'Logowanie…' : 'Zaloguj do Panelu Urzędnika'}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="w-full text-xs text-slate-500 hover:text-slate-800 py-1 font-semibold"
          >
            Wyczyść dane (ręczne logowanie pracownika ROPS)
          </button>
        </div>
      </form>
    </div>
  );
};
