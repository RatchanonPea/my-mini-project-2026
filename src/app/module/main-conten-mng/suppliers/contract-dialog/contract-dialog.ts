import { Component, inject } from '@angular/core';
import { ThousandsInput } from '../../../../shared/number-format/thousands.directive';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Branch } from '../../../../services/api';
import { AuthService } from '../../../../services/auth';
import { DigitsOnlyInput } from '../../../../shared/thai-id/digits-only.directive';
import { ClearButton } from '../../../../shared/clear-button/clear-button';

export type ContractPeriod = 'month' | 'year';

/** What the user picks before the agreement is printed; empty optional values print as blank lines to write on. */
export interface ContractOptions {
  quantity: number;
  per: ContractPeriod;
  unitPrice: number | null;
  creditDays: number | null;
  /** the branch whose address is printed as the buyer's */
  branchId: number | null;
}

export interface ContractDialogData {
  supplierName: string;
  /** supplier's own credit terms, else the shop default: pre-fills the credit field */
  defaultCreditDays: number | null;
  branches: Branch[];
  defaultBranchId: number | null;
  /** what the shop master still lacks for this branch: `required` blocks printing, `recommended` only warns */
  buyerCheck: (branchId: number | null) => BuyerCheck;
}

export interface BuyerCheck {
  required: string[];
  recommended: string[];
}

