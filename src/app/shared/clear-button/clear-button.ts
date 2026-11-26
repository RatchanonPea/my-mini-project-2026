import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_FORM_FIELD } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

/**
 * Clear (X) button for a text field, built the way the Material docs do a clear button:
 * a `mat-icon-button` in the field's suffix. Drop it right after the input, inside the mat-form-field:
 *
 *   <input matInput formControlName="name" />
 *   <app-clear-button matSuffix />
 *
 * It finds its field through MAT_FORM_FIELD, so it works with formControlName, formControl and ngModel.
 */
@Component({
  selector: 'app-clear-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    @if (visible) {
      <button mat-icon-button type="button" aria-label="ล้างข้อความ" title="ล้างข้อความ" (mousedown)="$event.preventDefault()" (click)="clear()">
        <mat-icon>close</mat-icon>
      </button>
    }
  `,
})
export class ClearButton {
  private readonly field = inject(MAT_FORM_FIELD);

  protected get visible(): boolean {
    const control = this.field._control;
    return !!control && !control.empty && !control.disabled;
  }

  protected clear(): void {
    const control = this.field._control;
    control.ngControl?.control?.setValue(null);
    control.ngControl?.control?.markAsDirty();
    control.onContainerClick?.({ target: null } as unknown as MouseEvent);
  }
}
