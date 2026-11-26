import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Branch, BranchPayload } from '../../../services/api';
import { AddressInput } from '../../../shared/thai-address/address-field';
import { ClearButton } from '../../../shared/clear-button/clear-button';
import { CharCount } from '../../../shared/char-count/char-count';

export interface BranchDialogData {
  /** null = adding a new branch */
  branch: Branch | null;
  /** the first branch is always the main one */
  isFirst: boolean;
}

@Component({
  selector: 'app-branch-dialog',
  standalone: true,
  imports: [CharCount, ClearButton, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSlideToggleModule, AddressInput],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon aria-hidden="true">store</mat-icon>
      <span>{{ data.branch ? 'แก้ไขสาขา' : 'เพิ่มสาขา' }}</span>
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="submit()" id="branch-form">
        <mat-form-field appearance="outline">
          <mat-label>ชื่อสาขา</mat-label>
          <input matInput formControlName="name" maxlength="200" />
          <app-clear-button matSuffix />
          <mat-hint align="end" appCharCount />
          <mat-error>กรุณากรอกชื่อสาขา</mat-error>
        </mat-form-field>
        <app-address-field formControlName="address" label="ที่อยู่ (ใช้พิมพ์ในหัวเอกสารและสัญญา)" />
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>เบอร์โทร</mat-label>
            <input matInput formControlName="phone" maxlength="30" />
            <app-clear-button matSuffix />
            <mat-hint align="end" appCharCount />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>อีเมล</mat-label>
            <input matInput type="email" formControlName="email" maxlength="150" />
            <app-clear-button matSuffix />
            <mat-hint align="end" appCharCount />
            <mat-error>รูปแบบอีเมลไม่ถูกต้อง</mat-error>
          </mat-form-field>
        </div>
        @if (!data.isFirst && !data.branch?.is_main) {
          <mat-slide-toggle formControlName="is_main">ตั้งเป็นสาขาหลัก (ที่อยู่นี้จะเป็นค่าเริ่มต้นในเอกสาร)</mat-slide-toggle>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>ยกเลิก</button>
      <button mat-flat-button color="primary" type="submit" form="branch-form" [disabled]="form.invalid">
        <mat-icon aria-hidden="true">save</mat-icon> บันทึก
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    form { display: flex; flex-direction: column; padding-top: 10px; }
    .dialog-title { display: flex; align-items: center; gap: 8px; }
    .row { display: flex; gap: 12px; flex-wrap: wrap; }
    .row mat-form-field { flex: 1 1 200px; }
  `],
})
export class BranchDialog {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject<MatDialogRef<BranchDialog, BranchPayload>>(MatDialogRef);
  protected readonly data = inject<BranchDialogData>(MAT_DIALOG_DATA);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.branch?.name ?? '', Validators.required],
    address: [this.data.branch?.address ?? ''],
    phone: [this.data.branch?.phone ?? ''],
    email: [this.data.branch?.email ?? '', Validators.email],
    is_main: [false],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: BranchPayload = {
      name: v.name.trim(),
      address: v.address.trim() || null,
      phone: v.phone.trim() || null,
      email: v.email.trim() || null,
    };
    if (v.is_main) payload.is_main = true;
    this.ref.close(payload);
  }
}
