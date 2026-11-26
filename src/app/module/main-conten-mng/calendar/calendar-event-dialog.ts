import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, CalendarEvent, PurchaseOrder, SaleItem } from '../../../services/api';
import { META, STATUS_LABEL, openCalendarEvent } from './calendar-meta';

/** Detail of one calendar event (single click). "เปิดข้อมูล" — or a double click on the calendar — goes to the page that owns it. */
@Component({
  selector: 'app-calendar-event-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="head" [ngClass]="meta.tone">
      <mat-icon class="head-icon">{{ meta.icon }}</mat-icon>
      <div>
        <h2 mat-dialog-title>{{ data.type === 'sale' ? 'ยอดขายประจำวัน' : data.title }}</h2>
        <p class="when">{{ meta.label }} · {{ data.date | date:'dd/MM/yyyy':'UTC' }}</p>
      </div>
    </div>

    <mat-dialog-content>
      @switch (data.type) {
        @case ('sale') {
          <p class="big">THB {{ data.amount | number:'1.2-2' }} <small>· {{ data.subtitle }} รายการ</small></p>
          @if (loading()) { <p class="muted">กำลังโหลด...</p> }
          @else if (lines().length) {
            <table class="lines">
              <tr><th>รหัส</th><th>สินค้า</th><th class="r">จำนวน</th><th class="r">รวม</th></tr>
              @for (l of lines(); track l.item_id) {
                <tr><td>{{ l.code }}</td><td>{{ l.product_name }}</td><td class="r">{{ l.quantity | number:'1.0-2' }}</td><td class="r">{{ l.total_price | number:'1.2-2' }}</td></tr>
              }
            </table>
          }
        }
        @case ('expense') {
          <p class="big">THB {{ data.amount | number:'1.2-2' }}</p>
          <dl><dt>หมวดหมู่</dt><dd>{{ data.subtitle || '-' }}</dd></dl>
        }
        @case ('stock_adjust') {
          <dl>
            <dt>ประเภท</dt><dd>{{ statusLabel(data.status) }}</dd>
            <dt>จำนวน (ตัว)</dt><dd>{{ data.amount | number:'1.0-2' }}</dd>
            <dt>หมายเหตุ</dt><dd>{{ data.subtitle || '-' }}</dd>
          </dl>
        }
        @case ('contract_start') { <ng-container *ngTemplateOutlet="contract"></ng-container> }
        @case ('contract_end') { <ng-container *ngTemplateOutlet="contract"></ng-container> }
        @default {
          @if (loading()) { <p class="muted">กำลังโหลด...</p> }
          @else if (po(); as p) {
            <p class="big">THB {{ p.total_cost | number:'1.2-2' }} <small>· {{ p.quantity | number:'1.0-2' }} ตัว × {{ p.unit_cost | number:'1.0-2' }}</small></p>
            <dl>
              <dt>เลขที่</dt><dd>{{ p.code }}</dd>
              <dt>ผู้ขาย</dt><dd>{{ p.supplier_name || '-' }}</dd>
              <dt>สถานะ</dt><dd>{{ statusLabel(p.status) }}</dd>
              <dt>วันที่สั่ง</dt><dd>{{ p.order_date | date:'dd/MM/yyyy':'UTC' }}</dd>
              <dt>วันที่รับ</dt><dd>{{ p.received_date ? (p.received_date | date:'dd/MM/yyyy':'UTC') : '-' }}</dd>
              <dt>เครดิต</dt><dd>{{ p.credit_days === null || p.credit_days === undefined ? '-' : (p.credit_days === 0 ? 'จ่ายสด' : p.credit_days + ' วัน') }}</dd>
              <dt>ครบกำหนดจ่าย</dt><dd>{{ p.due_date ? (p.due_date | date:'dd/MM/yyyy':'UTC') : '-' }}</dd>
              <dt>จ่ายเมื่อ</dt><dd>{{ p.paid_date ? (p.paid_date | date:'dd/MM/yyyy':'UTC') : 'ยังไม่จ่าย' }}</dd>
              @if (p.contract_code) { <dt>ข้อตกลง</dt><dd>{{ p.contract_code }}</dd> }
              @if (p.note) { <dt>หมายเหตุ</dt><dd>{{ p.note }}</dd> }
            </dl>
          } @else {
            <p class="muted">ไม่พบข้อมูลใบสั่งซื้อ</p>
          }
        }
      }
      <ng-template #contract>
        <dl>
          <dt>ผู้ขาย</dt><dd>{{ data.title }}</dd>
          <dt>เลขที่</dt><dd>{{ data.subtitle }}</dd>
          <dt>สถานะ</dt><dd>{{ statusLabel(data.status) }}</dd>
        </dl>
      </ng-template>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>ปิด</button>
      <button mat-flat-button type="button" (click)="open()"><mat-icon>open_in_new</mat-icon> เปิดข้อมูล</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .head { display: flex; align-items: center; gap: 0.9rem; padding: 1.1rem 1.5rem 0.9rem; border-radius: 16px 16px 0 0; }
    .head h2 { margin: 0; padding: 0; }
    .head-icon { font-size: 2rem; width: 2rem; height: 2rem; flex: none; }
    .when { margin: 0.1rem 0 0; font-size: 0.875rem; opacity: 0.8; }
    .head.sale { background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(14, 165, 233, 0.04)); }
    .head.expense { background: linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(236, 72, 153, 0.04)); }
    .head.order { background: linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(124, 58, 237, 0.04)); }
    .head.receive { background: linear-gradient(135deg, rgba(34, 160, 80, 0.22), rgba(34, 160, 80, 0.04)); }
    .head.due { background: linear-gradient(135deg, rgba(245, 158, 11, 0.26), rgba(245, 158, 11, 0.04)); }
    .head.paid { background: linear-gradient(135deg, rgba(20, 184, 166, 0.22), rgba(20, 184, 166, 0.04)); }
    .head.stock { background: linear-gradient(135deg, rgba(107, 114, 128, 0.22), rgba(107, 114, 128, 0.04)); }
    .head.contract { background: linear-gradient(135deg, rgba(234, 88, 12, 0.22), rgba(234, 88, 12, 0.04)); }
    .big { font-size: 1.6rem; font-weight: 700; margin: 0.5rem 0 0.75rem; }
    .big small { font-size: 0.9rem; font-weight: 500; color: var(--app-text-muted); }
    .muted { color: var(--app-text-muted); }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.4rem 1.25rem; margin: 0; }
    dt { color: var(--app-text-muted); }
    dd { margin: 0; font-weight: 600; }
    .lines { width: 100%; border-collapse: collapse; }
    .lines th, .lines td { padding: 0.3rem 0.5rem; border-bottom: 1px solid rgba(194, 65, 12, 0.18); text-align: left; }
    .lines .r { text-align: right; }
  `],
})
export class CalendarEventDialog implements OnInit {
  readonly data = inject<CalendarEvent>(MAT_DIALOG_DATA);
  private api = inject(ApiService);
  private router = inject(Router);
  private ref = inject(MatDialogRef<CalendarEventDialog>);

  readonly meta = META[this.data.type];
  lines = signal<SaleItem[]>([]);
  po = signal<PurchaseOrder | null>(null);
  loading = signal(false);

  statusLabel(status: string | null | undefined): string {
    return STATUS_LABEL[status ?? ''] ?? (status || '-');
  }

  ngOnInit(): void {
    if (this.data.type === 'sale') {
      this.loading.set(true);
      this.api.searchSales({ date: this.data.date, page: 1, pageSize: 100 }).subscribe({
        next: (res) => { this.lines.set(res.items ?? []); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else if (this.data.type.startsWith('po_') && this.data.ref_id) {
      this.loading.set(true);
      this.api.getPurchaseOrder(this.data.ref_id).subscribe({
        next: (po) => { this.po.set(po); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    }
  }

  open(): void {
    this.ref.close();
    openCalendarEvent(this.router, this.data);
  }
}
