import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReplaySubject, Subject, catchError, of, switchMap } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Pager } from '../../../shared/pager/pager';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiService, ProductItem, SaleItem } from '../../../services/api';
import { ConfirmDelete, DialogErrorHtmlConfirm, DialogSuccess, toYmd } from '../../../common/helper';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatTableModule, Pager, MatDatepickerModule, MatNativeDateModule, NgxMatSelectSearchModule],
  templateUrl: './sales.html',
  styleUrls: ['./sales.scss']
})
export class Sales implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private reload$ = new Subject<void>();

  displayedColumns = ['id', 'code', 'date', 'product', 'quantity', 'price', 'total', 'updated_at', 'updated_by_name', 'action'];
  products: ProductItem[] = [];
  dataSource = new MatTableDataSource<SaleItem>([]);

  readonly pageSize = 10;
  pageIndex = 0;
  total = 0;
  totalQuantity = 0;
  totalAmount = 0;

  private formDateItems: SaleItem[] = [];
  editingId: number | null = null;
  saving = false;

  filterForm = this.fb.group({
    keyword: [''],
    date: [new Date() as Date | null],
  });

  form = this.fb.nonNullable.group({
    product_id: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
  });

  get isEditing(): boolean {
    return this.editingId !== null;
  }

  get availableProducts(): ProductItem[] {
    const current = this.formDateItems.find((i) => i.item_id === this.editingId);
    const soldIds = new Set(this.formDateItems.map((i) => i.product_id));
    return this.products.filter((p) => !soldIds.has(p.product_id) || p.product_id === current?.product_id);
  }

  get selectedProduct(): ProductItem | undefined {
    return this.products.find((p) => p.product_id === this.form.controls.product_id.value);
  }

  // Search box inside the product dropdown — filters availableProducts by name as you type.
  productFilterCtrl = new FormControl('');
  filteredProducts$ = new ReplaySubject<ProductItem[]>(1);

  private filterProducts(): void {
    const search = (this.productFilterCtrl.value ?? '').trim().toLowerCase();
    const list = search
      ? this.availableProducts.filter((p) => p.product_name.toLowerCase().includes(search))
      : this.availableProducts;
    this.filteredProducts$.next(list);
  }

  ngOnInit(): void {
    this.productFilterCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.filterProducts());

    this.api.getProducts().subscribe((items) => {
      this.products = items.filter((p) => p.is_active);
      this.filterProducts();
    });

    this.reload$.pipe(
      switchMap(() => this.api.searchSales({
        keyword: this.filterForm.controls.keyword.value ?? '',
        date: this.filterForm.controls.date.value ? toYmd(this.filterForm.controls.date.value) : null,
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
      }).pipe(catchError(() => of({ items: [], total: 0, total_quantity: 0, total_amount: 0, page: 1, pageSize: this.pageSize })))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.dataSource.data = result.items;
      this.total = result.total;
      this.totalQuantity = result.total_quantity ?? 0;
      this.totalAmount = result.total_amount;
    });

    this.reload$.next();
    this.loadFormDateItems(toYmd(new Date()));
  }

  private loadFormDateItems(date: string): void {
    this.api.getSales(date).subscribe((items) => {
      this.formDateItems = items;
      this.filterProducts();
    });
  }

  search(): void {
    this.pageIndex = 0;
    this.reload$.next();
  }

  clearFilter(): void {
    this.filterForm.reset({ keyword: '', date: new Date() });
    this.search();
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.reload$.next();
  }

  editSale(item: SaleItem): void {
    this.editingId = item.item_id;
    this.loadFormDateItems(item.sale_date.slice(0, 10));
    this.form.setValue({ product_id: item.product_id, quantity: item.quantity });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  saveSale(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const { product_id, quantity } = this.form.getRawValue();
    const editing = this.editingId;
    const request$ = editing
      ? this.api.updateSaleItem({ item_id: editing, product_id, quantity })
      : this.api.createSaleItem({ sale_date: toYmd(new Date()), product_id, quantity });

    this.saving = true;
    request$.subscribe({
      next: () => {
        this.saving = false;
        DialogSuccess(editing ? 'อัปเดตยอดขายเรียบร้อยแล้ว' : 'บันทึกยอดขายเรียบร้อยแล้ว', editing ? 'อัปเดตสำเร็จ' : 'บันทึกสำเร็จ');
        this.resetForm();
        this.reload$.next();
      },
      error: (err) => {
        this.saving = false;
        DialogErrorHtmlConfirm(err?.error?.message ?? 'บันทึกไม่สำเร็จ');
      },
    });
  }

  async removeSale(id: number): Promise<void> {
    if (!(await ConfirmDelete())) {
      return;
    }
    this.api.deleteSaleItem(id).subscribe({
      next: () => {
        if (this.editingId === id) {
          this.resetForm();
        } else if (this.editingId === null) {
          this.loadFormDateItems(toYmd(new Date()));
        }
        this.reload$.next();
      },
      error: (err) => DialogErrorHtmlConfirm(err?.error?.message ?? 'ลบไม่สำเร็จ'),
    });
  }

  private resetForm(): void {
    this.editingId = null;
    this.loadFormDateItems(toYmd(new Date()));
    this.form.reset({ product_id: 0, quantity: 1 });
  }
}
