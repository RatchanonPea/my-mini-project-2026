import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { ApiService, ReportGroupBy, ReportPeriod, SummaryTotals } from '../../../services/api';
import { toYmd } from '../../../common/helper';
import { Pager } from '../../../shared/pager/pager';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatTableModule, MatButtonToggleModule, Pager,
  ],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss'],
})
export class Reports implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  readonly groupByLabel: Record<string, string> = { day: 'รายวัน', week: 'รายสัปดาห์', month: 'รายเดือน', year: 'รายปี' };
  displayedColumns = ['period', 'sales_total', 'sale_qty', 'purchase_cost', 'chicken_received', 'expense_total', 'profit'];

  // Jumping to an old year one date-picker click at a time is tedious — offer a direct dropdown
  // that fills the whole year (Jan 1 - Dec 31) into the date range instead.
  readonly years: number[] = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i);

  form = this.fb.nonNullable.group({
    groupBy: ['day' as ReportGroupBy, Validators.required],
    dateStart: [this.monthAgo(), Validators.required],
    dateEnd: [new Date(), Validators.required],
  });

  summary: SummaryTotals | null = null;
  periods: ReportPeriod[] = [];
  pagedPeriods: ReportPeriod[] = [];
  loading = false;

  readonly pageSize = 10;
  pageIndex = 0;

  ngOnInit(): void {
    this.form.controls.groupBy.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((groupBy) => {
      this.snapDatesToGroupBy(groupBy);
      this.generateReport();
    });
    this.generateReport();
  }

  // Monday of the week containing this date — matches the Monday-start convention used
  // everywhere else in the app (periodLabel, the backend's periodExpr()).
  private mondayOf(d: Date): Date {
    const dayOfWeek = (d.getDay() + 6) % 7; // 0=Monday..6=Sunday
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);
    return monday;
  }

  // Switching mode alone doesn't touch the date pickers, so whichever field the user hasn't
  // re-picked yet is left showing a leftover full date (e.g. "8/24/2026") even though the label
  // now says "ปีเริ่ม" — snap both fields to that period's boundaries immediately on switch.
  private snapDatesToGroupBy(groupBy: ReportGroupBy): void {
    const start = this.form.controls.dateStart.value;
    const end = this.form.controls.dateEnd.value;
    if (groupBy === 'year') {
      this.form.patchValue({
        dateStart: new Date(start.getFullYear(), 0, 1),
        dateEnd: new Date(end.getFullYear(), 11, 31),
      });
    } else if (groupBy === 'month') {
      this.form.patchValue({
        dateStart: new Date(start.getFullYear(), start.getMonth(), 1),
        dateEnd: new Date(end.getFullYear(), end.getMonth() + 1, 0),
      });
    } else if (groupBy === 'week') {
      const startMonday = this.mondayOf(start);
      const endMonday = this.mondayOf(end);
      const endSunday = new Date(endMonday);
      endSunday.setDate(endMonday.getDate() + 6);
      this.form.patchValue({ dateStart: startMonday, dateEnd: endSunday });
    }
  }

  private monthAgo(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d;
  }

  // Gregorian-year formatting (matches the dd/MM/yyyy dates shown everywhere else in this app) —
  // Intl's 'th-TH' locale defaults to the Buddhist calendar (พ.ศ.), which would look inconsistent here.
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

  periodLabel(period: string): string {
    const d = new Date(period + 'T00:00:00Z');
    const groupBy = this.form.controls.groupBy.value;
    if (groupBy === 'year') return d.getUTCFullYear().toString();
    if (groupBy === 'month') return `${Reports.THAI_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    if (groupBy === 'week') {
      const end = new Date(d);
      end.setUTCDate(end.getUTCDate() + 6);
      return `${this.ddmm(d)} - ${this.ddmmyyyy(end)}`;
    }
    return this.ddmmyyyy(d);
  }

  generateReport(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const from = toYmd(v.dateStart);
    const to = toYmd(v.dateEnd);
    this.loading = true;

    this.api.getReportSummary(from, to).subscribe((r) => (this.summary = r));
    this.api.getReportBreakdown(from, to, v.groupBy).subscribe({
      next: (r) => {
        this.periods = r.periods;
        this.pageIndex = 0;
        this.updatePage();
        this.loading = false;
      },
      error: () => {
        this.periods = [];
        this.pagedPeriods = [];
        this.loading = false;
      },
    });
  }

  private updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedPeriods = this.periods.slice(start, start + this.pageSize);
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.updatePage();
  }

  onYearSelect(year: number): void {
    this.form.patchValue({
      dateStart: new Date(year, 0, 1),
      dateEnd: new Date(year, 11, 31),
    });
    this.generateReport();
  }

  // The date pickers' own granularity follows the selected grouping — "รายปี" only needs a year
  // picked, "รายเดือน" only a month, so there's no reason to make the user drill into a specific
  // day for either. "รายสัปดาห์"/"รายวัน" still use the normal day calendar.
  get pickerStartView(): 'multi-year' | 'year' | 'month' {
    const groupBy = this.form.controls.groupBy.value;
    if (groupBy === 'year') return 'multi-year';
    if (groupBy === 'month') return 'year';
    return 'month';
  }

  // Fires when a year cell is clicked with startView="multi-year" (รายปี mode) — closing
  // immediately stops Material from drilling further into the month/day views.
  chosenYear(date: Date, picker: MatDatepicker<Date>, which: 'start' | 'end'): void {
    const y = date.getFullYear();
    const value = which === 'start' ? new Date(y, 0, 1) : new Date(y, 11, 31);
    this.form.controls[which === 'start' ? 'dateStart' : 'dateEnd'].setValue(value);
    picker.close();
  }

  // Fires when a month cell is clicked with startView="year" (รายเดือน mode) — closes before
  // Material drills into the day view.
  chosenMonth(date: Date, picker: MatDatepicker<Date>, which: 'start' | 'end'): void {
    const y = date.getFullYear();
    const m = date.getMonth();
    const value = which === 'start' ? new Date(y, m, 1) : new Date(y, m + 1, 0);
    this.form.controls[which === 'start' ? 'dateStart' : 'dateEnd'].setValue(value);
    picker.close();
  }
}
