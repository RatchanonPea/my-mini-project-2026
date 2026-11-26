import { TodayButton } from '../../../shared/calendar-today/calendar-today';
import { ThousandsInput } from '../../../shared/number-format/thousands.directive';
import { NoData } from '../../../shared/no-data/no-data';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
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
import { AppDateModule } from '../../../shared/app-date/app-date';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiService, PagedResult, PurchaseOrder, PurchasePayment, PurchaseStatus, Supplier, SupplyContract } from '../../../services/api';
import { ConfirmDialog, DialogErrorHtmlConfirm, DialogSuccess, toYmd, ScrollToEditForm } from '../../../common/helper';
import { buildPurchaseOrderDoc } from '../../../common/print-docs';
import { PrintService } from '../../../services/print';
import { Pager } from '../../../shared/pager/pager';
import { StockDetailDialog } from '../inventory/stock-detail-dialog/stock-detail-dialog';
import { ClearButton } from '../../../shared/clear-button/clear-button';
import { CharCount } from '../../../shared/char-count/char-count';
import { RowAction, openDrawer } from '../../../shared/row-drawer/row-drawer';

/** Chickens are counted in whole chickens, in steps of 0.5. */
export function halfStep(control: AbstractControl): ValidationErrors | null {
  const value = Number(control.value);
  return Number.isFinite(value) && Math.abs(value * 2 - Math.round(value * 2)) < 1e-9 ? null : { halfStep: true };
}

