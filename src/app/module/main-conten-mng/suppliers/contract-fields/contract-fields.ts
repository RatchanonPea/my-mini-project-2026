import { AfterViewInit, Component, DestroyRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ShopEntityType } from '../../../../services/api';
import { thaiId13Validator, thaiNationalIdValidator } from '../../../../common/thai-id';
import { BankSelect } from '../../../../shared/bank/bank-select';
import { DigitsOnlyInput } from '../../../../shared/thai-id/digits-only.directive';
import { ThaiIdInput } from '../../../../shared/thai-id/thai-id.directive';
import { ClearButton } from '../../../../shared/clear-button/clear-button';
import { CharCount } from '../../../../shared/char-count/char-count';

/** Controls the supplier forms add so the form can hold the contract details. */
export const contractControls = () => ({
  entity_type: ['individual' as ShopEntityType],
  legal_name: [''],
  tax_id: ['', [thaiNationalIdValidator]],
  contact_name: [''],
  contact_position: [''],
  bank_name: [''],
  bank_account_no: [''],
  bank_account_name: [''],
  credit_days: [null as number | null, [Validators.min(0), Validators.max(365), Validators.pattern(/^\d+$/)]],
});

/**
 * Required before a supplier can be saved: these are what makes the supply agreement a usable document
 * (who exactly the seller is, and who signs for them). Bank account and credit stay optional.
 * Keep in step with CONTRACT_REQUIRED in the backend's suppliersRoute.js.
 */
export const REQUIRED_CONTRACT_FIELDS: Record<ShopEntityType, string[]> = {
  individual: ['legal_name', 'tax_id'],
  juristic: ['legal_name', 'tax_id', 'contact_name', 'contact_position'],
};
const ALL_REQUIRED = [...new Set(Object.values(REQUIRED_CONTRACT_FIELDS).flat())];
/** ID / tax number and bank account: hidden from roles that may not read or change them */
const PRIVATE_FIELDS = ['tax_id', 'bank_name', 'bank_account_no', 'bank_account_name'];

/**
 * "Contract details" block under a supplier form. Pick individual or juristic person first: the fields that
 * follow are the ones that kind of supplier needs. The badge is red until every required field is filled
 * (the form cannot be saved meanwhile) and green once it is complete.
 */
