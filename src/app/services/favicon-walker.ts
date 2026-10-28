import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FaviconWalkerService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);

  private readonly size = 64;
  // browsers throttle favicon repaints; ~12fps is the most they render evenly
  private readonly frameMs = 80;
  private readonly frameCount = 20;
  private readonly logoUrl = 'assets/images/Logo/CheckenLogo.jpg';

  private timerId?: number;

  start(): void {
    if (this.timerId !== undefined) return;

    const canvas = this.document.createElement('canvas');
    canvas.width = canvas.height = this.size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // pre-render one full cycle so each tick only swaps the icon (steady cadence)
      const frames = Array.from({ length: this.frameCount }, (_, i) => {
        this.drawFrame(ctx, img, i / this.frameCount);
        return canvas.toDataURL('image/png');
      });

      this.setIcon(frames[0]);
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

      let i = 0;
      const tick = () => this.setIcon(frames[i++ % frames.length]);
      this.zone.runOutsideAngular(() => {
        this.timerId = window.setInterval(tick, this.frameMs);

        // nobody sees the tab icon while the tab is hidden, so don't burn timers on it
        this.document.addEventListener('visibilitychange', () => {
          if (this.document.hidden) {
            this.stop();
          } else if (this.timerId === undefined) {
            this.timerId = window.setInterval(tick, this.frameMs);
          }
        });
      });
    };
    img.src = this.logoUrl;
  }

  stop(): void {
    if (this.timerId === undefined) return;
    clearInterval(this.timerId);
    this.timerId = undefined;
  }

  /** Circular logo that waddles: tilts left/right and hops with each step. */
  private drawFrame(ctx: CanvasRenderingContext2D, img: HTMLImageElement, progress: number): void {
    const s = this.size;
    const r = s / 2 - 9;
    const a = progress * Math.PI * 2;

    // only pure sine motion with small amplitude: neighbouring frames differ by
    // just a pixel or two, so the low icon frame rate reads as smooth, not jerky
    const bob = Math.sin(a * 2) * 2;                 // two gentle bobs per cycle (steps)
    const tilt = Math.sin(a) * 0.1;                  // slow sway left/right
    const breathe = 1 + Math.sin(a * 2 + Math.PI / 2) * 0.02;
    const shift = Math.sin(a) * 1.5;                 // slight side-to-side travel

    ctx.clearRect(0, 0, s, s);

    ctx.save();
    ctx.translate(s / 2 + shift, s / 2 + bob);
    ctx.rotate(tilt);
    ctx.scale(1 / breathe, breathe);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.closePath();

    ctx.save();
    ctx.clip();
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side,
      -r, -r, r * 2, r * 2
    );
    ctx.restore();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  }

  private setIcon(href: string): void {
    const head = this.document.head;
    head.querySelectorAll('link[rel="icon"]').forEach(l => l.remove());

    const link = this.document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = href;
    head.appendChild(link);
  }
}
