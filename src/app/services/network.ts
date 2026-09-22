import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Observable, fromEvent, timer } from 'rxjs';
import { delay, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private zone = inject(NgZone);

  readonly online = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => this.zone.run(() => this.online.set(true)));
    window.addEventListener('offline', () => this.zone.run(() => this.online.set(false)));
  }

  /** Emits once: when the browser is back online, or after a short pause if the server itself is unreachable. */
  whenReady(): Observable<unknown> {
    return this.online()
      ? timer(3000)
      : fromEvent(window, 'online').pipe(take(1), delay(500));
  }
}
