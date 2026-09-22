import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../services/api';
import { toYmd } from '../../../common/helper';

export interface DashboardTopProduct {
  id: number;
  name: string;
  sold: number;
  revenue: number;
}

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
    MatButtonModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private countUpFrames = new Map<number, number>();
  private readonly countUpMs = 900;

  selectedDate: Date = new Date();

  stats = [
    { title: 'ยอดขายวันนี้', value: '฿ 0', color: 'primary', prefix: '฿ ', amount: 0 },
    { title: 'ค่าใช้จ่ายวันนี้', value: '฿ 0', color: 'warn', prefix: '฿ ', amount: 0 },
    { title: 'กำไรสุทธิ', value: '฿ 0', color: 'accent', prefix: '฿ ', amount: 0 },
    { title: 'รายการขายวันนี้', value: '0', color: 'info', prefix: '', amount: 0 },
    { title: 'ต้นทุนไก่วันนี้', value: '฿ 0', color: 'accent', prefix: '฿ ', amount: 0 },
    { title: 'กำไรจากไก่วันนี้', value: '฿ 0', color: 'primary', prefix: '฿ ', amount: 0 }
  ];

  displayedColumns: string[] = ['id', 'name', 'sold', 'revenue'];
  dataSource = new MatTableDataSource<DashboardTopProduct>([]);

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.api.getDashboardSummary(toYmd(this.selectedDate)).subscribe((s) => {
      [s.sales_total, s.expense_total, s.profit, s.sale_item_count, s.chicken_cost, s.chicken_profit].forEach((amount, i) => this.countUp(i, amount));
      this.dataSource.data = s.top_products.map((t, i) => ({ id: i + 1, name: t.product_name, sold: t.sold, revenue: t.revenue }));
    });
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
}

