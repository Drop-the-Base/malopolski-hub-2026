import { useState, useEffect } from 'react';

export type ContrastMode = 'default' | 'yellow-black' | 'black-white';
export type FontSize = 'normal' | 'large' | 'huge';

class AccessibilityStore {
  private contrastMode: ContrastMode = 'default';
  private fontSize: FontSize = 'normal';
  private etrMode: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Odczyt z localStorage w przeglądarce
    if (typeof window !== 'undefined') {
      const savedContrast = localStorage.getItem('mhis_contrast') as ContrastMode;
      const savedFontSize = localStorage.getItem('mhis_font') as FontSize;
      const savedEtr = localStorage.getItem('mhis_etr') === 'true';

      if (savedContrast) this.contrastMode = savedContrast;
      if (savedFontSize) this.fontSize = savedFontSize;
      if (savedEtr !== undefined) this.etrMode = savedEtr;

      this.applyDOMClasses();
    }
  }

  private applyDOMClasses() {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const html = document.documentElement;

    body.classList.remove('theme-yellow-black', 'theme-black-white');
    if (this.contrastMode === 'yellow-black') body.classList.add('theme-yellow-black');
    if (this.contrastMode === 'black-white') body.classList.add('theme-black-white');
    body.classList.toggle('etr-mode', this.etrMode);

    html.classList.remove('font-large', 'font-huge');
    if (this.fontSize === 'large') html.classList.add('font-large');
    if (this.fontSize === 'huge') html.classList.add('font-huge');
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.applyDOMClasses();
    this.listeners.forEach((cb) => cb());
  }

  public getContrastMode() { return this.contrastMode; }
  public getFontSize() { return this.fontSize; }
  public isEtrMode() { return this.etrMode; }

  public setContrastMode(mode: ContrastMode) {
    this.contrastMode = mode;
    localStorage.setItem('mhis_contrast', mode);
    this.notify();
  }

  public setFontSize(size: FontSize) {
    this.fontSize = size;
    localStorage.setItem('mhis_font', size);
    this.notify();
  }

  public toggleEtrMode() {
    this.etrMode = !this.etrMode;
    localStorage.setItem('mhis_etr', String(this.etrMode));
    this.notify();
  }
}

export const accessibilityStore = new AccessibilityStore();

export function useAccessibility() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return accessibilityStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  return {
    contrastMode: accessibilityStore.getContrastMode(),
    fontSize: accessibilityStore.getFontSize(),
    etrMode: accessibilityStore.isEtrMode(),
    setContrastMode: (mode: ContrastMode) => accessibilityStore.setContrastMode(mode),
    setFontSize: (size: FontSize) => accessibilityStore.setFontSize(size),
    toggleEtrMode: () => accessibilityStore.toggleEtrMode(),
    toggleHighContrast: () => {
      const cur = accessibilityStore.getContrastMode();
      accessibilityStore.setContrastMode(cur === 'default' ? 'yellow-black' : 'default');
    }
  };
}
