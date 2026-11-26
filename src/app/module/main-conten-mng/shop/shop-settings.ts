import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService, Branch, BranchPayload, ShopEntityType, ShopProfilePayload, User } from '../../../services/api';
import { ShopService } from '../../../services/shop';
import { ConfirmDialog, DialogErrorHtmlConfirm, DialogSuccess } from '../../../common/helper';
import { BranchDialog, BranchDialogData } from './branch-dialog';
import { formatThaiId, thaiId13Validator } from '../../../common/thai-id';
import { BankSelect } from '../../../shared/bank/bank-select';
import { DigitsOnlyInput } from '../../../shared/thai-id/digits-only.directive';
import { ThaiIdInput } from '../../../shared/thai-id/thai-id.directive';
import { ClearButton } from '../../../shared/clear-button/clear-button';
import { CharCount } from '../../../shared/char-count/char-count';

/** a user who may be flagged as the shop owner / signatory: active managers and admins */
interface OwnerChoice {
  user_id: number;
  name: string;
  role: string;
}

/** what the contracts will take from the chosen owner */
interface OwnerInfo {
  name: string;
  phone: string;
  nationalId: string;
  address: string;
  userId: number;
}

const OWNER_ROLE_IDS = [1, 2]; // manager, admin (same ids the backend allows)
const isActive = (status: unknown) => status === true || status === 1 || status === '1';

