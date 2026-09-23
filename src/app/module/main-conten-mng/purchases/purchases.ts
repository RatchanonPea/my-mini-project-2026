import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ReplaySubject, Subject, catchError, of, switchMap } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiService, PurchaseOrder, PurchaseStatus, Supplier } from '../../../services/api';
import { ConfirmDialog, DialogErrorHtmlConfirm, DialogSuccess, toYmd } from '../../../common/helper';
import { Pager } from '../../../shared/pager/pager';
import { StockDetailDialog } from '../inventory/stock-detail-dialog/stock-detail-dialog';

/** Chickens are counted in whole chickens, in steps of 0.5. */
export function halfStep(control: AbstractControl): ValidationErrors | null {
  const value = Number(control.value);
  return Number.isFinite(value) && Math.abs(value * 2 - Math.round(value * 2)) < 1e-9 ? null : { halfStep: true };
}

const CUSTOM_PRICE = 'custom';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTableModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatDialogModule, Pager, NgxMatSelectSearchModule],
  templateUrl: './purchases.html',
  styleUrls: ['./purchases.scss'],
})
export class Purchases implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private reload$ = new Subject<void>();

  readonly customPrice = CUSTOM_PRICE;
  readonly statusLabel: Record<string, string> = { ordered: 'สั่งแล้ว', received: 'รับแล้ว', cancelled: 'ยกเลิก' };
  displayedColumns = ['code', 'order_date', 'supplier', 'quantity', 'unit_cost', 'total', 'status', 'received_date', 'updated_at', 'updated_by_name', 'action'];
  dataSource = new MatTableDataSource<PurchaseOrder>([]);
  prices: number[] = [];
  standardCost = 150;
  suppliers: Supplier[] = [];

  readonly pageSize = 10;
  pageIndex = 0;
  total = 0;
  totalQuantity = 0;
  totalAmount = 0;

  editingId: number | null = null;
  saving = false;

  filterForm = this.fb.group({
    keyword: [''],
    date: [null as Date | null],
    status: ['' as PurchaseStatus | ''],
  });

  form = this.fb.nonNullable.group({
    order_date: [new Date(), Validators.required],
    supplier_id: [null as number | null, Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.5), halfStep]],
    price_choice: [150 as number | typeof CUSTOM_PRICE, Validators.required],
    custom_cost: [null as number | null],
    note: [''],
  });

  /** cost per chicken actually chosen: one of the offered prices, or the typed one */
  get unitCost(): number | null {
    const v = this.form.getRawValue();
    if (v.price_choice === CUSTOM_PRICE) {
      return v.custom_cost === null || v.custom_cost === undefined ? null : Number(v.custom_cost);
    }
    return Number(v.price_choice);
  }

  get orderTotal(): number {
    const cost = this.unitCost;
    return cost === null ? 0 : Number(this.form.controls.quantity.value) * cost;
  }

  get isCustom(): boolean {
    return this.form.controls.price_choice.value === CUSTOM_PRICE;
  }

  // Search box inside the supplier dropdown — filters suppliers by name as you type.
  supplierFilterCtrl = new FormControl('');
  filteredSuppliers$ = new ReplaySubject<Supplier[]>(1);

  private filterSuppliers(): void {
    const search = (this.supplierFilterCtrl.value ?? '').trim().toLowerCase();
    const list = search
      ? this.suppliers.filter((s) => s.name.toLowerCase().includes(search))
      : this.suppliers;
    this.filteredSuppliers$.next(list);
  }

  ngOnInit(): void {
    this.supplierFilterCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.filterSuppliers());

    this.api.getSuppliers(true).subscribe((s) => {
      this.suppliers = s;
      this.filterSuppliers();
      if (s.length === 1 && !this.editingId) {
        this.form.controls.supplier_id.setValue(s[0].supplier_id);
      }
    });

    this.api.getPurchasePrices().subscribe((p) => {
      this.prices = p.prices;
      this.standardCost = p.standard_cost;
      if (!this.editingId) {
        this.form.controls.price_choice.setValue(p.standard_cost);
      }
    });

    this.form.controls.price_choice.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((choice) => {
      const custom = this.form.controls.custom_cost;
      if (choice === CUSTOM_PRICE) {
        custom.setValidators([Validators.required, Validators.min(0)]);
      } else {
        custom.clearValidators();
        custom.setValue(null);
      }
      custom.updateValueAndValidity();
    });

    this.reload$.pipe(
      switchMap(() => this.api.searchPurchases({
        keyword: this.filterForm.controls.keyword.value ?? '',
        date: this.filterForm.controls.date.value ? toYmd(this.filterForm.controls.date.value) : null,
        status: this.filterForm.controls.status.value ?? '',
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
  }

  openDetail(po: PurchaseOrder): void {
    this.dialog.open(StockDetailDialog, { width: '520px', maxWidth: '95vw', data: { kind: 'purchase', po } });
  }

  search(): void {
    this.pageIndex = 0;
    this.reload$.next();
  }

  clearFilter(): void {
    this.filterForm.reset({ keyword: '', date: null, status: '' });
    this.search();
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.reload$.next();
  }

  edit(item: PurchaseOrder): void {
    this.editingId = item.po_id;
    const known = this.prices.includes(Number(item.unit_cost));
    this.form.setValue({
      order_date: new Date(item.order_date),
      supplier_id: item.supplier_id,
      quantity: Number(item.quantity),
      price_choice: known ? Number(item.unit_cost) : CUSTOM_PRICE,
      custom_cost: known ? null : Number(item.unit_cost),
      note: item.note ?? '',
    });
  }

  reset(): void {
    this.editingId = null;
    this.form.reset({
      order_date: new Date(),
      supplier_id: this.suppliers.length === 1 ? this.suppliers[0].supplier_id : null,
      quantity: 1,
      price_choice: this.standardCost,
      custom_cost: null,
      note: '',
    });
  }

  save(): void {
    if (this.form.invalid || this.saving || this.unitCost === null) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      order_date: toYmd(v.order_date),
      supplier_id: v.supplier_id,
      quantity: Number(v.quantity),
      unit_cost: this.unitCost,
      note: v.note.trim() || null,
    };
    const editing = this.editingId;
    const request$ = editing ? this.api.updatePurchase({ po_id: editing, ...payload }) : this.api.createPurchase(payload);

    this.saving = true;
    request$.subscribe({
      next: () => {
        this.saving = false;
        DialogSuccess(editing ? 'แก้ไขใบสั่งซื้อเรียบร้อยแล้ว' : 'สร้างใบสั่งซื้อเรียบร้อยแล้ว');
        this.reset();
        this.reload$.next();
        this.refreshPrices();
      },
      error: (err) => {
        this.saving = false;
        DialogErrorHtmlConfirm(err?.error?.message ?? 'บันทึกไม่สำเร็จ');
      },
    });
  }

  async receive(item: PurchaseOrder): Promise<void> {
    if (!(await ConfirmDialog('ยืนยันการรับไก่เข้าสต็อก', `${item.code}: ${item.quantity} ตัว ตัวละ ${item.unit_cost} บาท`))) {
      return;
    }
    this.api.receivePurchase(item.po_id, toYmd(new Date())).subscribe({
      next: () => {
        DialogSuccess('รับไก่เข้าสต็อกเรียบร้อยแล้ว');
        this.reload$.next();
      },
      error: (err) => DialogErrorHtmlConfirm(err?.error?.message ?? 'รับของไม่สำเร็จ'),
    });
  }

  async cancel(item: PurchaseOrder): Promise<void> {
    if (!(await ConfirmDialog('ยืนยันการยกเลิกใบสั่งซื้อ', `${item.code}: ${item.quantity} ตัว`))) {
      return;
    }
    this.api.cancelPurchase(item.po_id).subscribe({
      next: () => {
        if (this.editingId === item.po_id) {
          this.reset();
        }
        this.reload$.next();
      },
      error: (err) => DialogErrorHtmlConfirm(err?.error?.message ?? 'ยกเลิกไม่สำเร็จ'),
    });
  }

  private refreshPrices(): void {
    this.api.getPurchasePrices().subscribe((p) => (this.prices = p.prices));
  }
}
