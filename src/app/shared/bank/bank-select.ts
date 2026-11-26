import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BANKS, Bank, OTHER_BANK, findBank } from './banks';
import { BankBadge } from './bank-badge';
import { CharCount } from '../char-count/char-count';

/**
 * Bank picker with each bank's badge. The form value is the bank's Thai name (or the text typed for "อื่นๆ"),
 * so it works as a drop-in for the old free-text bank field and older saved values are recognised.
 * Use as `<app-bank-select formControlName="bank_name" label="ธนาคาร">`.
 */
@Component({
  selector: 'app-bank-select',
  standalone: true,
  imports: [CharCount, MatFormFieldModule, MatSelectModule, MatInputModule, BankBadge],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BankSelect), multi: true }],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="field">
      <mat-label>{{ label }}</mat-label>
      <mat-select [value]="code" (selectionChange)="pick($event.value)" [disabled]="disabled" (closed)="touched()">
        <mat-select-trigger>
          @if (current; as b) {
            <span class="opt"><app-bank-badge [code]="b.code" [size]="22" /> <span class="name">{{ b.name }}</span></span>
          } @else if (code === other) {
            <span class="opt"><app-bank-badge [code]="other" [size]="22" /> <span class="name">อื่นๆ</span></span>
          }
        </mat-select-trigger>
        <mat-option [value]="null">ไม่ระบุ</mat-option>
        @for (b of banks; track b.code) {
          <mat-option [value]="b.code">
            <span class="opt"><app-bank-badge [code]="b.code" [size]="24" /> <span class="name">{{ b.name }}</span></span>
          </mat-option>
        }
        <mat-option [value]="other">
          <span class="opt"><app-bank-badge [code]="other" [size]="24" /> <span class="name">อื่นๆ (พิมพ์ชื่อธนาคารเอง)</span></span>
        </mat-option>
      </mat-select>
    </mat-form-field>

    @if (code === other) {
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="field custom">
        <mat-label>ชื่อธนาคาร</mat-label>
        <input matInput [value]="custom" maxlength="100" autocomplete="off" (input)="typed($any($event.target).value)" (blur)="touched()" />
        <mat-hint align="end" appCharCount />
      </mat-form-field>
    }
  `,
  styles: [`
    :host { display: block; }
    .field { width: 100%; }
    .custom { margin-top: 12px; }
    .opt { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
    .name { white-space: normal; line-height: 1.25; }
  `],
})
export class BankSelect implements ControlValueAccessor {
  @Input() label = 'ธนาคาร';

  protected readonly banks = BANKS;
  protected readonly other = OTHER_BANK;
  protected code: string | null = null;
  protected custom = '';
  protected disabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected get current(): Bank | null {
    return this.banks.find((b) => b.code === this.code) ?? null;
  }

  writeValue(value: unknown): void {
    const text = String(value ?? '').trim();
    const bank = findBank(text);
    this.custom = '';
    if (!text) this.code = null;
    else if (bank) this.code = bank.code;
    else {
      this.code = OTHER_BANK;
      this.custom = text; // an older free-text value we do not recognise stays editable
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  protected pick(code: string | null): void {
    this.code = code;
    this.custom = '';
    this.onChange(code === null || code === OTHER_BANK ? '' : (this.current?.name ?? ''));
  }

  protected typed(value: string): void {
    this.custom = value;
    this.onChange(value.trim());
  }

  protected touched(): void {
    this.onTouched();
  }
}
