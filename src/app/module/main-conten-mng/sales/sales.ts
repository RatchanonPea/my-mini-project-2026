import { TodayButton } from '../../../shared/calendar-today/calendar-today';
import { ThousandsInput } from '../../../shared/number-format/thousands.directive';
import { NoData } from '../../../shared/no-data/no-data';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReplaySubject, Subject, catchError, firstValueFrom, of, switchMap, tap } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AppDateModule } from '../../../shared/app-date/app-date';
import { Pager } from '../../../shared/pager/pager';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiService, ProductItem, SaleItem } from '../../../services/api';
import { ConfirmDelete, DialogErrorHtmlConfirm, DialogSuccess, toYmd, ScrollToEditForm } from '../../../common/helper';
import { buildSalesDoc } from '../../../common/print-docs';
import { PrintService } from '../../../services/print';
import { ClearButton } from '../../../shared/clear-button/clear-button';
import { RowDrawer, RowDrawerData, dateText, money, openDrawer } from '../../../shared/row-drawer/row-drawer';
import { MatDialog } from '@angular/material/dialog';
import { FilterFold, filterSummary, datePart, keywordPart } from '../../../shared/filter-fold/filter-fold';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [FilterFold, ClearButton, ThousandsInput, TodayButton, NoData, CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatTableModule, Pager, MatDatepickerModule, AppDateModule, NgxMatSelectSearchModule],
  templateUrl: './sales.html',
  styleUrls: ['./sales.scss']
})
export class Sales implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private printer = inject(PrintService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private reload$ = new Subject<void>();
  private revealHistory = false;

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
  /** phones only: the entry form stays folded until asked for (or until a row is being edited) */
  formOpen = false;
  printing = false;

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

  /** phones only: the search fields stay folded; this line says what the list is filtered by */
  filterOpen = false;
  filterText = '';

  private describeFilter(): string {
    const v = this.filterForm.getRawValue();
    return filterSummary([datePart(v.date) ?? 'ทุกวัน', keywordPart(v.keyword)]);
  }

  ngOnInit(): void {
    this.productFilterCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.filterProducts());

    this.api.getProducts().subscribe((items) => {
      this.products = items.filter((p) => p.is_active);
      this.filterProducts();
    });

    this.reload$.pipe(
      tap(() => (this.filterText = this.describeFilter())),
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
      if (this.revealHistory) {
        this.revealHistory = false;
        ScrollToEditForm('.history-card', 'start');
      }
    });

    // Arrived from the calendar (?date=YYYY-MM-DD): show that day.
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? '')) {
      const [y, m, d] = dateParam!.split('-').map(Number);
      this.filterForm.controls.date.setValue(new Date(y, m - 1, d));
      this.revealHistory = true;
    }

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

  /** Empty date = no date filter: the table lists every day (the filter starts on today). */
  showAllDays(): void {
    this.filterForm.controls.date.setValue(null);
    this.search();
  }

  clearFilter(): void {
    this.filterForm.reset({ keyword: '', date: new Date() });
    this.search();
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.reload$.next();
  }

  /**
   * Prints what the history table is filtered to (date and search text, or every day when the date is
   * empty), all of it - not just the page on screen. The server caps a page at 100 rows, so it pages through.
   */
  async printSales(): Promise<void> {
    if (this.printing) return;
    this.printing = true;
    const keyword = (this.filterForm.controls.keyword.value ?? '').trim();
    const picked = this.filterForm.controls.date.value;
    const date = picked ? toYmd(picked) : null;
    const MAX_ROWS = 5000;

    try {
      const items: SaleItem[] = [];
      for (let page = 1; ; page++) {
        const result = await firstValueFrom(this.api.searchSales({ keyword, date, page, pageSize: 100 }));
        items.push(...result.items);
        if (!result.items.length || items.length >= result.total || items.length >= MAX_ROWS) break;
      }
      await this.printer.print(buildSalesDoc({ date, keyword, items: items.slice(0, MAX_ROWS), truncated: items.length > MAX_ROWS }));
    } catch {
      DialogErrorHtmlConfirm('เตรียมข้อมูลสำหรับพิมพ์ไม่สำเร็จ');
    } finally {
      this.printing = false;
    }
  }

  editSale(item: SaleItem): void {
    this.editingId = item.item_id;
    this.loadFormDateItems(item.sale_date.slice(0, 10));
    this.form.setValue({ product_id: item.product_id, quantity: item.quantity });
    this.formOpen = true;
    ScrollToEditForm('.sales-card');
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
        this.formOpen = false;
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
    if (this.editingId !== null) this.formOpen = false; // leaving edit mode folds the form again
    this.editingId = null;
    this.loadFormDateItems(toYmd(new Date()));
    this.form.reset({ product_id: 0, quantity: 1 });
  }

  openRow(item: SaleItem): void {
    openDrawer<RowDrawer, RowDrawerData>(this.dialog, RowDrawer, {
      title: 'รายการขาย',
      subtitle: item.code,
      icon: 'point_of_sale',
      highlight: { label: 'ยอดรวม', value: money(item.total_price) },
      fields: [
        { label: 'สินค้า', value: item.product_name },
        { label: 'จำนวน', value: item.quantity },
        { label: 'ราคา/ชิ้น', value: money(item.unit_price) },
        { label: 'วันที่ขาย', value: dateText(item.sale_date) },
        { label: 'แก้ไขล่าสุด', value: dateText(item.updated_at, 'dd/MM/yyyy HH:mm', 'UTC'), meta: true },
        { label: 'แก้ไขโดย', value: item.updated_by_name, meta: true },
      ],
      actions: [
        { label: 'ลบ', icon: 'delete', kind: 'warn', run: () => void this.removeSale(item.item_id) },
        { label: 'แก้ไข', icon: 'edit', kind: 'primary', run: () => this.editSale(item) },
      ],
    });
  }
}
