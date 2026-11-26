import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RowAction } from '../../../../shared/row-drawer/row-drawer';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, LedgerItem, PurchaseOrder, SalesOfDayLine } from '../../../../services/api';

export type StockDetailData = ({ kind: 'ledger'; row: LedgerItem } | { kind: 'purchase'; po: PurchaseOrder }) & {
  /** buttons offered by the page that opened the panel */
  actions?: RowAction[];
};

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
      <header class="slip-head">
        <span class="slip-icon"><mat-icon aria-hidden="true">{{ icon[row.type] }}</mat-icon></span>
        <div class="slip-title">
          <h2 mat-dialog-title>{{ typeLabel[row.type] }}</h2>
          <p>{{ row.ref_code }}</p>
        </div>
        <button mat-icon-button type="button" mat-dialog-close aria-label="ปิด"><mat-icon>close</mat-icon></button>
      </header>
      <mat-dialog-content class="slip-body">
        <div class="slip">
        <div class="slip-total">
          <span>จำนวนไก่</span>
          <strong [class.positive]="row.quantity > 0" [class.negative]="row.quantity < 0">
            {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity | number:'1.0-2' }} <small>ตัว</small>
          </strong>
        </div>
        <div class="slip-perf" aria-hidden="true"></div>
        <dl class="slip-lines">
          <!-- a 00:00 time means only the date was recorded, so don't print it -->
          <dt>วันที่</dt><dd>{{ row.ledger_date | date:((row.type === 'waste' || row.type === 'adjust') && row.ledger_date.slice(11, 16) !== '00:00' ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'):'UTC' }}</dd>
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
          @if (row.edit_note) {
            <dt>หมายเหตุการแก้ไข</dt><dd>{{ row.edit_note }}</dd>
          }
          @if (row.approved_by_name) {
            <dt>ยืนยันการแก้ไขโดย</dt><dd>{{ row.approved_by_name }}</dd>
          }
        </dl>

        @if (row.type === 'sale') {
          <h3 class="sub-title">รายการขายไก่ของวันนี้</h3>
          <div class="lines-wrap">
            <table class="lines">
              <thead><tr><th>สินค้า</th><th>จำนวน</th><th>ใช้ไก่ (ตัว)</th><th>ยอดขาย</th></tr></thead>
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
        </div>
        @if (row.type === 'sale') {
          <p class="slip-meta">ยอดรวมการขายของวันนี้ แก้ไขจากหน้าสต็อกไม่ได้</p>
        }
      </mat-dialog-content>
    } @else {
      @let po = data.po;
      <header class="slip-head">
        <span class="slip-icon"><mat-icon aria-hidden="true">local_shipping</mat-icon></span>
        <div class="slip-title">
          <h2 mat-dialog-title>ใบสั่งซื้อ</h2>
          <p>{{ po.code }}</p>
        </div>
        <button mat-icon-button type="button" mat-dialog-close aria-label="ปิด"><mat-icon>close</mat-icon></button>
      </header>
      <mat-dialog-content class="slip-body">
        <div class="slip">
        <div class="slip-total">
          <span>รวมเป็นเงิน</span>
          <strong>{{ po.total_cost | currency:'THB ':'symbol':'1.0-2' }}</strong>
          <span class="po-badge" [ngClass]="'po-' + po.status">{{ statusLabel[po.status] }}</span>
        </div>
        <div class="slip-perf" aria-hidden="true"></div>
        <dl class="slip-lines">
          <dt>จำนวน</dt><dd>{{ po.quantity | number:'1.0-2' }} ตัว</dd>
          <dt>ผู้ขาย</dt><dd>{{ po.supplier_name || '-' }}</dd>
          <dt>วันที่สั่ง</dt><dd>{{ po.order_date | date:'dd/MM/yyyy':'UTC' }}</dd>
          <dt>ราคาต่อตัว</dt><dd>{{ po.unit_cost | currency:'THB ':'symbol':'1.0-2' }}</dd>
          @if (po.contract_code) { <dt>ข้อตกลง</dt><dd>{{ po.contract_code }}</dd> }
          @if (po.status === 'received') {
            <dt>การจ่ายเงิน</dt>
            <dd>{{ po.paid_date ? 'จ่ายแล้ว ' + (po.paid_date | date:'dd/MM/yyyy':'UTC') : (po.due_date ? 'ครบกำหนด ' + (po.due_date | date:'dd/MM/yyyy':'UTC') + (po.is_overdue ? ' (เกินกำหนด)' : '') : 'ยังไม่จ่าย') }}</dd>
          }
          @if (po.status === 'received') {
            <dt>วันที่รับ</dt><dd>{{ po.received_date | date:'dd/MM/yyyy':'UTC' }}</dd>
            <dt>เวลาที่รับ</dt><dd>{{ po.received_at ? (po.received_at | date:'dd/MM/yyyy HH:mm':'UTC') + ' น.' : '-' }}</dd>
            <dt>รับโดย</dt><dd>{{ po.received_by_name || '-' }}</dd>
          }
          <dt>หมายเหตุ</dt><dd>{{ po.note || '-' }}</dd>
          <dt>แก้ไขล่าสุด</dt><dd>{{ po.updated_at ? (po.updated_at | date:'dd/MM/yyyy HH:mm':'UTC') + ' น.' : '-' }} โดย {{ po.updated_by_name || '-' }}</dd>
        </dl>
        </div>
      </mat-dialog-content>
    }
    <mat-dialog-actions class="slip-actions">
      @for (a of data.actions ?? []; track a.label) {
        @if (a.kind === 'primary') {
          <button mat-flat-button class="is-primary" type="button" (click)="run(a)"><mat-icon>{{ a.icon }}</mat-icon> {{ a.label }}</button>
        } @else {
          <button mat-stroked-button [class.is-warn]="a.kind === 'warn'" type="button" (click)="run(a)"><mat-icon>{{ a.icon }}</mat-icon> {{ a.label }}</button>
        }
      } @empty {
        <button mat-flat-button class="is-primary" type="button" mat-dialog-close>ปิด</button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    .po-badge { margin-top: 0.4rem; padding: 0.2rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 600; }
    .po-ordered { background: #fff3cd; color: #8a5a00; }
    .po-received { background: #e6f4ea; color: #2e7d32; }
    .po-cancelled { background: #eeeeee; color: #616161; }
    .sub-title { margin: 1rem 1.25rem 0.5rem; font-size: 1rem; }
    .lines-wrap { overflow-x: auto; padding: 0 0.75rem 0.75rem; }
    .lines { width: 100%; border-collapse: collapse; }
    .lines th, .lines td { padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(124, 45, 18, 0.2); text-align: left; white-space: nowrap; }
    .lines th { color: #7c6a5e; font-weight: 600; }
    .lines .empty { text-align: center; opacity: 0.7; }
    :host-context(html.dark-theme) .lines th { color: #b9a79b; }
    :host-context(html.dark-theme) .po-ordered { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    :host-context(html.dark-theme) .po-received { background: rgba(76, 175, 80, 0.2); color: #81c784; }
    :host-context(html.dark-theme) .po-cancelled { background: #3a3a3a; color: #bdbdbd; }
  `,
})
export class StockDetailDialog implements OnInit {
  readonly data = inject<StockDetailData>(MAT_DIALOG_DATA);
  private api = inject(ApiService);
  private ref = inject<MatDialogRef<StockDetailDialog>>(MatDialogRef);

  readonly typeLabel = TYPE_LABEL;
  readonly icon = TYPE_ICON;
  readonly statusLabel = STATUS_LABEL;

  lines: SalesOfDayLine[] = [];
  loadingLines = false;

  run(action: RowAction): void {
    this.ref.afterClosed().subscribe(() => action.run());
    this.ref.close();
  }

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
