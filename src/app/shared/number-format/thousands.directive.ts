import { Directive, ElementRef, HostListener, forwardRef, inject, input } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';

/**
 * Number input that shows thousands separators while typing (1000000 → 1,000,000).
 * Use on a plain input in place of type="number": the form control still holds a number (or null).
 * `decimals` is how many digits may follow the point (0 = whole numbers only). `min` / `max` are validated.
 */
@Directive({
  selector: 'input[appThousands]',
  standalone: true,
  host: { type: 'text', inputmode: 'decimal', autocomplete: 'off' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ThousandsInput), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => ThousandsInput), multi: true },
  ],
})
export class ThousandsInput implements ControlValueAccessor, Validator {
  readonly decimals = input(2);
  readonly min = input<number | string | null>(null);
  readonly max = input<number | string | null>(null);

  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: number | string | null): void {
    const n = value === null || value === undefined || value === '' ? null : Number(value);
    this.el.value = n === null || Number.isNaN(n) ? '' : this.group(String(n));
  }
  registerOnChange(fn: (value: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.el.disabled = disabled; }

  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value as number | null;
    if (v === null || v === undefined || Number.isNaN(v)) return null;
    const min = this.bound(this.min()), max = this.bound(this.max());
    if (min !== null && v < min) return { min: { min, actual: v } };
    if (max !== null && v > max) return { max: { max, actual: v } };
    return null;
  }

  @HostListener('input')
  onInput(): void {
    const raw = this.el.value;
    const caret = this.el.selectionStart ?? raw.length;
    const wanted = raw.slice(0, caret).replace(/[^\d.]/g, '').length; // digits / point to the left of the caret
    const clean = this.clean(raw);
    const text = this.group(clean);
    if (text !== raw) {
      this.el.value = text;
      let pos = 0, seen = 0;
      while (pos < text.length && seen < wanted) { if (text[pos] !== ',') seen++; pos++; }
      this.el.setSelectionRange(pos, pos);
    }
    this.onChange(clean === '' || clean === '.' ? null : Number(clean));
  }

  @HostListener('blur')
  onBlur(): void {
    this.el.value = this.group(this.clean(this.el.value).replace(/\.$/, ''));
    this.onTouched();
  }

  /** digits and at most one point, limited to the allowed decimals */
  private clean(raw: string): string {
    const dec = this.decimals();
    let s = raw.replace(/[^\d.]/g, '');
    const i = s.indexOf('.');
    if (i >= 0) s = dec > 0 ? s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '').slice(0, dec) : s.slice(0, i);
    return s.replace(/^0+(?=\d)/, '');
  }

  private group(clean: string): string {
    const [int, frac] = clean.split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return frac === undefined ? grouped : `${grouped}.${frac}`;
  }

  private bound(v: number | string | null): number | null {
    if (v === null || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
}
