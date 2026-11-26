import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, SupplyContract, SupplyContractDetail } from '../../../../services/api';
import { SupplyAgreementService } from '../supply-agreement';

/** Popup card for one supply agreement; what the printed copy says comes from the snapshot taken when it was made. */
@Component({
  selector: 'app-contract-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <header class="slip-head">
      <span class="slip-icon"><mat-icon aria-hidden="true">description</mat-icon></span>
      <div class="slip-title">
        <h2 mat-dialog-title>ข้อตกลงซื้อขายไก่</h2>
        <p>{{ contract.code }}</p>
      </div>
      <button mat-icon-button type="button" mat-dialog-close aria-label="ปิด"><mat-icon>close</mat-icon></button>
    </header>
    <mat-dialog-content class="slip-body">
      <div class="slip">
      <div class="slip-total">
        <span>จำนวนตามข้อตกลง</span>
        <strong>{{ contract.quantity | number:'1.0-0' }} <small>ตัว/{{ contract.per === 'month' ? 'เดือน' : 'ปี' }}</small></strong>
        <span class="status" [class.ended]="contract.status !== 'active'">{{ contract.status === 'active' ? 'ใช้อยู่' : 'สิ้นสุดแล้ว' }}</span>
      </div>
      <div class="slip-perf" aria-hidden="true"></div>
      <dl class="slip-lines">
        <dt>ราคาต่อตัว</dt><dd>{{ contract.unit_price !== null ? 'THB ' + (contract.unit_price | number:'1.0-2') : 'ไม่ระบุราคา' }}</dd>
        <dt>เครดิต</dt><dd>{{ contract.credit_days === null ? '-' : (contract.credit_days === 0 ? 'จ่ายสด' : contract.credit_days + ' วัน') }}</dd>
        <dt>ทำเมื่อ</dt><dd>{{ contract.created_at | date:'dd/MM/yyyy':'UTC' }}{{ contract.created_by_name ? ' · ' + contract.created_by_name : '' }}</dd>
        <dt>สิ้นสุดเมื่อ</dt><dd>{{ contract.ended_at ? (contract.ended_at | date:'dd/MM/yyyy':'UTC') : '-' }}</dd>
        @if (detail(); as d) {
          @if (d.snapshot?.profile?.shop_name) { <dt>ผู้ซื้อ</dt><dd>{{ d.snapshot?.profile?.legal_name || d.snapshot?.profile?.shop_name }}</dd> }
          @if (d.snapshot?.supplier?.name) { <dt>ผู้ขาย</dt><dd>{{ d.snapshot?.supplier?.legal_name || d.snapshot?.supplier?.name }}</dd> }
        }
      </dl>
      </div>
      @if (loading()) { <p class="slip-meta">กำลังโหลด...</p> }
    </mat-dialog-content>
    <mat-dialog-actions class="slip-actions">
      @if (agreements.allowed) {
        <button mat-flat-button class="is-primary" type="button" (click)="reprint()"><mat-icon>print</mat-icon> พิมพ์ซ้ำ</button>
      } @else {
        <button mat-flat-button class="is-primary" type="button" mat-dialog-close>ปิด</button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .status { margin-top: 0.4rem; padding: 0.15rem 0.8rem; border-radius: 999px; font-size: 0.875rem; font-weight: 600; background: #e6f4ea; color: #2e7d32; }
    .status.ended { background: #eeeeee; color: #616161; }
  `],
})
export class ContractDetailDialog implements OnInit {
  readonly contract = inject<SupplyContract>(MAT_DIALOG_DATA);
  private api = inject(ApiService);
  readonly agreements = inject(SupplyAgreementService);

  detail = signal<SupplyContractDetail | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    if (!this.agreements.allowed) return; // the printed buyer details are not for this role
    this.loading.set(true);
    this.api.getSupplyContract(this.contract.contract_id).subscribe({
      next: (d) => { this.detail.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  reprint(): void {
    void this.agreements.reprint(this.contract);
  }
}
