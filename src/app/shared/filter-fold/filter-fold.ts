import { formatDate } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** One line describing the filters in use, e.g. "วันที่ 26/11/2026 · ค้นหา “ไก่”". */
export function filterSummary(parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(' · ') || 'ทุกรายการ';
}

export function keywordPart(keyword: string | null | undefined): string | null {
  const text = keyword?.trim();
  return text ? `ค้นหา “${text}”` : null;
}

export function datePart(date: Date | null | undefined): string | null {
  return date ? `วันที่ ${formatDate(date, 'dd/MM/yyyy', 'en-US')}` : null;
}

/**
 * Phones only (hidden on wider screens by styles.scss): what the list is filtered by, and the button that unfolds
 * the search fields. The summary stays visible so a filtered list is never mistaken for missing data.
 */
@Component({
  selector: 'app-filter-fold',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <p class="summary"><span>แสดง:</span> {{ summary() }}</p>
    <button mat-stroked-button type="button" [class.on]="open()" (click)="open.set(!open())" [attr.aria-expanded]="open()">
      <mat-icon aria-hidden="true">{{ open() ? 'expand_less' : 'search' }}</mat-icon> {{ open() ? 'ปิด' : 'ค้นหา' }}
    </button>
  `,
})
export class FilterFold {
  readonly summary = input.required<string>();
  readonly open = model(false);
}
