import React from 'react';
import { useAccessibility } from '../../store/useAccessibilityStore';
import { Eye, Type, Volume2, BookOpen, Check } from 'lucide-react';

export const AccessibilityBar: React.FC = () => {
  const {
    contrastMode,
    fontSize,
    etrMode,
    setContrastMode,
    setFontSize,
    toggleEtrMode
  } = useAccessibility();

  const handleSpeakPage = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const mainText = document.getElementById('main-content')?.innerText || document.body.innerText;
      const utterance = new SpeechSynthesisUtterance(mainText.slice(0, 1000));
      utterance.lang = 'pl-PL';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Twoja przeglądarka nie wspiera syntezatora mowy.');
    }
  };

  return (
    <aside
      aria-label="Pasek dostępności cyfrowej WCAG 2.1 AA"
      className="bg-slate-900 text-white text-xs py-2 px-4 border-b border-slate-700 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Lewa strona: Skrót do treści i informacja WCAG */}
        <div className="flex items-center gap-3">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:static focus:px-3 focus:py-1 focus:bg-amber-400 focus:text-black focus:font-bold focus:rounded"
          >
            Przejdź do treści głównej
          </a>
          <span className="font-semibold text-slate-300 hidden sm:inline flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            WCAG 2.1 AA & ETR
          </span>
        </div>

        {/* Prawa strona: Przyciski kontrolne */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Przełącznik Tekst Łatwy (ETR) */}
          <button
            onClick={toggleEtrMode}
            aria-pressed={etrMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors font-medium ${
              etrMode
                ? 'bg-amber-400 text-black font-bold shadow'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Włącz tekst łatwy do czytania i rozumienia (ETR)"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Prosty Język (ETR)</span>
            {etrMode && <Check className="w-3.5 h-3.5" />}
          </button>

          {/* Odsłuchaj stronę */}
          <button
            onClick={handleSpeakPage}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            title="Odsłuchaj treść strony na głos"
            aria-label="Odsłuchaj stronę za pomocą syntezatora mowy"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className="hidden md:inline">Odsłuchaj</span>
          </button>

          {/* Wybór kontrastu */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700" role="group" aria-label="Wybór kontrastu">
            <Eye className="w-3.5 h-3.5 ml-1 text-slate-400" aria-hidden="true" />
            <button
              onClick={() => setContrastMode('default')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                contrastMode === 'default' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Kontrast standardowy"
            >
              Std
            </button>
            <button
              onClick={() => setContrastMode('yellow-black')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                contrastMode === 'yellow-black' ? 'bg-yellow-400 text-black' : 'text-yellow-300 hover:bg-slate-700'
              }`}
              title="Wysoki kontrast: Żółty na czarnym"
            >
              Ż/C
            </button>
            <button
              onClick={() => setContrastMode('black-white')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                contrastMode === 'black-white' ? 'bg-white text-black' : 'text-slate-200 hover:bg-slate-700'
              }`}
              title="Wysoki kontrast: Czarny na białym"
            >
              C/B
            </button>
          </div>

          {/* Rozmiar czcionki */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700" role="group" aria-label="Wielkość czcionki">
            <Type className="w-3.5 h-3.5 ml-1 text-slate-400" aria-hidden="true" />
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                fontSize === 'normal' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
              title="Rozmiar czcionki standardowy 100%"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                fontSize === 'large' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              title="Rozmiar czcionki duży 125%"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('huge')}
              className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                fontSize === 'huge' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
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
