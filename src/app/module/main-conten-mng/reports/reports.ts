import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <section class="reports-page">
      <div class="page-header">
        <div>
          <h3>รายงานร้านอาหาร</h3>
          <p class="subtitle">เลือกวันและประเภทรายงานเพื่อดูสรุปยอดขายและต้นทุน</p>
        </div>
      </div>

      <div class="report-filters">
        <mat-card class="filter-card">
          <mat-card-header>
            <mat-card-title>ตัวกรองรายงาน</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>ประเภทรายงาน</mat-label>
                <mat-select [(ngModel)]="reportType">
                  <mat-option value="sales">ยอดขาย</mat-option>
                  <mat-option value="expense">ค่าใช้จ่าย</mat-option>
                  <mat-option value="profit">กำไร</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>วันที่เริ่ม</mat-label>
                <input matInput [matDatepicker]="startPicker" [(ngModel)]="dateStart" />
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>วันที่สิ้นสุด</mat-label>
                <input matInput [matDatepicker]="endPicker" [(ngModel)]="dateEnd" />
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>
            </div>
            <div class="filter-actions">
              <button mat-flat-button color="primary" (click)="generateReport()">
                <mat-icon>insights</mat-icon> ดูรายงาน
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="report-summary-grid">
        <mat-card class="summary-card" *ngFor="let summary of reportSummary">
          <mat-card-content>
            <div class="summary-title">{{ summary.label }}</div>
            <div class="summary-value">{{ summary.value }}</div>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [
    `.reports-page { padding: 1.5rem; }
     .page-header { margin-bottom: 1.5rem; }
     .subtitle { color: #6b7280; }
     .report-filters { display: grid; gap: 1rem; margin-bottom: 1.25rem; }
     .filter-card { padding: 1rem; }
     .filter-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; align-items: end; }
     .filter-actions { margin-top: 1rem; }
     .report-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
     .summary-card { padding: 1rem; text-align: center; }
     .summary-title { color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
     .summary-value { font-size: 1.5rem; font-weight: 700; }
    `
  ]
})
export class Reports {
  reportType = 'sales';
  dateStart = new Date();
  dateEnd = new Date();

  reportSummary = [
    { label: 'ยอดขายรวม', value: '฿ 0' },
    { label: 'ค่าใช้จ่ายรวม', value: '฿ 0' },
    { label: 'กำไรสุทธิ', value: '฿ 0' },
  ];

  generateReport(): void {
    const salesValue = 12840;
    const expenseValue = 3840;
    const profitValue = salesValue - expenseValue;

    this.reportSummary = [
      { label: 'ยอดขายรวม', value: `฿ ${salesValue.toLocaleString('th-TH')}` },
      { label: 'ค่าใช้จ่ายรวม', value: `฿ ${expenseValue.toLocaleString('th-TH')}` },
      { label: 'กำไรสุทธิ', value: `฿ ${profitValue.toLocaleString('th-TH')}` },
    ];
  }
}
