import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'themeMode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.initialMode());

  constructor() {
    effect(() => {
      const mode = this.mode();
      document.documentElement.classList.toggle('dark-theme', mode === 'dark');
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // storage unavailable (private mode): the choice just isn't remembered
      }
    });
  }

  toggle(): void {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    this.mode.update((m) => (m === 'dark' ? 'light' : 'dark'));
    setTimeout(() => root.classList.remove('theme-transition'), 450);
  }

  private initialMode(): ThemeMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // fall through to the system preference
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