const CUSTOM_PRICE = 'custom';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CharCount, ClearButton, ThousandsInput, TodayButton, NoData, CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTableModule, MatSelectModule, MatDatepickerModule, AppDateModule, MatDialogModule, Pager, NgxMatSelectSearchModule],
  templateUrl: './purchases.html',
  styleUrls: ['./purchases.scss'],
})
export class Purchases implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private printer = inject(PrintService);
  private reload$ = new Subject<void>();

  readonly customPrice = CUSTOM_PRICE;
  readonly statusLabel: Record<string, string> = { ordered: 'สั่งแล้ว', received: 'รับแล้ว', cancelled: 'ยกเลิก' };
  displayedColumns = ['code', 'order_date', 'supplier', 'quantity', 'unit_cost', 'total', 'status', 'received_date', 'due', 'updated_at', 'updated_by_name', 'action'];
  dataSource = new MatTableDataSource<PurchaseOrder>([]);
  prices: number[] = [];
  standardCost = 150;
  suppliers: Supplier[] = [];

  readonly pageSize = 10;
  pageIndex = 0;
  total = 0;
  totalQuantity = 0;
  totalAmount = 0;
  /** received orders not yet paid (whole list, not just this page) and how many are past their due date */
  unpaidCount = 0;
  unpaidAmount = 0;
  overdueCount = 0;
  /** the chosen supplier's agreement in force: its price and credit are the defaults of a new order */
  activeContract: SupplyContract | null = null;

  editingId: number | null = null;
  saving = false;

  filterForm = this.fb.group({
    keyword: [''],
    date: [null as Date | null],
    status: ['' as PurchaseStatus | ''],
    payment: ['' as PurchasePayment | ''],
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
      if (!this.editingId && this.activeContract?.unit_price == null) {
        this.form.controls.price_choice.setValue(p.standard_cost);
      }
    });

    this.form.controls.supplier_id.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => this.loadContract(id));

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
        payment: this.filterForm.controls.payment.value ?? '',
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
      }).pipe(catchError(() => of<PagedResult<PurchaseOrder>>({ items: [], total: 0, total_quantity: 0, total_amount: 0, page: 1, pageSize: this.pageSize })))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.dataSource.data = result.items;
      this.total = result.total;
      this.totalQuantity = result.total_quantity ?? 0;
      this.totalAmount = result.total_amount;
      this.unpaidCount = result.unpaid_count ?? 0;
      this.unpaidAmount = result.unpaid_amount ?? 0;
      this.overdueCount = result.overdue_count ?? 0;
    });

    this.reload$.next();

    // Arrived from a notification about one specific purchase order — open its detail straight
    // away instead of leaving the visitor to hunt for it in the (possibly filtered) list.
    const poId = Number(this.route.snapshot.queryParamMap.get('openPo'));
    if (poId) {
      this.api.getPurchaseOrder(poId).subscribe((po) => this.openDetail(po));
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  /** looks up the supplier's active agreement; a new order starts at its price (an edited order keeps its own) */
  private loadContract(supplierId: number | null): void {
    this.activeContract = null;
    if (!supplierId) return;
    this.api.getSupplierContracts(supplierId).subscribe({
      next: (list) => {
        if (this.form.controls.supplier_id.value !== supplierId) return; // the user moved on to another supplier
        this.activeContract = list.find((c) => c.status === 'active') ?? null;
        const price = this.activeContract?.unit_price;
        if (this.editingId || price === null || price === undefined) return;
        const agreed = Number(price);
        if (this.prices.includes(agreed)) {
          this.form.controls.price_choice.setValue(agreed);
        } else {
          this.form.controls.price_choice.setValue(CUSTOM_PRICE);
          this.form.controls.custom_cost.setValue(agreed);
        }
      },
      error: () => (this.activeContract = null),
    });
  }

  async pay(item: PurchaseOrder): Promise<void> {
    const total = Number(item.total_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (!(await ConfirmDialog('ยืนยันการจ่ายเงิน', `${item.code}: จ่ายให้ ${item.supplier_name ?? 'ผู้ขาย'} THB ${total} (วันนี้)`))) return;
    this.api.payPurchase(item.po_id, toYmd(new Date())).subscribe({
      next: () => { DialogSuccess('บันทึกการจ่ายเงินเรียบร้อยแล้ว'); this.reload$.next(); },
      error: (err) => DialogErrorHtmlConfirm(err?.error?.message ?? 'บันทึกการจ่ายเงินไม่สำเร็จ'),
    });
  }

  openDetail(po: PurchaseOrder): void {
    // same choices as the buttons in the table row
    const actions: RowAction[] = [{ label: 'พิมพ์', icon: 'print', run: () => this.printOrder(po) }];
    if (po.status === 'received' && !po.paid_date) {
      actions.push({ label: 'จ่ายเงินแล้ว', icon: 'payments', kind: 'primary', run: () => void this.pay(po) });
    }
    if (po.status === 'ordered') {
      actions.push(
        { label: 'ยกเลิกใบสั่ง', icon: 'cancel', kind: 'warn', run: () => void this.cancel(po) },
        { label: 'แก้ไข', icon: 'edit', run: () => this.edit(po) },
        { label: 'รับไก่เข้าสต็อก', icon: 'inventory', kind: 'primary', run: () => void this.receive(po) },
      );
    }
    openDrawer(this.dialog, StockDetailDialog, { kind: 'purchase', po, actions });
  }

  search(): void {
    this.pageIndex = 0;
    this.reload$.next();
  }

  clearFilter(): void {
    this.filterForm.reset({ keyword: '', date: null, status: '', payment: '' });
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
    ScrollToEditForm('.purchase-entry-card');
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
    if (!(await ConfirmDialog('ยืนยันการรับไก่เข้าสต็อก', this.receiveDetailHtml(item)))) {
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

  /** Detail table shown in the "receive stock" confirmation. User-entered text is escaped: the dialog renders HTML. */
  private receiveDetailHtml(item: PurchaseOrder): string {
    const esc = (value: unknown) =>
      String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    const date = (value?: string | null) => (value ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Bangkok' }) : '-');
    const baht = (value: number) => `THB ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const total = item.total_cost ?? Number(item.quantity) * Number(item.unit_cost);

    const rows: [string, string][] = [
      ['รหัสใบสั่งซื้อ', esc(item.code)],
      ['วันที่สั่ง', date(item.order_date)],
      ['ผู้ขาย', esc(item.supplier_name || '-')],
      ['จำนวน', `${esc(item.quantity)} ตัว`],
      ['ราคา/ตัว', baht(item.unit_cost)],
      ['วันที่รับเข้าสต็อก', `${date(new Date().toISOString())} (วันนี้)`],
    ];
    if (item.note) rows.push(['หมายเหตุ', esc(item.note)]);

    const line = (label: string, value: string, strong = false) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${label}</td>` +
      `<td style="padding:4px 0;font-weight:${strong ? 700 : 600};${strong ? 'font-size:1.1em;color:#c2410c;' : ''}">${value}</td></tr>`;

    return `<table style="border-collapse:collapse;width:100%">` +
      rows.map(([label, value]) => line(label, value)).join('') +
      `<tr><td colspan="2" style="padding-top:6px"><hr style="margin:0;border:0;border-top:1px dashed #d1d5db"></td></tr>` +
      line('ยอดรวม', baht(total), true) +
      `</table>`;
  }

  printOrder(item: PurchaseOrder): void {
    this.printer.print(buildPurchaseOrderDoc(item)).catch(() => DialogErrorHtmlConfirm('เปิดหน้าพิมพ์ไม่สำเร็จ'));
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
