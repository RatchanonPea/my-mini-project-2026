import { TodayButton } from '../../../shared/calendar-today/calendar-today';
import { ThousandsInput } from '../../../shared/number-format/thousands.directive';
import { NoData } from '../../../shared/no-data/no-data';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AppDateModule } from '../../../shared/app-date/app-date';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Pager } from '../../../shared/pager/pager';
import { SelectSearch } from '../../../shared/select-search/select-search';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiService, Category, ExpenseItem } from '../../../services/api';
import { DialogErrorHtmlConfirm, DialogSuccess, toYmd, ScrollToEditForm } from '../../../common/helper';
import { ClearButton } from '../../../shared/clear-button/clear-button';
import { RowDrawer, RowDrawerData, dateText, money, openDrawer } from '../../../shared/row-drawer/row-drawer';
import { MatDialog } from '@angular/material/dialog';
import { FilterFold, filterSummary, datePart, keywordPart } from '../../../shared/filter-fold/filter-fold';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [FilterFold, ClearButton, ThousandsInput, TodayButton, NoData, CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTableModule, Pager, MatSelectModule, MatDatepickerModule, AppDateModule, NgxMatSelectSearchModule],
  templateUrl: './expenses.html',
  styleUrls: ['./expenses.scss']
})
export class Expenses implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private reload$ = new Subject<void>();
  private revealHistory = false;
  /** expense to show in the side panel once the first result is in (arrived from the calendar) */
  private openId = 0;

  displayedColumns = ['id', 'code', 'category', 'description', 'date', 'amount', 'updated_at', 'updated_by_name', 'action'];
  categories: Category[] = [];
  categorySearch = new SelectSearch<Category>((c, q) => c.category_name.toLowerCase().includes(q), this.destroyRef);
  dataSource = new MatTableDataSource<ExpenseItem>([]);

  readonly pageSize = 10;
  pageIndex = 0;
  total = 0;
  totalAmount = 0;

  editingId: number | null = null;
  saving = false;
  /** phones only: the entry form stays folded until asked for (or until a row is being edited) */
  formOpen = false;

  filterForm = this.fb.group({
    keyword: [''],
    date: [null as Date | null],
  });

  form = this.fb.nonNullable.group({
    category_id: [0, [Validators.required, Validators.min(1)]],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    expense_date: [new Date(), Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
  });

  /** phones only: the search fields stay folded; this line says what the list is filtered by */
  filterOpen = false;
  filterText = '';

  private describeFilter(): string {
    const v = this.filterForm.getRawValue();
    return filterSummary([datePart(v.date) ?? 'ทุกวัน', keywordPart(v.keyword)]);
  }

  ngOnInit(): void {
    this.api.getCategories('expense').subscribe((c) => {
      this.categories = c;
      this.categorySearch.setSource(c);
    });

    this.reload$.pipe(
      tap(() => (this.filterText = this.describeFilter())),
      switchMap(() => this.api.searchExpenses({
        keyword: this.filterForm.controls.keyword.value ?? '',
        date: this.filterForm.controls.date.value ? toYmd(this.filterForm.controls.date.value) : null,
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
      }).pipe(catchError(() => of({ items: [], total: 0, total_amount: 0, page: 1, pageSize: this.pageSize })))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.dataSource.data = result.items;
      this.total = result.total;
      this.totalAmount = result.total_amount;
      if (this.revealHistory) {
        this.revealHistory = false;
        ScrollToEditForm('.expense-history-card', 'start');
      }
      if (this.openId) {
        const row = result.items.find((i) => i.expense_id === this.openId);
        this.openId = 0;
        if (row) this.openRow(row);
      }
    });

    // Arrived from the calendar (?date=YYYY-MM-DD): show that day.
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? '')) {
      const [y, m, d] = dateParam!.split('-').map(Number);
      this.filterForm.controls.date.setValue(new Date(y, m - 1, d));
      this.revealHistory = true;
      this.openId = Number(this.route.snapshot.queryParamMap.get('openExpense'));
    }

    this.reload$.next();
  }

  search(): void {
    this.pageIndex = 0;
    this.reload$.next();
  }

  clearFilter(): void {
    this.filterForm.reset({ keyword: '', date: null });
    this.search();
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.reload$.next();
  }

  edit(item: ExpenseItem): void {
    this.editingId = item.expense_id;
    this.form.setValue({
      category_id: item.category_id,
      description: item.description,
      expense_date: new Date(item.expense_date),
      amount: item.amount,
    });
    this.formOpen = true;
    ScrollToEditForm('.expense-entry-card');
  }

  reset(): void {
    if (this.editingId !== null) this.formOpen = false; // leaving edit mode folds the form again
    this.editingId = null;
    this.form.reset({ category_id: 0, description: '', expense_date: new Date(), amount: 0 });
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      category_id: v.category_id,
      description: v.description,
      amount: v.amount,
      expense_date: toYmd(v.expense_date),
    };
    const request$ = this.editingId
      ? this.api.updateExpense({ expense_id: this.editingId, ...payload })
      : this.api.createExpense(payload);

    this.saving = true;
    request$.subscribe({
      next: () => {
        this.saving = false;
        DialogSuccess();
        this.reset();
        this.formOpen = false;
        this.reload$.next();
      },
      error: (err) => {
        this.saving = false;
        DialogErrorHtmlConfirm(err?.error?.message ?? 'บันทึกไม่สำเร็จ');
      },
    });
  }

  categoryName(item: ExpenseItem): string {
    return item.category_name ?? this.categories.find((c) => c.category_id === item.category_id)?.category_name ?? '-';
  }

  openRow(item: ExpenseItem): void {
    openDrawer<RowDrawer, RowDrawerData>(this.dialog, RowDrawer, {
      title: 'ค่าใช้จ่าย',
      subtitle: item.code,
      icon: 'receipt_long',
      highlight: { label: 'จำนวนเงิน', value: money(item.amount) },
      fields: [
        { label: 'หมวด', value: this.categoryName(item) },
        { label: 'รายละเอียด', value: item.description },
        { label: 'วันที่', value: dateText(item.expense_date) },
        { label: 'แก้ไขล่าสุด', value: dateText(item.updated_at, 'dd/MM/yyyy HH:mm', 'UTC'), meta: true },
        { label: 'แก้ไขโดย', value: item.updated_by_name, meta: true },
      ],
      actions: [{ label: 'แก้ไข', icon: 'edit', kind: 'primary', run: () => this.edit(item) }],
    });
  }
}
