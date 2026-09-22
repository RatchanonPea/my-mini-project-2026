import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject, input } from '@angular/core';

type Mode = 'walk' | 'idle' | 'peck';

// A little white chicken that wanders back and forth inside its container: walks, stops, pecks, turns around, and clucks when clicked.
@Component({
  selector: 'app-chicken',
  standalone: true,
  template: `
    <div class="stage" #stage>
      <div class="runner" #runner [style.width.px]="size()" [style.height.px]="size()" (click)="onClick()" title="คลิกเพื่อทักทายไก่">
        @if (clucking) {
          <div class="bubble" animate.enter="fade-in" animate.leave="fade-out">ก๊ก ก๊ก!</div>
        }
        <div class="wrap" #wrap>
          <svg class="chicken" viewBox="0 0 120 120" role="img" aria-label="ไก่ขาว">
            <g class="leg leg-back">
              <rect x="52" y="82" width="6" height="26" rx="3" fill="#f59e0b" />
              <path d="M45 108 h20 l-3 5 h-14z" fill="#f59e0b" />
            </g>
            <path d="M14 46 Q4 30 22 30 Q18 42 30 50z" fill="#ffffff" stroke="#e5e7eb" stroke-width="2" />
            <ellipse cx="58" cy="62" rx="40" ry="30" fill="#ffffff" stroke="#e5e7eb" stroke-width="2" />
            <g class="wing">
              <path d="M38 56 Q60 46 72 64 Q60 82 40 74 Q32 64 38 56z" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="2" />
            </g>
            <g class="head">
              <circle cx="94" cy="42" r="19" fill="#ffffff" stroke="#e5e7eb" stroke-width="2" />
              <path d="M84 26 q3-10 8-4 q3-9 9-2 q6-6 7 6 q-12 6-24 0z" fill="#dc2626" />
              <path d="M110 42 l12 5 l-12 5z" fill="#f97316" />
              <path d="M106 54 q5 10 -1 13 q-6-4 1-13z" fill="#dc2626" />
              <circle cx="100" cy="40" r="3" fill="#1f2937" />
              <circle cx="99" cy="39" r="1" fill="#ffffff" />
              <ellipse cx="90" cy="49" rx="4.5" ry="3" fill="#fca5a5" opacity="0.7" />
            </g>
            <g class="leg leg-front">
              <rect x="68" y="82" width="6" height="26" rx="3" fill="#fb923c" />
              <path d="M61 108 h20 l-3 5 h-14z" fill="#fb923c" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; position: absolute; inset: 0; pointer-events: none; }
    .stage { position: relative; width: 100%; height: 100%; }
    .runner { position: absolute; bottom: 0; left: 0; cursor: pointer; pointer-events: auto; }
    .wrap { width: 100%; height: 100%; transition: transform 0.25s ease; }
    .chicken { width: 100%; height: 100%; overflow: visible; }
    .chicken .leg, .chicken .head { transform-box: fill-box; transform-origin: 50% 0; }
    .chicken .head { transform-origin: 30% 90%; }
    .wrap.hop .chicken { animation: hop 0.5s ease-out 2; }
    .wrap.walking .chicken { animation: bob 0.7s ease-in-out infinite; }
    .wrap.walking .leg-front { animation: stepFront 0.7s ease-in-out infinite alternate; }
    .wrap.walking .leg-back { animation: stepBack 0.7s ease-in-out infinite alternate; }
    .wrap.pecking .head { animation: peck 0.6s ease-in-out infinite; }
    .bubble {
      position: absolute;
      top: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 10px;
      border-radius: 12px;
      background: #fff7ed;
      border: 2px solid #ea580c;
      color: #b91c1c;
      font: 700 0.8rem sans-serif;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 5;
    }
    @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    @keyframes peck { 0%, 100% { transform: rotate(0deg); } 45% { transform: rotate(38deg) translateY(4px); } }
    @keyframes hop { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
    @keyframes stepFront { from { transform: rotate(-28deg); } to { transform: rotate(28deg); } }
    @keyframes stepBack { from { transform: rotate(28deg); } to { transform: rotate(-28deg); } }
  `,
})
export class Chicken implements AfterViewInit, OnDestroy {
  readonly size = input(34);

  @ViewChild('stage') private stageRef!: ElementRef<HTMLElement>;
  @ViewChild('runner') private runnerRef!: ElementRef<HTMLElement>;
  @ViewChild('wrap') private wrapRef!: ElementRef<HTMLElement>;

  clucking = false;

  private zone = inject(NgZone);
  private readonly speed = 22;
  private x = 12;
  private dir: 1 | -1 = 1;
  private mode: Mode = 'idle';
  private modeEnd = 0;
  private lastTs = 0;
  private raf = 0;
  private cluckTimer: ReturnType<typeof setTimeout> | undefined;

  ngAfterViewInit(): void {
    this.applyPosition();
    this.zone.runOutsideAngular(() => {
      this.setMode('idle', 800);
      this.raf = requestAnimationFrame((ts) => this.tick(ts));
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.cluckTimer);
  }

  onClick(): void {
    this.clucking = true;
    this.setMode('idle', 1400);
    const wrap = this.wrapRef.nativeElement;
    wrap.classList.remove('hop');
    void wrap.offsetWidth;
    wrap.classList.add('hop');
    clearTimeout(this.cluckTimer);
    this.cluckTimer = setTimeout(() => {
      this.clucking = false;
      wrap.classList.remove('hop');
    }, 1400);
  }

  private rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private setMode(mode: Mode, durationMs: number): void {
    this.mode = mode;
    this.modeEnd = performance.now() + durationMs;
    const wrap = this.wrapRef.nativeElement;
    wrap.classList.toggle('walking', mode === 'walk');
    wrap.classList.toggle('pecking', mode === 'peck');
  }

  private turn(): void {
    this.dir = this.dir === 1 ? -1 : 1;
    this.applyPosition();
  }

  private applyPosition(): void {
    this.runnerRef.nativeElement.style.transform = `translateX(${this.x}px)`;
    this.wrapRef.nativeElement.style.transform = `scaleX(${this.dir})`;
  }

  private pickNext(): void {
    if (this.mode === 'walk') {
      this.setMode(Math.random() < 0.55 ? 'peck' : 'idle', this.rand(1200, 2600));
      return;
    }
    if (Math.random() < 0.2) {
      this.turn();
      this.setMode('idle', this.rand(500, 900));
    } else if (Math.random() < 0.75) {
      this.setMode('walk', this.rand(2000, 5000));
    } else {
      this.setMode('peck', this.rand(1200, 2400));
    }
  }

  private tick(ts: number): void {
    const dt = this.lastTs ? Math.min(ts - this.lastTs, 64) : 16;
    this.lastTs = ts;

    if (performance.now() >= this.modeEnd) {
      this.pickNext();
    }

    if (this.mode === 'walk') {
      const maxX = Math.max(0, this.stageRef.nativeElement.clientWidth - this.size());
      this.x += this.dir * this.speed * (dt / 1000);
      if (this.x <= 0 || this.x >= maxX) {
        this.x = Math.min(Math.max(this.x, 0), maxX);
        this.turn();
        this.setMode('idle', this.rand(700, 1400));
      }
      this.applyPosition();
      const left = this.stageRef.nativeElement.getBoundingClientRect().left;
      window.dispatchEvent(new CustomEvent('chicken-step', { detail: { x: left + this.x + this.size() / 2, half: this.size() / 2 } }));
    }

    this.raf = requestAnimationFrame((next) => this.tick(next));
  }
}