@Component({
  selector: 'app-shop-settings',
  standalone: true,
  imports: [CharCount, ClearButton, 
    ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatButtonToggleModule, MatSlideToggleModule, MatSelectModule, MatIconModule, BankSelect, DigitsOnlyInput, ThaiIdInput,
  ],
  templateUrl: './shop-settings.html',
  styleUrl: './shop-settings.scss',
})
export class ShopSettings implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly shopService = inject(ShopService);
  private readonly destroyRef = inject(DestroyRef);

  branches: Branch[] = [];
  owners: OwnerChoice[] = [];
  ownerInfo: OwnerInfo | null = null;
  private users: User[] = [];
  loading = true;
  saving = false;
  updatedInfo = '';

  readonly form = this.fb.nonNullable.group({
    entity_type: ['individual' as ShopEntityType],
    shop_name: ['', Validators.required],
    legal_name: [''],
    /** the user who is the owner (individual) or the authorised signatory (juristic person) */
    owner_user_id: [null as number | null, Validators.required],
    signatory_position: [''],
    tax_id: [''],
    is_vat: [false],
    bank_name: [''],
    bank_account_no: [''],
    bank_account_name: [''],
    contract_place: [''],
    default_credit_days: [null as number | null, [Validators.min(0), Validators.max(365), Validators.pattern(/^\d+$/)]],
    late_delivery_hours: [null as number | null, [Validators.min(0), Validators.max(720), Validators.pattern(/^\d+$/)]],
    cancel_notice_days: [null as number | null, [Validators.min(0), Validators.max(365), Validators.pattern(/^\d+$/)]],
  });

  get isJuristic(): boolean {
    return this.form.controls.entity_type.value === 'juristic';
  }

  /** why the registration number is invalid, in words the user can act on */
  get taxIdError(): string {
    return this.form.controls.tax_id.hasError('required') ? 'กรุณากรอกเลข 13 หลัก' : 'ต้องเป็นตัวเลข 13 หลัก';
  }

  /** details the contract needs from the owner that the user's record still lacks */
  get ownerMissing(): string[] {
    const info = this.ownerInfo;
    if (!info) return [];
    return [!info.nationalId && 'เลขบัตรประชาชน', !info.address && 'ที่อยู่'].filter((x): x is string => !!x);
  }

  ngOnInit(): void {
    this.form.controls.entity_type.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyEntityRules());
    this.form.controls.owner_user_id.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => this.showOwner(id));
    this.load();
  }

  private applyEntityRules(): void {
    const { legal_name, tax_id } = this.form.controls;
    // a juristic person names the legal entity and has its own registration number; an individual's ID card number
    // comes from the owner user, so no separate number is asked for here
    if (this.isJuristic) {
      legal_name.addValidators(Validators.required);
      tax_id.setValidators([Validators.required, thaiId13Validator]);
    } else {
      legal_name.removeValidators(Validators.required);
      tax_id.clearValidators();
    }
    legal_name.updateValueAndValidity();
    tax_id.updateValueAndValidity();
  }

  private load(): void {
    this.loading = true;
    this.api.getUsers().subscribe((response) => {
      this.users = response.data ?? [];
      this.owners = this.users
        .filter((u) => OWNER_ROLE_IDS.includes(Number(u.role_id)) && isActive(u.status))
        .map((u) => ({
          user_id: u.user_id,
          name: u.full_name_th || u.full_name_en || u.username,
          role: u.role_name ?? '',
        }));
    });

    this.api.getShop().subscribe({
      next: ({ profile, branches }) => {
        this.branches = branches;
        if (profile) {
          this.form.reset({
            entity_type: profile.entity_type,
            shop_name: profile.shop_name,
            legal_name: profile.legal_name ?? '',
            owner_user_id: profile.owner_user_id,
            signatory_position: profile.signatory_position ?? '',
            tax_id: profile.tax_id ?? '',
            is_vat: !!profile.is_vat,
            bank_name: profile.bank_name ?? '',
            bank_account_no: profile.bank_account_no ?? '',
            bank_account_name: profile.bank_account_name ?? '',
            contract_place: profile.contract_place ?? '',
            default_credit_days: profile.default_credit_days,
            late_delivery_hours: profile.late_delivery_hours,
            cancel_notice_days: profile.cancel_notice_days,
          });
          this.updatedInfo = profile.updated_at
            ? `แก้ไขล่าสุด ${new Date(profile.updated_at).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })}${profile.updated_by_name ? ' โดย ' + profile.updated_by_name : ''}`
            : '';
          this.applyEntityRules();
          this.showOwner(profile.owner_user_id);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        DialogErrorHtmlConfirm('โหลดข้อมูลร้านไม่สำเร็จ ถ้าเพิ่งอัปเดตระบบ ให้รันสคริปต์ scripts/add-shop-settings.js ที่ฝั่งเซิร์ฟเวอร์ก่อน');
      },
    });
  }

  /** shows what the contracts will take from the chosen user (name / phone from the user list, ID card + address from their record) */
  private showOwner(userId: number | null): void {
    if (!userId) {
      this.ownerInfo = null;
      return;
    }
    const user = this.users.find((u) => u.user_id === userId);
    const base: OwnerInfo = {
      userId,
      name: user ? user.full_name_th || user.full_name_en || user.username : '',
      phone: user?.phone ?? '',
      nationalId: '',
      address: '',
    };
    this.ownerInfo = base;
    this.api.getUserLegal(userId).subscribe({
      next: (legal) => {
        if (this.form.controls.owner_user_id.value === userId) {
          this.ownerInfo = { ...base, nationalId: legal.national_id ?? '', address: legal.address ?? '' };
        }
      },
      error: () => undefined, // the card then just shows the details as missing
    });
  }

  formatId(id: string): string {
    return formatThaiId(id);
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: ShopProfilePayload = {
      entity_type: v.entity_type,
      shop_name: v.shop_name.trim(),
      // fields of the other entity type are cleared, so a stale legal name never prints on an individual's contract
      legal_name: this.isJuristic ? v.legal_name.trim() : null,
      owner_user_id: v.owner_user_id,
      signatory_position: this.isJuristic ? v.signatory_position.trim() || null : null,
      tax_id: this.isJuristic ? v.tax_id.trim() || null : null,
      is_vat: v.is_vat,
      bank_name: v.bank_name.trim() || null,
      bank_account_no: v.bank_account_no.trim() || null,
      bank_account_name: v.bank_account_name.trim() || null,
      contract_place: v.contract_place.trim() || null,
      default_credit_days: v.default_credit_days ?? null,
      late_delivery_hours: v.late_delivery_hours ?? null,
      cancel_notice_days: v.cancel_notice_days ?? null,
    };
    this.saving = true;
    this.api.updateShopProfile(payload).subscribe({
      next: () => {
        this.saving = false;
        void this.shopService.refresh(); // printed documents pick the change up straight away
        DialogSuccess('บันทึกข้อมูลร้านเรียบร้อยแล้ว');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        DialogErrorHtmlConfirm(err?.error?.message ?? 'บันทึกข้อมูลร้านไม่สำเร็จ');
      },
    });
  }

  // ---------- branches ----------

  addBranch(): void {
    this.openBranchDialog({ branch: null, isFirst: this.branches.length === 0 }, (payload) =>
      this.api.createBranch({ ...payload, name: payload.name! }));
  }

  editBranch(branch: Branch): void {
    this.openBranchDialog({ branch, isFirst: false }, (payload) => this.api.updateBranch({ ...payload, branch_id: branch.branch_id }));
  }

  async makeMain(branch: Branch): Promise<void> {
    if (!(await ConfirmDialog('ตั้งเป็นสาขาหลัก', `ใช้ที่อยู่ของ "${branch.name}" เป็นค่าเริ่มต้นในเอกสารทั้งหมด`))) return;
    this.runBranch(this.api.updateBranch({ branch_id: branch.branch_id, is_main: true }), 'ตั้งสาขาหลักไม่สำเร็จ');
  }

  async toggleActive(branch: Branch): Promise<void> {
    const next = !branch.is_active;
    const message = next ? `เปิดใช้สาขา "${branch.name}" อีกครั้ง` : `ปิดใช้สาขา "${branch.name}" (จะไม่ให้เลือกในเอกสาร)`;
    if (!(await ConfirmDialog('ยืนยันการเปลี่ยนสถานะ', message))) return;
    this.runBranch(this.api.updateBranch({ branch_id: branch.branch_id, is_active: next }), 'เปลี่ยนสถานะสาขาไม่สำเร็จ');
  }

  private openBranchDialog(data: BranchDialogData, call: (payload: BranchPayload) => ReturnType<ApiService['updateBranch']>): void {
    this.dialog
      .open<BranchDialog, BranchDialogData, BranchPayload>(BranchDialog, { width: '520px', maxWidth: '95vw', data })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.runBranch(call(payload), 'บันทึกสาขาไม่สำเร็จ');
      });
  }

  private runBranch(request: ReturnType<ApiService['updateBranch']>, errorText: string): void {
    request.subscribe({
      next: () => {
        void this.shopService.refresh();
        DialogSuccess('บันทึกสาขาเรียบร้อยแล้ว');
        this.load();
      },
      error: (err) => DialogErrorHtmlConfirm(err?.error?.message ?? errorText),
    });
  }
}
