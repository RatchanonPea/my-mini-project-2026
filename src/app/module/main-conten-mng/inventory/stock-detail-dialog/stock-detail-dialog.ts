import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, LedgerItem, PurchaseOrder, SalesOfDayLine } from '../../../../services/api';

export type StockDetailData = { kind: 'ledger'; row: LedgerItem } | { kind: 'purchase'; po: PurchaseOrder };

const TYPE_LABEL: Record<string, string> = { receive: 'รับเข้า', sale: 'ขายออก', waste: 'ของเสีย', adjust: 'ปรับยอด' };
const TYPE_ICON: Record<string, string> = { receive: 'inventory', sale: 'point_of_sale', waste: 'delete_sweep', adjust: 'tune' };
const STATUS_LABEL: Record<string, string> = { ordered: 'สั่งแล้ว', received: 'รับแล้ว', cancelled: 'ยกเลิก' };

@Component({
  selector: 'app-stock-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    @if (data.kind === 'ledger') {
      @let row = data.row;
      <h2 mat-dialog-title class="detail-title">
        <mat-icon>{{ icon[row.type] }}</mat-icon>
        <span>{{ typeLabel[row.type] }} <small>{{ row.ref_code }}</small></span>
      </h2>
      <mat-dialog-content>
        <div class="big-qty" [class.qty-in]="row.quantity > 0" [class.qty-out]="row.quantity < 0">
          {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity | number:'1.0-2' }} <small>ตัว</small>
        </div>
        <dl class="detail-list">
          <dt>วันที่</dt><dd>{{ row.ledger_date | date:'dd/MM/yyyy':'UTC' }}</dd>
          <dt>คงเหลือหลังรายการนี้</dt><dd>{{ row.balance_after | number:'1.0-2' }} ตัว</dd>
          @if (row.event_at) {
            <dt>{{ row.type === 'receive' ? 'เวลาที่รับ' : 'บันทึกล่าสุดเมื่อ' }}</dt><dd>{{ row.event_at | date:'dd/MM/yyyy HH:mm':'UTC' }} น.</dd>
          }
          @if (row.type === 'receive') {
            <dt>ผู้ขาย</dt><dd>{{ row.supplier || '-' }}</dd>
            <dt>ราคาต่อตัว</dt><dd>{{ row.unit_cost | currency:'THB ':'symbol':'1.0-2' }}</dd>
            <dt>รวมเป็นเงิน</dt><dd>{{ row.total_cost | currency:'THB ':'symbol':'1.0-2' }}</dd>
            <dt>รับโดย</dt><dd>{{ row.by_name || '-' }}</dd>
          }
          @if (row.type === 'waste' || row.type === 'adjust') {
            <dt>บันทึกโดย</dt><dd>{{ row.by_name || '-' }}</dd>
          }
          @if (row.type !== 'sale') {
            <dt>หมายเหตุ</dt><dd>{{ row.note || '-' }}</dd>
          }
        </dl>

        @if (row.type === 'sale') {
          <h3 class="sub-title">รายการขายไก่ของวันนี้</h3>
          <div class="lines-wrap">
            <table class="lines">
              <thead><tr><th>เมนู</th><th>จำนวน</th><th>ใช้ไก่ (ตัว)</th><th>ยอดขาย</th></tr></thead>
              <tbody>
                @for (line of lines; track line.code) {
                  <tr>
                    <td>{{ line.product_name }}</td>
                    <td>{{ line.quantity }}</td>
                    <td>{{ line.chickens_used | number:'1.0-2' }}</td>
                    <td>{{ line.total_price | currency:'THB ':'symbol':'1.0-0' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty">{{ loadingLines ? 'กำลังโหลด...' : 'ไม่มีรายการ' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </mat-dialog-content>
    } @else {
      @let po = data.po;
      <h2 mat-dialog-title class="detail-title">
        <mat-icon>local_shipping</mat-icon>
        <span>ใบสั่งซื้อ <small>{{ po.code }}</small></span>
        <span class="po-badge" [ngClass]="'po-' + po.status">{{ statusLabel[po.status] }}</span>
      </h2>
      <mat-dialog-content>
        <div class="big-qty">{{ po.quantity | number:'1.0-2' }} <small>ตัว</small></div>
        <dl class="detail-list">
          <dt>ผู้ขาย</dt><dd>{{ po.supplier_name || '-' }}</dd>
          <dt>วันที่สั่ง</dt><dd>{{ po.order_date | date:'dd/MM/yyyy':'UTC' }}</dd>
          <dt>ราคาต่อตัว</dt><dd>{{ po.unit_cost | currency:'THB ':'symbol':'1.0-2' }}</dd>
          <dt>รวมเป็นเงิน</dt><dd>{{ po.total_cost | currency:'THB ':'symbol':'1.0-2' }}</dd>
          @if (po.status === 'received') {
            <dt>วันที่รับ</dt><dd>{{ po.received_date | date:'dd/MM/yyyy':'UTC' }}</dd>
            <dt>เวลาที่รับ</dt><dd>{{ po.received_at ? (po.received_at | date:'dd/MM/yyyy HH:mm':'UTC') + ' น.' : '-' }}</dd>
            <dt>รับโดย</dt><dd>{{ po.received_by_name || '-' }}</dd>
          }
          <dt>หมายเหตุ</dt><dd>{{ po.note || '-' }}</dd>
          <dt>แก้ไขล่าสุด</dt><dd>{{ po.updated_at ? (po.updated_at | date:'dd/MM/yyyy HH:mm':'UTC') + ' น.' : '-' }} โดย {{ po.updated_by_name || '-' }}</dd>
        </dl>
      </mat-dialog-content>
    }
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>ปิด</button>
    </mat-dialog-actions>
  `,
  styles: `
    .detail-title { display: flex; align-items: center; gap: 0.6rem; }
    .detail-title small { font-size: 0.85rem; opacity: 0.7; margin-left: 0.25rem; }
    .po-badge { margin-left: auto; padding: 0.2rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    .po-ordered { background: #fff3cd; color: #8a5a00; }
    .po-received { background: #e6f4ea; color: #2e7d32; }
    .po-cancelled { background: #eeeeee; color: #616161; }
    .big-qty { font-size: 2.4rem; font-weight: 800; text-align: center; padding: 0.25rem 0 0.75rem; }
    .big-qty small { font-size: 1rem; font-weight: 600; opacity: 0.8; }
    .qty-in { color: #2e7d32; }
    .qty-out { color: #b91c1c; }
    .detail-list { display: grid; grid-template-columns: max-content 1fr; gap: 0.5rem 1.25rem; margin: 0; }
    .detail-list dt { color: #7c6a5e; }
    .detail-list dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
    .sub-title { margin: 1.25rem 0 0.5rem; font-size: 1rem; }
    .lines-wrap { overflow-x: auto; }
    .lines { width: 100%; border-collapse: collapse; }
    .lines th, .lines td { padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(124, 45, 18, 0.2); text-align: left; white-space: nowrap; }
    .lines th { color: #7c6a5e; font-weight: 600; }
    .lines .empty { text-align: center; opacity: 0.7; }
    :host-context(html.dark-theme) .detail-list dt,
    :host-context(html.dark-theme) .lines th { color: #b9a79b; }
    :host-context(html.dark-theme) .qty-in { color: #81c784; }
    :host-context(html.dark-theme) .qty-out { color: #fca5a5; }
    :host-context(html.dark-theme) .po-ordered { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    :host-context(html.dark-theme) .po-received { background: rgba(76, 175, 80, 0.2); color: #81c784; }
    :host-context(html.dark-theme) .po-cancelled { background: #3a3a3a; color: #bdbdbd; }
  `,
})
export class StockDetailDialog implements OnInit {
  readonly data = inject<StockDetailData>(MAT_DIALOG_DATA);
  private api = inject(ApiService);

  readonly typeLabel = TYPE_LABEL;
  readonly icon = TYPE_ICON;
  readonly statusLabel = STATUS_LABEL;

  lines: SalesOfDayLine[] = [];
  loadingLines = false;

  ngOnInit(): void {
    if (this.data.kind === 'ledger' && this.data.row.type === 'sale') {
      this.loadingLines = true;
      this.api.getSalesOfDay(this.data.row.ledger_date.slice(0, 10)).subscribe({
        next: (lines) => {
          this.lines = lines;
          this.loadingLines = false;
        },
        error: () => (this.loadingLines = false),
      });
    }
  }
}
