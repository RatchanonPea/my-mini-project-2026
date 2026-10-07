import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ApiService, ActivityLogItem, CreateUserPayload, Role, UpdateUserPayload, User } from '../../../../services/api';
import { ConfirmDialog, DialogErrorHtmlConfirm, DialogSuccess } from '../../../../common/helper';
import { Pager } from '../../../../shared/pager/pager';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, Pager],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss'],
})
export class UserProfile implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isNew = false;
  userId: number | null = null;
  user: User | null = null;
  roles: Role[] = [];
  loading = false;
  saving = false;
  hidePassword = true;

  activityLogs: ActivityLogItem[] = [];
  activityTotal = 0;
  activityPageIndex = 0;
  readonly activityPageSize = 5;
  activityFilterForm = this.fb.group({ keyword: [''] });
  readonly actionLabel: Record<string, string> = {
    create: 'สร้าง', update: 'แก้ไข', delete: 'ลบ', receive: 'รับของ', cancel: 'ยกเลิก',
  };
  readonly entityLabel: Record<string, string> = {
    product: 'สินค้า', expense: 'รายจ่าย', sale: 'ยอดขาย', user: 'ผู้ใช้', supplier: 'ร้านค้า',
    purchase_order: 'ใบสั่งซื้อไก่', stock_adjustment: 'ปรับสต็อกไก่', inventory_settings: 'ตั้งค่าสต็อก',
  };

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [''],
    phone: [''],
    role_id: [null as number | null, Validators.required],
    is_active: [true],
  });

  get isPasswordRequired(): boolean {
    return this.isNew;
  }

  get displayName(): string {
    const v = this.form.getRawValue();
    return [v.firstName, v.lastName].filter(Boolean).join(' ') || 'ผู้ใช้ใหม่';
  }

  get initials(): string {
    const v = this.form.getRawValue();
    const first = v.firstName?.trim().charAt(0) ?? '';
    const last = v.lastName?.trim().charAt(0) ?? '';
    return (first + last) || '?';
  }

  get currentRoleName(): string {
    const roleId = this.form.controls.role_id.value;
    return this.roles.find((r) => r.role_id === roleId)?.role_name ?? '-';
  }

  ngOnInit(): void {
    // "users/new" is a literal route with no :id param at all (not "users/:id" with id="new"),
    // so the presence of the param — not its value — is what tells the two routes apart.
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew = idParam === null;
    this.userId = this.isNew ? null : Number(idParam);

    this.api.getRoles('active').subscribe((roles) => (this.roles = roles));

    if (!this.isNew) {
      this.load();
      this.loadActivity();
    }
  }

  loadActivity(): void {
    if (!this.userId) return;
    this.api.searchActivityLogs({
      userId: this.userId,
      keyword: this.activityFilterForm.controls.keyword.value ?? '',
      date: null,
      page: this.activityPageIndex + 1,
      pageSize: this.activityPageSize,
    }).subscribe({
      next: (r) => {
        this.activityLogs = r.items;
        this.activityTotal = r.total;
      },
      error: () => {
        this.activityLogs = [];
        this.activityTotal = 0;
      },
    });
  }

  searchActivity(): void {
    this.activityPageIndex = 0;
    this.loadActivity();
  }

  clearActivityFilter(): void {
    this.activityFilterForm.reset({ keyword: '' });
    this.searchActivity();
  }

  onActivityPageChange(pageIndex: number): void {
    this.activityPageIndex = pageIndex;
    this.loadActivity();
  }

  private load(): void {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: (response) => {
        const found = (response.data ?? []).find((u) => u.user_id === this.userId) ?? null;
        this.user = found;
        if (found) {
          this.form.setValue({
            username: found.username,
            password: '',
            firstName: found.first_name ?? found.first_name_th ?? found.first_name_en ?? '',
            lastName: found.last_name ?? found.last_name_th ?? found.last_name_en ?? '',
            email: found.email ?? '',
            phone: found.phone ?? '',
            role_id: found.role_id ?? null,
            is_active: !(found.status === false || found.status === 0 || found.status === '0'),
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  back(): void {
    this.router.navigate(['/main-conten-mng/users']);
  }

  save(): void {
    if (this.form.invalid || (this.isPasswordRequired && !this.form.controls.password.value) || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving = true;

    if (this.isNew) {
      const payload: CreateUserPayload = {
        username: v.username.trim(),
        first_name: v.firstName.trim(),
        last_name: v.lastName.trim(),
        password_hash: v.password,
        email: v.email.trim() || undefined,
        phone: v.phone.trim() || undefined,
        role_id: v.role_id ?? undefined,
        status: v.is_active ? 1 : 0,
      };
      this.api.createUser(payload).subscribe({
        next: () => {
          this.saving = false;
          DialogSuccess('สร้างผู้ใช้ใหม่เรียบร้อยแล้ว', 'สร้างสำเร็จ');
          this.back();
        },
        error: (err) => {
          this.saving = false;
          DialogErrorHtmlConfirm(err?.error?.message ?? 'ไม่สามารถสร้างผู้ใช้ได้ โปรดลองอีกครั้ง');
        },
      });
      return;
    }

    const payload: UpdateUserPayload = {
      user_id: this.userId!,
      username: v.username.trim(),
      first_name: v.firstName.trim(),
      last_name: v.lastName.trim(),
      email: v.email.trim() || undefined,
      phone: v.phone.trim() || undefined,
      role_id: v.role_id ?? undefined,
      status: v.is_active ? 1 : 0,
    };
    if (v.password) {
      payload.password_hash = v.password;
    }

    this.api.updateUser(payload).subscribe({
      next: () => {
        this.saving = false;
        DialogSuccess('แก้ไขข้อมูลผู้ใช้สำเร็จแล้ว', 'อัปเดตสำเร็จ');
        this.load();
        this.activityPageIndex = 0;
        this.loadActivity();
      },
      error: (err) => {
        this.saving = false;
        DialogErrorHtmlConfirm(err?.error?.message ?? 'ไม่สามารถอัปเดตผู้ใช้ได้ โปรดลองอีกครั้ง');
      },
    });
  }

  async toggleActive(): Promise<void> {
    const nextActive = !this.form.controls.is_active.value;
    const confirmMsg = nextActive ? 'เปิดใช้งานผู้ใช้นี้อีกครั้งใช่หรือไม่' : 'ปิดใช้งานผู้ใช้นี้ใช่หรือไม่';
    if (!(await ConfirmDialog('ยืนยันการเปลี่ยนสถานะ', confirmMsg))) return;
    this.form.controls.is_active.setValue(nextActive);
    this.save();
  }
}
