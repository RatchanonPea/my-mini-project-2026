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
import { MatDatepickerModule } from '@angular/material/datepicker';
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
    this.form.controls.groupBy.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.generateReport());
    this.generateReport();
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
}
