import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, inject } from '@angular/core';

/**
 * On phones every mat-table is drawn as a stack of cards (see "Phone tables" in styles.scss). A card cell
 * needs its column title, so this copies each header's text onto the matching cells as data-label.
 * Done in one place (a MutationObserver) so no page template has to change.
 */
@Injectable({ providedIn: 'root' })
export class ResponsiveTableService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private scheduled = false;

  start(): void {
    this.zone.runOutsideAngular(() => {
      const observer = new MutationObserver(() => this.schedule());
      observer.observe(this.document.body, { childList: true, subtree: true });
      this.schedule();
    });
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      this.label();
    });
  }

  private label(): void {
    this.document.querySelectorAll<HTMLTableElement>('table.mat-mdc-table').forEach((table) => {
      const titles = new Map<string, string>();
      table.querySelectorAll<HTMLElement>('th.mat-mdc-header-cell').forEach((th) => {
        const column = this.columnOf(th);
        if (column) titles.set(column, (th.textContent ?? '').trim());
      });
      table.querySelectorAll<HTMLElement>('td.mat-mdc-cell').forEach((td) => {
        const column = this.columnOf(td);
        const title = column ? titles.get(column) : undefined;
        if (title && td.getAttribute('data-label') !== title) td.setAttribute('data-label', title);
        // e.g. an action column with no button for this row: don't draw an empty strip on the card
        const empty = !td.textContent?.trim() && !td.querySelector('button, a, input, mat-icon, mat-chip, img');
        td.toggleAttribute('data-empty', empty);
        const text = (td.textContent ?? '').trim();
        // long text takes a whole line of the card; the running number column is dropped on cards
        td.toggleAttribute('data-wide', text.length > 22);
        td.toggleAttribute('data-skip', /^(no\.?|#|ลำดับ)$/i.test(title ?? ''));
      });
    });
  }

  private columnOf(cell: HTMLElement): string | null {
    return Array.from(cell.classList).find((c) => c.startsWith('mat-column-')) ?? null;
  }
}
