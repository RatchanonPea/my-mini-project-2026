import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ReplaySubject } from 'rxjs';

/**
 * Backs the search box inside a long mat-select dropdown (categories, roles, prices, ...) —
 * anything whose option list can grow enough that scrolling to find one gets tedious.
 * Usage: `roles$ = new SelectSearch<Role>((r, q) => r.role_name.toLowerCase().includes(q), this.destroyRef);`
 * then `roles$.setSource(loadedRoles)` whenever the source list loads/changes, and bind the
 * dropdown's <ngx-mat-select-search [formControl]="roles$.control"> / `*ngFor` over `roles$.filtered$ | async`.
 */
export class SelectSearch<T> {
  readonly control = new FormControl('');
  readonly filtered$ = new ReplaySubject<T[]>(1);
  private source: T[] = [];

  constructor(private matcher: (item: T, search: string) => boolean, destroyRef: DestroyRef) {
    this.control.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.emit());
  }

  setSource(items: T[]): void {
    this.source = items;
    this.emit();
  }

  private emit(): void {
    const search = (this.control.value ?? '').trim().toLowerCase();
    this.filtered$.next(search ? this.source.filter((item) => this.matcher(item, search)) : this.source);
  }
}
