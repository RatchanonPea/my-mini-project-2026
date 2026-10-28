import { ApplicationRef, Injectable, effect, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'themeMode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly appRef = inject(ApplicationRef);

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
    const next: ThemeMode = this.mode() === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const apply = () => {
      // synchronous (not via the effect) so the browser's "after" snapshot already has the new theme
      root.classList.toggle('dark-theme', next === 'dark');
      this.mode.set(next);
      this.appRef.tick();
    };

    // Whole page cross-fades at once (browser snapshots old and new), instead of each element
    // transitioning on its own timing, which looked like things switching one by one.
    const start = (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition;
    if (start && !reduceMotion) {
      // per-element transitions (table cells, cards...) must not run: the "after" snapshot has to be the
      // finished new theme, otherwise some elements are still mid-way and the fade shows a light/dark mix
      root.classList.add('theme-switching');
      const transition = start.call(document, apply) as { finished?: Promise<unknown> } | undefined;
      const done = () => root.classList.remove('theme-switching');
      transition?.finished ? transition.finished.then(done, done) : setTimeout(done, 700);
      return;
    }

    root.classList.add('theme-transition');
    apply();
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
