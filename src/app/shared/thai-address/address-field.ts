import { Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  AddressRow,
  AddressSelection,
  BANGKOK,
  EMPTY_SELECTION,
  composeAddress,
  loadAddressRows,
  parseAddress,
} from '../../common/thai-address';
import { AddressPickerData, AddressPickerDialog } from './address-picker-dialog';
import { ClearButton } from '../clear-button/clear-button';
import { CharCount } from '../char-count/char-count';

/**
 * Address entry: a free "house no. / soi / road" line, plus a read-only box each for sub-district / district /
 * province / postal code, filled from a drill-down table (double-click a row at each level), and the joined text. The form value stays
 * one string such as "99/1 ถนนเพชรเกษม ต.หนองแค อ.เมือง จ.ราชบุรี 70000", so storage and printing are unchanged.
 */
@Component({
  selector: 'app-address-field',
  standalone: true,
  imports: [CharCount, ClearButton, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AddressInput), multi: true }],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>บ้านเลขที่ หมู่ ซอย ถนน</mat-label>
      <textarea matInput [formControl]="detail" maxlength="200" autocomplete="off" (input)="emit()" (blur)="onTouched()" rows="2"></textarea>
      <app-clear-button matSuffix />
      <mat-hint align="end" appCharCount />
    </mat-form-field>
    <div class="actions">
      <button mat-stroked-button type="button" [disabled]="disabled() || loading()" (click)="open()">
        <mat-icon aria-hidden="true">travel_explore</mat-icon> เลือกจังหวัด/อำเภอ/ตำบล
      </button>
      @if (hasArea() && !disabled()) {
        <button mat-button type="button" (click)="clearArea()"><mat-icon aria-hidden="true">backspace</mat-icon> ล้าง</button>
      }
    </div>
    <div class="parts" (dblclick)="open()">
      <mat-form-field appearance="outline">
        <mat-label>{{ bangkok() ? 'แขวง' : 'ตำบล' }}</mat-label>
        <input matInput readonly [value]="area().sub" placeholder="ดับเบิลคลิกเพื่อเลือก" [disabled]="disabled()" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>{{ bangkok() ? 'เขต' : 'อำเภอ' }}</mat-label>
        <input matInput readonly [value]="area().district" [disabled]="disabled()" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>จังหวัด</mat-label>
        <input matInput readonly [value]="area().province" [disabled]="disabled()" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>รหัสไปรษณีย์</mat-label>
        <input matInput readonly [value]="area().zip" [disabled]="disabled()" />
      </mat-form-field>
    </div>
    <mat-form-field appearance="outline">
      <mat-label>{{ label() }}</mat-label>
      <input matInput readonly [value]="full()" [disabled]="disabled()" />
    </mat-form-field>
    @if (loadFailed()) {
      <p class="err" role="alert">โหลดรายชื่อจังหวัด/อำเภอ/ตำบลไม่สำเร็จ — ตรวจสอบการเชื่อมต่อแล้วเปิดหน้านี้ใหม่</p>
    }
  `,
  styles: [`
    :host { display: block; width: 100%; }
    mat-form-field { width: 100%; }
    .parts { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); column-gap: 12px; cursor: pointer; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin: -4px 0 12px; }
    .err { margin: -6px 0 8px; font-size: 0.875rem; color: var(--mat-sys-error, #b3261e); }
  `],
})
export class AddressInput implements ControlValueAccessor {
  readonly label = input('ที่อยู่');

  private readonly dialog = inject(MatDialog);

  protected readonly detail = new FormControl('', { nonNullable: true });
  private readonly rows = signal<AddressRow[]>([]);
  protected readonly area = signal<AddressSelection>({ ...EMPTY_SELECTION });
  protected readonly disabled = signal(false);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);

  protected readonly bangkok = computed(() => this.area().province === BANGKOK);
  protected readonly hasArea = computed(() => !!this.area().province);

  private readonly detailText = signal('');
  protected readonly full = computed(() => composeAddress({ detail: this.detailText(), ...this.area() }));

  private lastValue = '';
  private edited = false;
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor() {
    loadAddressRows().then(
      (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
        if (!this.edited) this.applyText(this.lastValue); // the value arrived before the list did
      },
      () => { this.loading.set(false); this.loadFailed.set(true); },
    );
  }

  writeValue(value: string | null): void {
    this.lastValue = value ?? '';
    this.applyText(this.lastValue);
  }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
    if (disabled) this.detail.disable({ emitEvent: false }); else this.detail.enable({ emitEvent: false });
  }

  protected open(): void {
    if (this.disabled() || this.loading() || !this.rows().length) return;
    this.dialog
      .open<AddressPickerDialog, AddressPickerData, AddressSelection>(AddressPickerDialog, { data: { rows: this.rows() }, autoFocus: 'dialog' })
      .afterClosed()
      .subscribe((picked) => {
        if (picked) { this.area.set(picked); this.emit(); }
        this.onTouched();
      });
  }

  protected clearArea(): void {
    this.area.set({ ...EMPTY_SELECTION });
    this.emit();
  }

  protected emit(): void {
    this.edited = true;
    this.detailText.set(this.detail.value);
    this.lastValue = composeAddress({ detail: this.detail.value, ...this.area() });
    this.onChange(this.lastValue);
  }

  private applyText(text: string): void {
    const parts = parseAddress(text, this.rows());
    this.area.set({ sub: parts.sub, district: parts.district, province: parts.province, zip: parts.zip });
    this.detail.setValue(parts.detail, { emitEvent: false });
    this.detailText.set(parts.detail);
  }
}
