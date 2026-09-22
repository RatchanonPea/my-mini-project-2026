import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Pager } from '../../../shared/pager/pager';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiService, Category, ExpenseItem } from '../../../services/api';
import { DialogErrorHtmlConfirm, DialogSuccess, toYmd } from '../../../common/helper';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTableModule, Pager, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './expenses.html',
  styleUrls: ['./expenses.scss']
})
export class Expenses implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private reload$ = new Subject<void>();

  displayedColumns = ['id', 'code', 'category', 'description', 'date', 'amount', 'updated_at', 'updated_by_name', 'action'];
  categories: Category[] = [];
  dataSource = new MatTableDataSource<ExpenseItem>([]);

  readonly pageSize = 10;
  pageIndex = 0;
  total = 0;
  totalAmount = 0;

  editingId: number | null = null;
  saving = false;

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

  ngOnInit(): void {
    this.api.getCategories('expense').subscribe((c) => (this.categories = c));

    this.reload$.pipe(
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
    });

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
  }

  reset(): void {
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
}
