import { ComponentType } from '@angular/cdk/portal';
import { formatDate, formatNumber } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface RowField {
  label: string;
  value: string | number | null | undefined;
  /** bookkeeping (who / when): printed small under the slip */
  meta?: boolean;
}

export interface RowAction {
  label: string;
  icon: string;
  /** runs after the panel has closed */
  run: () => void;
  kind?: 'primary' | 'warn';
}

export interface RowDrawerData {
  title: string;
  subtitle?: string;
  icon: string;
  /** the one number or word the row is about, drawn large */
  highlight?: { label: string; value: string; negative?: boolean };
  fields: RowField[];
  actions?: RowAction[];
}

export function money(value: number | null | undefined, digits = '1.0-2'): string {
  return value === null || value === undefined ? '-' : `THB ${formatNumber(Number(value), 'en-US', digits)}`;
}

export function dateText(value: string | Date | null | undefined, format = 'dd/MM/yyyy', timezone?: string): string {
  return value ? formatDate(value, format, 'en-US', timezone) : '-';
}

/**
 * Opens any dialog component as a panel sliding in from the right edge. The table row that was
 * clicked (it has the focus at this moment) stays marked while the panel is open.
 */
export function openDrawer<T, D, R = unknown>(dialog: MatDialog, component: ComponentType<T>, data: D): MatDialogRef<T, R> {
  const row = document.activeElement?.closest('tr.mat-mdc-row');
  row?.classList.add('row-open');
  const ref = dialog.open<T, D, R>(component, {
    data,
    position: { top: '12px', right: '12px' },
    width: '460px',
    maxWidth: '100vw',
    height: 'calc(100dvh - 24px)',
    maxHeight: '100dvh',
    panelClass: 'row-drawer',
    autoFocus: 'dialog',
  });
  ref.afterClosed().subscribe(() => row?.classList.remove('row-open'));
  return ref;
}

/** Overview of one table row: title, one large figure, the rest as label / value lines. */
@Component({
  selector: 'app-row-drawer',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <header class="slip-head">
      <span class="slip-icon"><mat-icon aria-hidden="true">{{ data.icon }}</mat-icon></span>
      <div class="slip-title">
        <h2 mat-dialog-title>{{ data.title }}</h2>
        @if (data.subtitle) { <p>{{ data.subtitle }}</p> }
      </div>
      <button mat-icon-button type="button" mat-dialog-close aria-label="ปิด"><mat-icon>close</mat-icon></button>
    </header>

    <mat-dialog-content class="slip-body">
      <div class="slip">
        @if (data.highlight; as h) {
          <div class="slip-total">
            <span>{{ h.label }}</span>
            <strong [class.negative]="h.negative">{{ h.value }}</strong>
          </div>
          <div class="slip-perf" aria-hidden="true"></div>
        }
        <dl class="slip-lines">
          @for (f of lines; track f.label) {
            <dt [class.wide]="isLong(f)">{{ f.label }}</dt>
            <dd [class.wide]="isLong(f)" [class.blank]="isBlank(f)">{{ isBlank(f) ? '-' : f.value }}</dd>
          }
        </dl>
      </div>
      @if (meta.length) {
        <p class="slip-meta">
          @for (f of meta; track f.label) { <span>{{ f.label }} {{ f.value }}</span> }
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions class="slip-actions">
      @for (a of data.actions ?? []; track a.label) {
        @if (a.kind === 'primary') {
          <button mat-flat-button class="is-primary" type="button" (click)="run(a)"><mat-icon>{{ a.icon }}</mat-icon> {{ a.label }}</button>
        } @else {
          <button mat-stroked-button [class.is-warn]="a.kind === 'warn'" type="button" (click)="run(a)"><mat-icon>{{ a.icon }}</mat-icon> {{ a.label }}</button>
        }
      } @empty {
        <button mat-flat-button class="is-primary" type="button" mat-dialog-close>ปิด</button>
      }
    </mat-dialog-actions>
  `,
})
export class RowDrawer {
  readonly data = inject<RowDrawerData>(MAT_DIALOG_DATA);
  private ref = inject<MatDialogRef<RowDrawer>>(MatDialogRef);

  readonly lines = this.data.fields.filter((f) => !f.meta);
  readonly meta = this.data.fields.filter((f) => f.meta && !this.isBlank(f) && f.value !== '-');

  isBlank(field: RowField): boolean {
    return field.value === null || field.value === undefined || field.value === '';
  }

  /** long text (address, note) reads better on its own full line */
  isLong(field: RowField): boolean {
    return String(field.value ?? '').length > 24;
  }

  run(action: RowAction): void {
    this.ref.afterClosed().subscribe(() => action.run());
    this.ref.close();
  }
}
