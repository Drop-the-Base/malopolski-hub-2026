import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '../../store/useAccessibilityStore';
import { Eye, Type, Volume2, Square } from 'lucide-react';

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Dzieli tekst na krótkie fragmenty – długie wypowiedzi bywają ucinane przez przeglądarki. */
const toChunks = (text: string) =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?:])\s+/)
    .reduce<string[]>((acc, sentence) => {
      const last = acc[acc.length - 1];
      if (last && last.length + sentence.length < 220) acc[acc.length - 1] = `${last} ${sentence}`;
      else if (sentence.trim()) acc.push(sentence.trim());
      return acc;
    }, []);

export const AccessibilityBar: React.FC = () => {
  const {
    contrastMode,
    fontSize,
    setContrastMode,
    setFontSize
  } = useAccessibility();

  const location = useLocation();
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState('');

  const stopSpeaking = () => {
    if (canSpeak()) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  // Zmiana strony albo Escape przerywa czytanie
  useEffect(() => {
    if (canSpeak()) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!speaking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopSpeaking();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [speaking]);

  useEffect(() => () => {
    if (canSpeak()) window.speechSynthesis.cancel();
  }, []);

  const handleSpeakPage = () => {
    if (!canSpeak()) {
      setNotice('Twoja przeglądarka nie potrafi czytać tekstu na głos.');
      return;
    }
    if (speaking) {
      stopSpeaking();
      return;
    }
    window.speechSynthesis.cancel();
    const mainText = document.getElementById('main-content')?.innerText || document.body.innerText;
    const chunks = toChunks(mainText);
    if (!chunks.length) return;
    chunks.forEach((chunk, i) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = 'pl-PL';
      utterance.rate = 0.95;
      if (i === chunks.length - 1) {
        utterance.onend = () => setSpeaking(false);
      }
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    });
    setNotice('');
    setSpeaking(true);
  };

  return (
    <aside
      aria-label="Pasek dostępności cyfrowej WCAG 2.1 AA"
      className="bg-slate-900 text-white text-sm py-1.5 px-4 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Lewa strona: Skrót do treści i informacja WCAG */}
        <div className="flex items-center gap-3">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:static focus:px-3 focus:py-1 focus:bg-amber-400 focus:text-slate-900 focus:font-bold focus:rounded"
          >
            Przejdź do treści głównej
          </a>
          <span className="text-slate-300 hidden md:inline">Ułatwienia dostępu</span>
        </div>

        {/* Prawa strona: Przyciski kontrolne */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-4">
          {/* Odsłuchaj stronę */}
          <button
            type="button"
            onClick={handleSpeakPage}
            aria-pressed={speaking}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              speaking ? 'bg-amber-400 text-slate-900 font-bold' : 'text-slate-200 hover:bg-slate-800'
            }`}
            title={speaking ? 'Zatrzymaj czytanie (możesz też nacisnąć Escape)' : 'Odsłuchaj treść strony na głos'}
            aria-label={speaking ? 'Zatrzymaj czytanie strony' : 'Odsłuchaj stronę'}
          >
            {speaking ? (
              <Square className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span className="hidden md:inline">{speaking ? 'Zatrzymaj' : 'Odsłuchaj'}</span>
          </button>
          {notice && (
            <span role="status" className="text-amber-300">
              {notice}
            </span>
          )}

          {/* Wybór kontrastu */}
          <div className="flex items-center gap-1 p-0.5 rounded border border-slate-700" role="group" aria-label="Wybór kontrastu">
            <Eye className="w-3.5 h-3.5 ml-1 text-slate-400" aria-hidden="true" />
            <button
              onClick={() => setContrastMode('default')}
              aria-pressed={contrastMode === 'default'}
              aria-label="Kontrast standardowy"
              className={`px-2 py-0.5 rounded text-xs ${
                contrastMode === 'default' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Kontrast standardowy"
            >
              Std
            </button>
            <button
              onClick={() => setContrastMode('yellow-black')}
              aria-pressed={contrastMode === 'yellow-black'}
              aria-label="Wysoki kontrast: żółty tekst na czarnym tle"
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                contrastMode === 'yellow-black' ? 'bg-yellow-400 text-black' : 'text-yellow-300 hover:bg-slate-700'
              }`}
              title="Wysoki kontrast: Żółty na czarnym"
            >
              Ż/C
            </button>
            <button
              onClick={() => setContrastMode('black-white')}
              aria-pressed={contrastMode === 'black-white'}
              aria-label="Wysoki kontrast: czarny tekst na białym tle"
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                contrastMode === 'black-white' ? 'bg-white text-black' : 'text-slate-200 hover:bg-slate-700'
              }`}
              title="Wysoki kontrast: Czarny na białym"
            >
              C/B
            </button>
          </div>

          {/* Rozmiar czcionki */}
          <div className="flex items-center gap-1 p-0.5 rounded border border-slate-700" role="group" aria-label="Wielkość czcionki">
            <Type className="w-3.5 h-3.5 ml-1 text-slate-400" aria-hidden="true" />
            <button
              onClick={() => setFontSize('normal')}
              aria-pressed={fontSize === 'normal'}
              aria-label="Rozmiar tekstu 100%"
              className={`px-2 py-0.5 rounded text-xs ${
                fontSize === 'normal' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Rozmiar czcionki standardowy 100%"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              aria-pressed={fontSize === 'large'}
              aria-label="Rozmiar tekstu 125%"
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                fontSize === 'large' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
              title="Rozmiar czcionki duży 125%"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('huge')}
              aria-pressed={fontSize === 'huge'}
              aria-label="Rozmiar tekstu 150%"
              className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                fontSize === 'huge' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
              title="Rozmiar czcionki bardzo duży 150%"
            >
              A++
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
