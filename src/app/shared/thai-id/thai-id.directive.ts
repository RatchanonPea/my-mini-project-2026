import { Directive, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { digitsOnly, formatThaiId } from '../../common/thai-id';

/**
 * Puts a Thai ID number in card layout while typing (1-2345-67890-12-3) but keeps the form value as the bare
 * 13 digits: that is what is stored and validated. Use on `<input matInput formControlName="...">`.
 */
@Directive({
  selector: 'input[appThaiId]',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ThaiIdInput), multi: true }],
})
export class ThaiIdInput implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.el.value = formatThaiId(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.el.disabled = disabled;
  }

  // a letter typed or dropped in never reaches the field (pasted text is cleaned in handleInput)
  @HostListener('beforeinput', ['$event'])
  onBeforeInput(event: InputEvent): void {
    if (event.data && /\D/.test(event.data)) event.preventDefault();
  }

  @HostListener('input')
  handleInput(): void {
    const before = this.el.value;
    const caret = this.el.selectionStart ?? before.length;
    const digitsBeforeCaret = digitsOnly(before.slice(0, caret)).length;

    const digits = digitsOnly(before);
    const formatted = formatThaiId(digits);
    this.el.value = formatted;

    // keep the caret next to the same digit, so editing in the middle does not jump to the end
    let pos = 0;
    for (let seen = 0; pos < formatted.length && seen < digitsBeforeCaret; pos++) {
      if (/\d/.test(formatted[pos])) seen++;
    }
    this.el.setSelectionRange(pos, pos);

    this.onChange(digits);
  }

  @HostListener('blur')
  handleBlur(): void {
    this.onTouched();
  }
}