@Component({
  selector: 'app-supplier-contract-fields',
  standalone: true,
  imports: [CharCount, ClearButton, ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonToggleModule, BankSelect, DigitsOnlyInput, ThaiIdInput],
  template: `
    <mat-expansion-panel class="contract-panel" [class.is-bad]="missing > 0" [class.is-ok]="missing === 0" [formGroup]="form">
      <mat-expansion-panel-header>
        <mat-panel-title class="head">
          <span class="head-icon"><mat-icon aria-hidden="true">description</mat-icon></span>
          <span class="head-text">
            <span class="head-title"><span class="long">ข้อมูลสำหรับทำสัญญา</span><span class="short">ข้อมูลสัญญา</span></span>
            <span class="head-sub">{{ missing > 0 ? 'ต้องกรอกให้ครบก่อนจึงจะบันทึกได้' : 'พร้อมใช้ในข้อตกลงซื้อขายไก่' }}</span>
          </span>
        </mat-panel-title>
        <span class="status" [class.bad]="missing > 0" [class.ok]="missing === 0"
              [attr.aria-label]="missing > 0 ? 'ยังไม่ครบ ขาด ' + missing + ' ช่อง' : 'กรอกครบแล้ว'">
          <mat-icon aria-hidden="true">{{ missing > 0 ? 'error' : 'check_circle' }}</mat-icon>
          <span class="long">{{ missing > 0 ? 'ขาด ' + missing + ' ช่อง' : 'ครบแล้ว' }}</span>
          <span class="short">{{ missing > 0 ? missing : '' }}</span>
        </span>
      </mat-expansion-panel-header>

      @if (missing > 0) {
        <p class="rule"><mat-icon aria-hidden="true">info</mat-icon> ช่องที่มี * ต้องกรอกก่อนบันทึก ส่วนธนาคารและเครดิตไม่บังคับ</p>
      }

      <div class="type-row">
        <span class="type-label">ผู้ขายเป็น</span>
        <mat-button-toggle-group formControlName="entity_type" aria-label="ประเภทผู้ขาย">
          <mat-button-toggle value="individual">บุคคลธรรมดา</mat-button-toggle>
          <mat-button-toggle value="juristic">นิติบุคคล</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <section class="group">
        <h4><mat-icon aria-hidden="true">badge</mat-icon> {{ isJuristic ? 'ข้อมูลนิติบุคคล' : 'ข้อมูลผู้ขาย' }}</h4>
        <div class="fields">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>{{ isJuristic ? 'ชื่อนิติบุคคล (เช่น บริษัท ... จำกัด)' : 'ชื่อ-นามสกุล (ตามบัตรประชาชน)' }}</mat-label>
            <input matInput formControlName="legal_name" maxlength="200" autocomplete="off" />
            <app-clear-button matSuffix />
            <mat-hint align="end" appCharCount />
            <mat-error>{{ isJuristic ? 'กรุณากรอกชื่อนิติบุคคล' : 'กรุณากรอกชื่อ-นามสกุล' }}</mat-error>
          </mat-form-field>
          @if (showPrivate) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>{{ isJuristic ? 'เลขทะเบียนนิติบุคคล/เลขประจำตัวผู้เสียภาษี' : 'เลขประจำตัวประชาชน' }}</mat-label>
            <input matInput appThaiId formControlName="tax_id" inputmode="numeric" placeholder="X-XXXX-XXXXX-XX-X" autocomplete="off" />
            <app-clear-button matSuffix />
            <mat-hint>พิมพ์ได้เฉพาะตัวเลข 13 หลัก</mat-hint>
            <mat-error>{{ taxIdError }}</mat-error>
          </mat-form-field>
          }
          @if (isJuristic) {
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>ผู้มีอำนาจลงนาม</mat-label>
              <input matInput formControlName="contact_name" maxlength="100" autocomplete="off" />
              <app-clear-button matSuffix />
              <mat-hint align="end" appCharCount />
              <mat-error>กรุณากรอกชื่อผู้มีอำนาจลงนาม</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>ตำแหน่ง (เช่น กรรมการผู้จัดการ)</mat-label>
              <input matInput formControlName="contact_position" maxlength="100" autocomplete="off" />
              <app-clear-button matSuffix />
              <mat-hint align="end" appCharCount />
              <mat-error>กรุณากรอกตำแหน่ง</mat-error>
            </mat-form-field>
          }
        </div>
      </section>

      <section class="group">
        <h4><mat-icon aria-hidden="true">account_balance</mat-icon> การชำระเงิน <span class="optional">ไม่บังคับ</span></h4>
        @if (!showPrivate) {
          <p class="private-note"><mat-icon aria-hidden="true">lock</mat-icon> เลขประจำตัวและบัญชีธนาคารของผู้ขาย ดูและแก้ไขได้เฉพาะผู้จัดการหรือแอดมิน</p>
        }
        <div class="fields">
          @if (showPrivate) {
          <app-bank-select formControlName="bank_name" label="ธนาคาร" />
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>เลขที่บัญชี</mat-label>
            <input matInput appDigitsOnly formControlName="bank_account_no" maxlength="20" inputmode="numeric" autocomplete="off" />
            <app-clear-button matSuffix />
            <mat-hint align="end" appCharCount />
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>ชื่อบัญชี</mat-label>
            <input matInput formControlName="bank_account_name" maxlength="200" autocomplete="off" />
            <app-clear-button matSuffix />
            <mat-hint align="end" appCharCount />
          </mat-form-field>
          }
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>เครดิต (วัน)</mat-label>
            <input matInput appDigitsOnly type="number" min="0" max="365" step="1" formControlName="credit_days" />
            <app-clear-button matSuffix />
            <mat-hint>0 = เงินสดเมื่อรับ</mat-hint>
            <mat-error>ใส่จำนวนวันเต็ม 0-365</mat-error>
          </mat-form-field>
        </div>
      </section>
    </mat-expansion-panel>
  `,
  styles: [`
    /* size by the width of this block, not the screen: it sits in a ~290px column on the add-supplier form */
    :host { display: block; margin-bottom: 1rem; container-type: inline-size; }

    .contract-panel {
      --mat-expansion-container-shape: 14px;
      --mat-expansion-header-collapsed-state-height: 68px;
      --mat-expansion-header-expanded-state-height: 68px;
      box-shadow: none !important;
      border: 1px solid var(--app-border);
      background: var(--app-surface-alt);
    }
    .contract-panel.is-bad { border-color: rgba(220, 38, 38, 0.55); }
    .contract-panel.is-ok { border-color: rgba(22, 163, 74, 0.55); }

    .head { display: flex; align-items: center; gap: 12px; flex: 1 1 auto; min-width: 0; margin-right: 12px; }
    .head-icon {
      flex: none; width: 40px; height: 40px; border-radius: 12px;
      display: grid; place-items: center;
      background: rgba(234, 88, 12, 0.14); color: var(--app-accent-strong);
    }
    .head-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }
    .head-title { font-weight: 700; font-size: 1rem; color: var(--app-text); white-space: nowrap; }
    .head-title .short { display: none; }
    .head-sub { font-size: 0.875rem; color: var(--app-text-muted); white-space: normal; }

    /* fixed height + line-height: the header is 68px tall and would otherwise stretch the badge into a tall oval */
    .status {
      flex: none; margin-right: 8px; padding: 0 12px 0 8px; height: 28px; line-height: 1;
      display: inline-flex; align-items: center; gap: 4px; border-radius: 999px;
      font-size: 0.875rem; font-weight: 700; white-space: nowrap;
    }
    .status mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .status.bad { background: rgba(220, 38, 38, 0.15); color: #b91c1c; }
    .status.ok { background: rgba(22, 163, 74, 0.16); color: #15803d; }
    :host-context(html.dark-theme) .status.bad { background: rgba(248, 113, 113, 0.2); color: #fca5a5; }
    :host-context(html.dark-theme) .status.ok { background: rgba(74, 222, 128, 0.18); color: #86efac; }
    .status .short { display: none; }

    .rule {
      display: flex; align-items: center; gap: 6px; margin: 0 0 12px; padding: 8px 12px;
      border-radius: 10px; font-size: 0.875rem;
      background: rgba(220, 38, 38, 0.1); color: #b91c1c;
    }
    :host-context(html.dark-theme) .rule { background: rgba(248, 113, 113, 0.14); color: #fca5a5; }
    .rule mat-icon { font-size: 18px; width: 18px; height: 18px; flex: none; }

    .private-note { display: flex; align-items: center; gap: 6px; margin: 0 0 8px; font-size: 0.875rem; color: var(--app-text-muted); }
    .private-note mat-icon { flex: none; font-size: 18px; width: 18px; height: 18px; }

    .type-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 4px 0 14px; }
    .type-label { font-weight: 600; }

    .group { padding: 4px 0 2px; }
    .group + .group { border-top: 1px dashed var(--app-border); margin-top: 8px; padding-top: 14px; }
    .group h4 {
      display: flex; align-items: center; gap: 6px; margin: 0 0 12px;
      font-size: 0.875rem; font-weight: 700; letter-spacing: 0.02em; color: var(--app-text-soft);
    }
    .group h4 mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--app-accent-strong); }
    .optional { font-weight: 500; font-size: 0.875rem; color: var(--app-text-muted); }
    .fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px 14px; padding-top: 8px; align-items: start; }
    :host ::ng-deep .contract-panel .mat-mdc-form-field { background: transparent; }
    :host ::ng-deep .contract-panel .mat-expansion-panel-body { padding: 0 20px 18px; }

    @container (max-width: 520px) {
      .head { gap: 10px; margin-right: 6px; }
      .head-sub { display: none; }
      .head-title .long { display: none; }
      .head-title .short { display: inline; }
      .head-icon { width: 34px; height: 34px; border-radius: 10px; }
      .status { padding: 0 8px 0 6px; margin-right: 4px; }
      .status .long { display: none; }
      .status .short { display: inline; }
      :host ::ng-deep .contract-panel .mat-expansion-panel-body { padding: 0 12px 14px; }
    }
  `],
})
export class SupplierContractFields implements OnInit, AfterViewInit {
  @ViewChild(MatExpansionPanel) private panel?: MatExpansionPanel;
  private readonly destroyRef = inject(DestroyRef);

