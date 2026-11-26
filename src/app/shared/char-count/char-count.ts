import { Component, ElementRef, inject } from '@angular/core';
import { MAT_FORM_FIELD } from '@angular/material/form-field';

/**
 * Character counter for a field with maxlength, like the "Form field with hints" example in the Material docs
 * (`<mat-hint align="end">{{ value().length }}/10</mat-hint>`), reusable so each field needn't track its own value:
 *
 *   <input matInput formControlName="name" maxlength="50" />
 *   <mat-hint align="end" appCharCount />
 */
@Component({
  selector: 'mat-hint[appCharCount]',
  standalone: true,
  template: `{{ length }}/{{ max }}`,
})
export class CharCount {
  private readonly field = inject(MAT_FORM_FIELD);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected get length(): number {
    const value = this.field._control?.value;
    return value == null ? 0 : String(value).length;
  }

  protected get max(): number {
    const input = this.host.nativeElement.closest('mat-form-field')?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    return input?.maxLength ?? 0;
  }
}