@Component({
  selector: 'app-contract-dialog',
  standalone: true,
  imports: [ClearButton, ThousandsInput, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatButtonToggleModule, MatIconModule, MatSelectModule, DigitsOnlyInput, RouterLink],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon aria-hidden="true">description</mat-icon>
      <span>ข้อตกลงซื้อขายไก่ <small>{{ data.supplierName }}</small></span>
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="submit()" id="contract-form">
        <div class="row">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="qty">
            <mat-label>จำนวนไก่ที่ส่ง (ตัว)</mat-label>
            <input matInput appThousands [decimals]="0" min="1" formControlName="quantity" placeholder="เช่น 1,200" />
            <app-clear-button matSuffix />
            <mat-error>ใส่จำนวนเต็มที่มากกว่า 0</mat-error>
          </mat-form-field>

          <div class="per">
            <span class="per-label">ต่อ</span>
            <mat-button-toggle-group formControlName="per" aria-label="รอบของจำนวนไก่">
              <mat-button-toggle value="month">เดือน</mat-button-toggle>
              <mat-button-toggle value="year">ปี</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </div>

        <div class="row">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>ราคาต่อตัว (บาท)</mat-label>
            <input matInput appThousands min="0" formControlName="unitPrice" placeholder="เช่น 160" />
            <app-clear-button matSuffix />
            <mat-hint>ไม่บังคับ</mat-hint>
            <mat-error>ราคาต้องไม่ติดลบ</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>เครดิต (วัน)</mat-label>
            <input matInput appDigitsOnly type="number" min="0" step="1" formControlName="creditDays" placeholder="เช่น 7" />
            <app-clear-button matSuffix />
            <mat-hint>ไม่บังคับ · 0 = จ่ายสด</mat-hint>
            <mat-error>ใส่จำนวนวันเต็ม 0 ขึ้นไป</mat-error>
          </mat-form-field>
        </div>

        @if (data.branches.length > 1) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="branch">
            <mat-label>สาขาของผู้ซื้อ (ที่อยู่ในสัญญา)</mat-label>
            <mat-select formControlName="branchId">
              @for (b of data.branches; track b.branch_id) {
                <mat-option [value]="b.branch_id">{{ b.name }}{{ b.is_main ? ' (สาขาหลัก)' : '' }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        @if (buyer.required.length) {
          <div class="check bad" role="alert">
            <mat-icon aria-hidden="true">error</mat-icon>
            <div>
              <strong>ข้อมูลร้าน (ผู้ซื้อ) ยังไม่ครบ ต้องกรอกก่อนพิมพ์สัญญา</strong>
              <div>ขาด: {{ buyer.required.join(', ') }}</div>
              @if (canOpenShop) {
                <a mat-stroked-button routerLink="/main-conten-mng/shop" mat-dialog-close class="go">
                  <mat-icon aria-hidden="true">storefront</mat-icon> ไปกรอกที่ตั้งค่าร้าน
                </a>
              } @else {
                <div class="who">ให้ผู้จัดการหรือแอดมินกรอกที่ ตั้งค่าร้าน ก่อน</div>
              }
            </div>
          </div>
        } @else if (buyer.recommended.length) {
          <div class="check warn">
            <mat-icon aria-hidden="true">info</mat-icon>
            <div>แนะนำให้กรอกที่ ตั้งค่าร้าน: {{ buyer.recommended.join(', ') }} (ถ้าไม่กรอกจะเป็นเส้นให้เขียนมือ)</div>
          </div>
        }

        <p class="note">ช่องที่เว้นไว้จะเป็นเส้นให้เขียนด้วยมือในเอกสาร</p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>ยกเลิก</button>
      <button mat-flat-button color="primary" type="submit" form="contract-form" [disabled]="form.invalid || buyer.required.length > 0">
        <mat-icon aria-hidden="true">print</mat-icon> พิมพ์ข้อตกลง
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* the floating label of an outlined field rises above its box: the dialog content clips anything outside, so leave room */
    form { padding-top: 10px; }
    .dialog-title { display: flex; align-items: center; gap: 8px; }
    .dialog-title small { font-size: 0.75em; opacity: 0.7; margin-left: 4px; }
    .row { display: flex; gap: 14px 12px; margin-bottom: 14px; align-items: flex-start; flex-wrap: wrap; }
    .row mat-form-field { flex: 1 1 180px; }
    .qty { flex: 1 1 200px; }
    .per { display: flex; align-items: center; gap: 8px; padding-top: 6px; }
    .per-label { font-weight: 600; }
    .branch { width: 100%; }
    .check { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 12px; margin-bottom: 10px; font-size: 0.9rem; }
    .check mat-icon { flex: none; }
    .check.bad { background: rgba(220, 38, 38, 0.12); color: #b91c1c; border: 1px solid rgba(220, 38, 38, 0.4); }
    .check.warn { background: rgba(245, 158, 11, 0.14); color: #92400e; border: 1px solid rgba(245, 158, 11, 0.4); }
    .check .go { margin-top: 8px; }
    .check .who { margin-top: 4px; }
    .note { margin: 0; font-size: 0.85em; opacity: 0.75; }
  `],
})
export class ContractDialog {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject<MatDialogRef<ContractDialog, ContractOptions>>(MatDialogRef);
  protected readonly data = inject<ContractDialogData>(MAT_DIALOG_DATA);
  private readonly auth = inject(AuthService);

  /** only managers / admins can open the shop settings page */
  protected readonly canOpenShop = ['manager', 'admin'].includes(this.auth.getCurrentUserRole() ?? '');

  /** re-evaluated whenever the branch is changed: each branch has its own address / phone */
  protected get buyer(): BuyerCheck {
    return this.data.buyerCheck(this.form.controls.branchId.value);
  }

  protected readonly form = this.fb.group({
    quantity: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]),
    per: this.fb.nonNullable.control<ContractPeriod>('month'),
    unitPrice: this.fb.control<number | null>(null, [Validators.min(0)]),
    creditDays: this.fb.control<number | null>(this.data.defaultCreditDays, [Validators.min(0), Validators.pattern(/^\d+$/)]),
    branchId: this.fb.control<number | null>(this.data.defaultBranchId),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.ref.close({
      quantity: Number(v.quantity),
      per: v.per,
      unitPrice: v.unitPrice === null || String(v.unitPrice) === '' ? null : Number(v.unitPrice),
      creditDays: v.creditDays === null || String(v.creditDays) === '' ? null : Number(v.creditDays),
      branchId: v.branchId,
    });
  }
}
