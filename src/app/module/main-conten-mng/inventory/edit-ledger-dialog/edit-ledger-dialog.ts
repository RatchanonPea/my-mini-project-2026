import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ApiService, LedgerItem, User } from '../../../../services/api';

function halfStep(control: AbstractControl): ValidationErrors | null {
  const value = Number(control.value);
  return Number.isFinite(value) && Math.abs(value * 2 - Math.round(value * 2)) < 1e-9 ? null : { halfStep: true };
}

// Manager/Admin only — matches roles.role_id 1 (manager) and 2 (admin) in the backend.
const APPROVER_ROLE_IDS = [1, 2];

@Component({
  selector: 'app-edit-ledger-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>edit</mat-icon>
      <span>แก้ไข{{ typeLabel[row.type] }} <small>{{ row.ref_code }}</small></span>
    </h2>
    <mat-dialog-content>
      <p class="hint">แก้ไขรายการที่บันทึกผิดได้ที่นี่ แต่ต้องได้รับการยืนยันจากผู้จัดการหรือแอดมินก่อนบันทึก</p>

      <form [formGroup]="form">
        <div class="form-grid">
          @if (row.type === 'receive') {
            <mat-form-field appearance="outline">
              <mat-label>จำนวน (ตัว)</mat-label>
              <input matInput type="number" step="0.5" formControlName="quantity" />
              <mat-error>ใส่ได้ทีละ 0.5 และมากกว่า 0</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>ราคาต่อตัว (บาท)</mat-label>
              <input matInput type="number" step="0.01" formControlName="unit_cost" />
              <mat-error>กรุณากรอกราคา 0 ขึ้นไป</mat-error>
            </mat-form-field>
          } @else {
            <mat-form-field appearance="outline">
              <mat-label>{{ row.type === 'waste' ? 'จำนวนที่เสีย (ตัว)' : 'จำนวนที่ปรับ (ตัว, ลบ = ลดสต็อก)' }}</mat-label>
              <input matInput type="number" step="0.5" formControlName="quantity" />
              @if (form.controls.quantity.hasError('halfStep')) {
                <mat-error>ใส่ได้ทีละ 0.5 ตัว</mat-error>
              } @else {
                <mat-error>กรุณากรอกจำนวน</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>วันที่และเวลา</mat-label>
              <input matInput type="datetime-local" formControlName="adjust_date" />
            </mat-form-field>
          }
          @if (row.note) {
            <div class="full-width original-note">
              <span class="original-note-label">หมายเหตุเดิม (แก้ไขไม่ได้)</span>
              <p>{{ row.note }}</p>
            </div>
          }
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>หมายเหตุการแก้ไข</mat-label>
            <input matInput formControlName="edit_note" maxlength="500" placeholder="เหตุผลที่แก้ไขรายการนี้" />
          </mat-form-field>
        </div>

        @if (row.approved_by_name) {
          <p class="last-edit-info">
            แก้ไขล่าสุดโดย {{ row.by_name || '-' }} เมื่อ {{ row.event_at | date:'dd/MM/yyyy HH:mm':'UTC' }} น. — ยืนยันโดย {{ row.approved_by_name }}
          </p>
        }

        <h3 class="approval-title"><mat-icon>verified_user</mat-icon> ยืนยันโดยผู้จัดการ/แอดมิน</h3>
        <div class="form-grid">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>ผู้ยืนยัน</mat-label>
            <mat-select formControlName="approver_id">
              @for (u of approvers; track u.user_id) {
                <mat-option [value]="u.user_id">{{ displayName(u) }} ({{ u.role_name }})</mat-option>
              }
            </mat-select>
            @if (approvers.length === 0) {
              <mat-hint>ไม่พบผู้ใช้ที่เป็นผู้จัดการหรือแอดมินที่ใช้งานอยู่</mat-hint>
            }
            <mat-error>กรุณาเลือกผู้ยืนยัน</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>รหัสผ่านของผู้ยืนยัน</mat-label>
            <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="approver_password" />
            <mat-icon matSuffix class="eye-icon" (click)="hidePassword = !hidePassword">
              {{ hidePassword ? 'visibility_off' : 'visibility' }}
            </mat-icon>
            <mat-error>กรุณากรอกรหัสผ่าน</mat-error>
          </mat-form-field>
        </div>
        @if (approveError) {
          <p class="approve-error">{{ approveError }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close [disabled]="saving">ยกเลิก</button>
      <button mat-flat-button color="primary" type="button" [disabled]="form.invalid || saving" (click)="submit()">
        <mat-icon>save</mat-icon> ยืนยันและบันทึก
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-title { display: flex; align-items: center; gap: 0.6rem; }
    .dialog-title small { font-size: 0.85rem; opacity: 0.7; margin-left: 0.25rem; }
    .hint { margin: 0 0 1rem; font-size: 0.85rem; opacity: 0.75; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .full-width { grid-column: 1 / -1; }
    .approval-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; margin: 1.25rem 0 0.75rem; }
    .eye-icon { cursor: pointer; }
    .approve-error { color: #b91c1c; font-size: 0.85rem; margin: -0.25rem 0 0; }
    .original-note { padding: 0.6rem 0.85rem; border-radius: 8px; background: rgba(124, 45, 18, 0.06); }
    .original-note-label { display: block; font-size: 0.75rem; font-weight: 600; opacity: 0.7; margin-bottom: 0.2rem; }
    .original-note p { margin: 0; overflow-wrap: anywhere; }
    .last-edit-info { font-size: 0.8rem; opacity: 0.7; margin: 0.75rem 0 0; }
    :host-context(html.dark-theme) .approve-error { color: #fca5a5; }
    :host-context(html.dark-theme) .original-note { background: rgba(255, 255, 255, 0.06); }
  `,
})
export class EditLedgerDialog implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<EditLedgerDialog>);
  readonly row: LedgerItem = inject<{ row: LedgerItem }>(MAT_DIALOG_DATA).row;

  readonly typeLabel: Record<string, string> = { receive: 'รับเข้า', waste: 'ของเสีย', adjust: 'ปรับยอด' };

  approvers: User[] = [];
  saving = false;
  hidePassword = true;
  approveError: string | null = null;

  form = this.fb.nonNullable.group({
    quantity: [0, [Validators.required, halfStep]],
    unit_cost: [0, [Validators.required, Validators.min(0)]],
    adjust_date: [''],
    edit_note: [''],
    approver_id: [null as number | null, Validators.required],
    approver_password: ['', Validators.required],
  });

  ngOnInit(): void {
    this.form.patchValue({
      quantity: this.row.type === 'waste' ? Math.abs(this.row.quantity) : this.row.quantity,
      unit_cost: this.row.unit_cost ?? 0,
      // ledger_date is stored/displayed as wall-clock digits app-wide (no timezone math), so the
      // datetime-local input takes the same digits verbatim instead of round-tripping via Date.
      adjust_date: this.row.ledger_date.slice(0, 16),
      edit_note: this.row.edit_note ?? '',
    });

    this.api.getUsers().subscribe((res) => {
      this.approvers = (res.data ?? []).filter((u) =>
        APPROVER_ROLE_IDS.includes(Number(u.role_id)) && !(u.status === false || u.status === 0 || u.status === '0'));
    });
  }

  displayName(u: User): string {
    return u.full_name_th || u.full_name_en || u.username;
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving = true;
    this.approveError = null;

    this.api.verifyApprover(v.approver_id!, v.approver_password).subscribe({
      next: (approver) => this.save(approver.user_id),
      error: (err) => {
        this.saving = false;
        this.approveError = err?.error?.message ?? 'ไม่สามารถยืนยันตัวตนผู้อนุมัติได้';
      },
    });
  }

  private save(approvedBy: number): void {
    const v = this.form.getRawValue();
    const request$ = this.row.type === 'receive'
      ? this.api.updatePurchase({ po_id: this.row.ref_id!, quantity: Number(v.quantity), unit_cost: Number(v.unit_cost), edit_note: v.edit_note.trim() || null, approved_by: approvedBy })
      : this.api.updateStockAdjustment({
          adjust_id: this.row.adjust_id!,
          adjust_date: v.adjust_date,
          quantity: this.row.type === 'waste' ? Math.abs(Number(v.quantity)) : Number(v.quantity),
          edit_note: v.edit_note.trim() || null,
          approved_by: approvedBy,
        });

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.ref.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.approveError = err?.error?.message ?? 'บันทึกไม่สำเร็จ';
      },
    });
  }
}
