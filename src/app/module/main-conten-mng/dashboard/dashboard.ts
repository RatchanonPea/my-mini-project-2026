import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ApiService, ReportGroupBy } from '../../../services/api';
import { toYmd } from '../../../common/helper';
import { ReportChart, ReportChartSeries } from '../../../shared/report-chart/report-chart';

export interface DashboardTopProduct {
  id: number;
  name: string;
  sold: number;
  revenue: number;
}

const STAT_DEFS = [
  { title: 'ยอดขาย', color: 'primary', prefix: '฿ ' },
  { title: 'ค่าใช้จ่าย', color: 'warn', prefix: '฿ ' },
  { title: 'กำไรสุทธิ', color: 'accent', prefix: '฿ ' },
  { title: 'รายการขาย', color: 'info', prefix: '' },
  { title: 'ต้นทุนไก่', color: 'accent', prefix: '฿ ' },
  { title: 'กำไรจากไก่', color: 'primary', prefix: '฿ ' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    ReportChart,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private countUpFrames = new Map<number, number>();
  private readonly countUpMs = 900;

  readonly groupByLabel: Record<string, string> = { day: 'รายวัน', week: 'รายสัปดาห์', month: 'รายเดือน', year: 'รายปี' };
  readonly groupByOptions: ReportGroupBy[] = ['day', 'week', 'month', 'year'];

  selectedDate: Date = new Date();
  groupBy: ReportGroupBy = 'day';
  periodLabel = '';

  // Jumping to an old year one ‹ › step at a time is tedious — offer a direct dropdown instead.
  readonly years: number[] = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i);

  stats = STAT_DEFS.map((def) => ({ ...def, value: def.prefix + '0', amount: 0 }));

  displayedColumns: string[] = ['id', 'name', 'sold', 'revenue'];
  dataSource = new MatTableDataSource<DashboardTopProduct>([]);

  chartLabels: string[] = [];
  chartSeries: ReportChartSeries[] = [];
  // how many periods of trailing history the trend chart shows, per grouping
  private readonly TREND_SPAN: Record<ReportGroupBy, number> = { day: 14, week: 8, month: 12, year: 6 };

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.api.getDashboardSummary(toYmd(this.selectedDate), this.groupBy).subscribe((s) => {
      [s.sales_total, s.expense_total, s.profit, s.sale_item_count, s.chicken_cost, s.chicken_profit].forEach((amount, i) => this.countUp(i, amount));
      this.dataSource.data = s.top_products.map((t, i) => ({ id: i + 1, name: t.product_name, sold: t.sold, revenue: t.revenue }));
      this.periodLabel = this.formatPeriod(s.period.from, s.period.to);
    });
    this.loadTrend();
  }

  // A short trend leading up to (and including) the period shown in the stat cards — gives the
  // big numbers above some context instead of leaving them as an isolated snapshot.
  private loadTrend(): void {
    const span = this.TREND_SPAN[this.groupBy];
    const from = new Date(this.selectedDate);
    if (this.groupBy === 'year') from.setFullYear(from.getFullYear() - (span - 1));
    else if (this.groupBy === 'month') from.setMonth(from.getMonth() - (span - 1));
    else if (this.groupBy === 'week') from.setDate(from.getDate() - (span - 1) * 7);
    else from.setDate(from.getDate() - (span - 1));

    this.api.getReportBreakdown(toYmd(from), toYmd(this.selectedDate), this.groupBy).subscribe({
      next: (r) => {
        // periods arrives newest-first — reversed here so the trend reads left-to-right in
        // chronological order, same as the Reports page's chart.
        const chronological = [...r.periods].reverse();
        this.chartLabels = chronological.map((p) => this.trendLabel(p.period));
        this.chartSeries = [
          { label: 'ยอดขาย', data: chronological.map((p) => p.sales_total), color: '#16a34a' },
          { label: 'ค่าใช้จ่ายอื่น', data: chronological.map((p) => p.expense_total), color: '#b91c1c' },
          { label: 'กำไร', data: chronological.map((p) => p.profit), color: '#ea580c' },
        ];
      },
      error: () => {
        this.chartLabels = [];
        this.chartSeries = [];
      },
    });
  }

  private trendLabel(period: string): string {
    const d = new Date(period + 'T00:00:00Z');
    if (this.groupBy === 'year') return d.getUTCFullYear().toString();
    if (this.groupBy === 'month') return `${Dashboard.THAI_MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
    if (this.groupBy === 'week') return this.ddmm(d);
    return this.ddmm(d);
  }

  // Gregorian-year formatting (matches dd/MM/yyyy shown everywhere else) — 'th-TH' Intl formatting
  // defaults to the Buddhist calendar, which would look inconsistent here.
  private static readonly THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  private ddmm(d: Date): string {
    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private ddmmyyyy(d: Date): string {
    return `${this.ddmm(d)}/${d.getUTCFullYear()}`;
  }

  private formatPeriod(from: string, to: string): string {
    const start = new Date(from + 'T00:00:00Z');
    if (this.groupBy === 'year') return start.getUTCFullYear().toString();
    if (this.groupBy === 'month') return `${Dashboard.THAI_MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
    if (this.groupBy === 'week') return `${this.ddmm(start)} - ${this.ddmmyyyy(new Date(to + 'T00:00:00Z'))}`;
    return this.ddmmyyyy(start);
  }

  ngOnDestroy(): void {
    this.countUpFrames.forEach((frame) => cancelAnimationFrame(frame));
  }

  // the number in a stat box climbs (or falls) from what it showed to the new value
  private countUp(index: number, target: number): void {
    const stat = this.stats[index];
    const from = stat.amount;
    const show = (n: number) => (stat.value = stat.prefix + Math.round(n).toLocaleString('th-TH'));
    cancelAnimationFrame(this.countUpFrames.get(index) ?? 0);
    stat.amount = target;

    if (from === target || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      show(target);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / this.countUpMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      show(from + (target - from) * eased);
      if (progress < 1) {
        this.countUpFrames.set(index, requestAnimationFrame(step));
      }
    };
    this.countUpFrames.set(index, requestAnimationFrame(step));
  }

  get totalRevenue(): number {
    return this.dataSource.data.reduce((sum, item) => sum + item.revenue, 0);
  }

  get totalSold(): number {
    return this.dataSource.data.reduce((sum, item) => sum + item.sold, 0);
  }

  get bestSellingMenu(): string {
    if (!this.dataSource.data.length) {
      return '-';
    }
    return this.dataSource.data.reduce((best, item) => item.revenue > best.revenue ? item : best, this.dataSource.data[0]).name;
  }

  get menuCount(): number {
    return this.dataSource.data.length;
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
    this.loadSummary();
  }

  onGroupByChange(groupBy: ReportGroupBy): void {
    this.groupBy = groupBy;
    this.loadSummary();
  }

  // Steps the reference date by one unit of the current period, so "รายปี" can browse other
  // years (previous/next), "รายเดือน" other months, etc. — not just the period containing today.
  stepPeriod(direction: -1 | 1): void {
    const d = new Date(this.selectedDate);
    if (this.groupBy === 'year') d.setFullYear(d.getFullYear() + direction);
    else if (this.groupBy === 'month') d.setMonth(d.getMonth() + direction);
    else if (this.groupBy === 'week') d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    this.selectedDate = d;
    this.loadSummary();
  }

  get selectedYear(): number {
    return this.selectedDate.getFullYear();
  }

  // Direct jump to an old year — keeps the current month/day (so switching from "รายปี" 2026
  // back to "รายเดือน" still lands on the same month) instead of resetting to January.
  onYearSelect(year: number): void {
    const d = new Date(this.selectedDate);
    d.setFullYear(year);
    this.selectedDate = d;
    this.loadSummary();
  }
}
