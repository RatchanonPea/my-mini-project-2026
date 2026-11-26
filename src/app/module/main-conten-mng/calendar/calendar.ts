import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, CalendarEvent, CalendarEventType } from '../../../services/api';
import { ConfirmDialog, DialogErrorHtmlConfirm, DialogSuccess, toYmd } from '../../../common/helper';
import { NoData } from '../../../shared/no-data/no-data';
import { CalendarEventDialog } from './calendar-event-dialog';
import { META, STATUS_LABEL, openCalendarEvent } from './calendar-meta';

interface DayCell {
  ymd: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const TYPES = Object.keys(META) as CalendarEventType[];
const MAX_CHIPS = 3;
const CLICK_DELAY_MS = 220;
const HOVER_CARD_WIDTH = 300;

interface HoverState {
  event: CalendarEvent;
  left: number;
  top: number;
  /** the card opens upwards when the chip is near the bottom of the screen */
  above: boolean;
}

/** One calendar for everything dated in the shop: sales, expenses, purchase orders and payments, stock adjustments, agreements. */
@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule, MatSelectModule, NoData],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss'],
})
export class CalendarPage implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly meta = META;
  readonly types = TYPES;
  readonly monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  readonly weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  readonly maxChips = MAX_CHIPS;
  readonly today = toYmd(new Date());

  month = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  events = signal<CalendarEvent[]>([]);
  hidden = signal<ReadonlySet<CalendarEventType>>(new Set());
  selected = signal(this.today);
  loading = signal(false);
  hover = signal<HoverState | null>(null);
  private clickTimer: ReturnType<typeof setTimeout> | null = null;

  /** years offered in the jump list: ten back from the shown month (and from this year), two ahead */
  years = computed(() => {
    const now = new Date().getFullYear();
    const lo = Math.min(now, this.month().getFullYear()) - 10;
    const hi = Math.max(now, this.month().getFullYear()) + 2;
    return Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);
  });

  title = computed(() => this.month().toLocaleDateString('th-TH-u-ca-gregory', { month: 'long', year: 'numeric' }));
  selectedLabel = computed(() => new Date(`${this.selected()}T00:00:00`).toLocaleDateString('th-TH-u-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

  private visible = computed(() => this.events().filter((e) => !this.hidden().has(e.type)));

  cells = computed<DayCell[]>(() => {
    const first = this.month();
    const byDay = new Map<string, CalendarEvent[]>();
    for (const e of this.visible()) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    const weeks = Math.ceil((first.getDay() + new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) / 7);
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const ymd = toYmd(d);
      return { ymd, day: d.getDate(), inMonth: d.getMonth() === first.getMonth(), isToday: ymd === this.today, events: byDay.get(ymd) ?? [] };
    });
  });

  selectedEvents = computed(() => this.cells().find((c) => c.ymd === this.selected())?.events ?? []);

  /** totals of the shown month only (not the leading/trailing days of neighbouring months) */
  summary = computed(() => {
    const m = this.month();
    const prefix = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
    const inMonth = this.events().filter((e) => e.date.startsWith(prefix));
    const sum = (type: CalendarEventType) => inMonth.filter((e) => e.type === type).reduce((t, e) => t + (e.amount ?? 0), 0);
    const due = inMonth.filter((e) => e.type === 'po_due');
    return { sales: sum('sale'), expenses: sum('expense'), dueCount: due.length, dueTotal: due.reduce((t, e) => t + (e.amount ?? 0), 0) };
  });

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.cancelClick();
  }

  load(): void {
    const m = this.month();
    const from = toYmd(new Date(m.getFullYear(), m.getMonth(), 1 - m.getDay()));
    const to = toYmd(new Date(m.getFullYear(), m.getMonth() + 1, 6));
    this.loading.set(true);
    this.api.getCalendarEvents(from, to).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (list) => { this.events.set(list); this.loading.set(false); },
      error: () => { this.events.set([]); this.loading.set(false); },
    });
  }

  shift(months: number): void {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() + months, 1));
    this.load();
  }

  /** jump straight to a month and/or year (the dropdowns) */
  jumpTo(year: number, monthIndex: number): void {
    this.month.set(new Date(year, monthIndex, 1));
    this.load();
  }

  goToday(): void {
    const now = new Date();
    this.month.set(new Date(now.getFullYear(), now.getMonth(), 1));
    this.selected.set(this.today);
    this.load();
  }

  selectDay(cell: DayCell): void {
    this.selected.set(cell.ymd);
    if (!cell.inMonth) {
      this.month.set(new Date(Number(cell.ymd.slice(0, 4)), Number(cell.ymd.slice(5, 7)) - 1, 1));
      this.load();
    }
  }

  toggleType(type: CalendarEventType): void {
    const next = new Set(this.hidden());
    if (!next.delete(type)) next.add(type);
    this.hidden.set(next);
  }

  label(e: CalendarEvent): string {
    return e.type === 'sale' ? `ขาย ${Number(e.amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : e.title;
  }

  tip(e: CalendarEvent): string {
    const amount = e.amount === null ? '' : ` · THB ${Number(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    return `${META[e.type].label}: ${e.title}${amount}`;
  }

  statusLabel(e: CalendarEvent): string {
    return e.status ? (STATUS_LABEL[e.status] ?? e.status) : '';
  }

  /**
   * hover: a glass preview card next to the chip. Positioned against the calendar page itself (not the viewport):
   * the app shell around the page has a transform/filter, which would make "position: fixed" drift away from the chip.
   */
  showHover(e: CalendarEvent, ev: Event): void {
    const page = this.host.nativeElement.querySelector('.cal-page') as HTMLElement | null;
    if (!page) return;
    const chip = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const box = page.getBoundingClientRect();
    const above = chip.bottom + 190 > window.innerHeight && chip.top > 190;
    this.hover.set({
      event: e,
      left: Math.max(8, Math.min(chip.left - box.left, box.width - HOVER_CARD_WIDTH - 8)),
      top: (above ? chip.top : chip.bottom) - box.top + (above ? -6 : 6),
      above,
    });
  }

  hideHover(): void {
    this.hover.set(null);
  }

  /** one click: the detail. Waits a moment so a double click (open the data itself) does not also pop the detail up. */
  onClick(e: CalendarEvent): void {
    this.cancelClick();
    this.hideHover();
    this.clickTimer = setTimeout(() => {
      this.clickTimer = null;
      this.dialog.open(CalendarEventDialog, { width: '540px', maxWidth: '95vw', panelClass: 'glass-dialog', data: e });
    }, CLICK_DELAY_MS);
  }

  /** double click: the page that owns the data */
  onDblClick(e: CalendarEvent): void {
    this.cancelClick();
    this.hideHover();
    openCalendarEvent(this.router, e);
  }

  private cancelClick(): void {
    if (this.clickTimer) clearTimeout(this.clickTimer);
    this.clickTimer = null;
  }

  async pay(e: CalendarEvent): Promise<void> {
    if (!e.ref_id) return;
    const total = Number(e.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (!(await ConfirmDialog('ยืนยันการจ่ายเงิน', `${e.subtitle}: จ่ายให้ ${e.title} THB ${total} (วันนี้)`))) return;
    this.api.payPurchase(e.ref_id, toYmd(new Date())).subscribe({
      next: () => { DialogSuccess('บันทึกการจ่ายเงินเรียบร้อยแล้ว'); this.load(); },
      error: (err) => DialogErrorHtmlConfirm(err?.error?.message ?? 'บันทึกการจ่ายเงินไม่สำเร็จ'),
    });
  }
}