  // typed loosely on purpose: the parent forms differ in their other controls
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input({ required: true }) form!: FormGroup<any>;
  /** false: the viewer may not see or change the ID / tax number and bank account */
  @Input() showPrivate = true;

  get isJuristic(): boolean {
    return this.form.controls['entity_type']?.value === 'juristic';
  }

  /** why the ID field is invalid, in words the user can act on */
  protected get taxIdError(): string {
    const errors = this.form.controls['tax_id'].errors;
    if (errors?.['required']) return 'กรุณากรอกเลข 13 หลัก';
    if (errors?.['thaiIdChecksum']) return 'เลขบัตรประชาชนไม่ถูกต้อง (ตรวจสอบเลขอีกครั้ง)';
    return 'ต้องเป็นตัวเลข 13 หลัก';
  }

  private get required(): string[] {
    return REQUIRED_CONTRACT_FIELDS[this.isJuristic ? 'juristic' : 'individual'];
  }

  /** how many required fields are still empty or invalid */
  protected get missing(): number {
    return this.required.filter((key) => {
      const control: AbstractControl = this.form.controls[key];
      if (control?.disabled) return false;
      return !control || String(control.value ?? '').trim() === '' || control.invalid;
    }).length;
  }

  ngOnInit(): void {
    // disabled controls are left out of validation, so what is hidden never blocks saving
    if (!this.showPrivate) PRIVATE_FIELDS.forEach((key) => this.form.controls[key].disable({ emitEvent: false }));
    // required fields depend on the kind of supplier: the form cannot be saved while any is missing
    this.applyRules();
    this.form.controls['entity_type'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyRules());
  }

  ngAfterViewInit(): void {
    // show what is missing instead of leaving it behind a closed panel
    if (this.missing > 0) Promise.resolve().then(() => this.panel?.open());
  }

  private applyRules(): void {
    for (const key of ALL_REQUIRED) {
      const control = this.form.controls[key];
      if (this.required.includes(key)) control.addValidators(Validators.required);
      else control.removeValidators(Validators.required);
      control.updateValueAndValidity({ emitEvent: false });
    }
    // an individual's number is checked against the ID card's check digit; a juristic id only has to be 13 digits
    const taxId = this.form.controls['tax_id'];
    taxId.setValidators([Validators.required, this.isJuristic ? thaiId13Validator : thaiNationalIdValidator]);
    taxId.updateValueAndValidity({ emitEvent: false });
  }
}
