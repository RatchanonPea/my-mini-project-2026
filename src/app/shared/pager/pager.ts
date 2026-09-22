import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

type PageItem = number | 'gap-start' | 'gap-end';

@Component({
  selector: 'app-pager',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (total() > 0) {
      <nav class="pager" aria-label="เลือกหน้า">
        <span class="pager-info">{{ from() }}–{{ to() }} จาก {{ total() }}</span>
        <div class="pager-buttons">
          <button type="button" class="pager-btn pager-arrow" [disabled]="pageIndex() === 0"
                  (click)="go(pageIndex() - 1)" aria-label="หน้าก่อนหน้า"><mat-icon>chevron_left</mat-icon></button>
          @for (item of items(); track item) {
            @if (item === 'gap-start' || item === 'gap-end') {
              <span class="pager-gap" aria-hidden="true">…</span>
            } @else {
              <button type="button" class="pager-btn" [class.active]="item === pageIndex()"
                      [attr.aria-current]="item === pageIndex() ? 'page' : null" (click)="go(item)">{{ item + 1 }}</button>
            }
          }
          <button type="button" class="pager-btn pager-arrow" [disabled]="pageIndex() >= pageCount() - 1"
                  (click)="go(pageIndex() + 1)" aria-label="หน้าถัดไป"><mat-icon>chevron_right</mat-icon></button>
        </div>
      </nav>
    }
  `,
  styles: `
    :host { display: block; }

    .pager {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 1rem 0.5rem 0.25rem;
    }

    .pager-info {
      font-size: 0.85rem;
      color: #7c6a5e;
    }

    .pager-buttons {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.25rem;
      margin-left: auto;
    }

    .pager-btn {
      min-width: 40px;
      height: 40px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: inherit;
      font: 500 0.9rem inherit;
      display: inline-grid;
      place-items: center;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.15s ease, color 0.2s ease;
    }

    .pager-btn:hover:not(:disabled):not(.active) {
      background: rgba(124, 45, 18, 0.1);
    }

    .pager-btn:active:not(:disabled) {
      transform: scale(0.94);
    }

    .pager-btn.active {
      background: #ea580c;
      color: #fff;
      font-weight: 700;
      cursor: default;
    }

    .pager-btn:disabled {
      opacity: 0.38;
      cursor: not-allowed;
    }

    .pager-gap {
      min-width: 28px;
      text-align: center;
      color: #7c6a5e;
    }

    :host-context(html.dark-theme) .pager-btn:hover:not(:disabled):not(.active) {
      background: rgba(255, 237, 213, 0.12);
    }

    :host-context(html.dark-theme) .pager-btn.active {
      background: #ea580c;
      color: #fff;
    }

    :host-context(html.dark-theme) .pager-info,
    :host-context(html.dark-theme) .pager-gap {
      color: #b9a79b;
    }
  `,
})
export class Pager {
  readonly total = input(0);
  readonly pageSize = input(10);
  readonly pageIndex = input(0);
  readonly pageChange = output<number>();

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))));
  readonly from = computed(() => (this.total() === 0 ? 0 : this.pageIndex() * this.pageSize() + 1));
  readonly to = computed(() => Math.min(this.total(), (this.pageIndex() + 1) * this.pageSize()));

  // 1 2 3 … 225 style: always first and last, a window around the current page, gaps as an ellipsis
  readonly items = computed<PageItem[]>(() => {
    const count = this.pageCount();
    const current = this.pageIndex();
    if (count <= 7) {
      return Array.from({ length: count }, (_, i) => i);
    }
    const items: PageItem[] = [0];
    const start = Math.max(1, Math.min(current - 1, count - 4));
    const end = Math.min(count - 2, Math.max(current + 1, 3));
    if (start > 1) {
      items.push('gap-start');
    }
    for (let i = start; i <= end; i++) {
      items.push(i);
    }
    if (end < count - 2) {
      items.push('gap-end');
    }
    items.push(count - 1);
    return items;
  });

  go(index: number): void {
    if (index < 0 || index >= this.pageCount() || index === this.pageIndex()) {
      return;
    }
    this.pageChange.emit(index);
  }
}
