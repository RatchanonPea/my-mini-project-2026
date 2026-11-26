import { SupplierContractFields, contractControls } from '../contract-fields/contract-fields';
import { NoData } from '../../../../shared/no-data/no-data';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ApiService, SupplierOrderHistory, SupplierProfile as SupplierProfileData, SupplyContract } from '../../../../services/api';
import { AuthService } from '../../../../services/auth';
import { ConfirmDialog, DialogErrorHtmlConfirm, DialogSuccess } from '../../../../common/helper';
import { SupplyAgreementService } from '../supply-agreement';
import { ContractDetailDialog } from './contract-detail-dialog';
import { StockDetailDialog } from '../../inventory/stock-detail-dialog/stock-detail-dialog';
import { Pager } from '../../../../shared/pager/pager';
import { LatLng, LocationPicker } from '../../../../shared/location-picker/location-picker';
import { ClearButton } from '../../../../shared/clear-button/clear-button';
import { CharCount } from '../../../../shared/char-count/char-count';
import { openDrawer } from '../../../../shared/row-drawer/row-drawer';

@Component({
  selector: 'app-supplier-profile',
  standalone: true,
  imports: [CharCount, ClearButton, SupplierContractFields, NoData, CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatTableModule, Pager, LocationPicker],
  templateUrl: './supplier-profile.html',
  styleUrls: ['./supplier-profile.scss'],
})
export class SupplierProfile implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private agreements = inject(SupplyAgreementService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  readonly statusLabel: Record<string, string> = { ordered: 'สั่งแล้ว', received: 'รับแล้ว', cancelled: 'ยกเลิก' };
  displayedColumns = ['code', 'order_date', 'quantity', 'unit_cost', 'total_cost', 'status', 'received_date'];

  /** agreements printed for this supplier, newest first; the 'active' one sets the default price / credit of new orders */
  contracts: SupplyContract[] = [];
  filteredContracts: SupplyContract[] = [];
  readonly contractSearch = new FormControl('', { nonNullable: true });
  readonly orderSearch = new FormControl('', { nonNullable: true });
  readonly contractColumns = ['code', 'created_at', 'quantity', 'unit_price', 'credit_days', 'status', 'action'];
  readonly canEndContract = this.auth.isManager();
  readonly canSeePrivate = this.auth.isManager();

  supplierId = 0;
  profile: SupplierProfileData | null = null;
  orders: SupplierOrderHistory[] = [];
  filteredOrders: SupplierOrderHistory[] = [];
  pagedOrders: SupplierOrderHistory[] = [];
  loading = false;
  saving = false;

  readonly pageSize = 10;
  pageIndex = 0;

  lat: number | null = null;
  lng: number | null = null;

  // phone is only required up front when a supplier is first created (see suppliers.ts) — once a
  // supplier already exists, editing its other fields (name, address, note, map pin) shouldn't be
  // blocked just because phone hasn't been filled in yet.
  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
    address: [''],
    note: [''],
    is_active: [true],
    ...contractControls(),
  });

  ngOnInit(): void {
    this.supplierId = Number(this.route.snapshot.paramMap.get('id'));
    this.orderSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.pageIndex = 0; this.applyOrderFilter(); });
    this.contractSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyContractFilter());
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadContracts();
    this.api.getSupplierProfile(this.supplierId).subscribe({
      next: (data) => {
        this.profile = data;
        this.orders = data.orders;
        this.pageIndex = 0;
        this.applyOrderFilter();
        this.lat = data.supplier.latitude;
        this.lng = data.supplier.longitude;
        this.form.setValue({
          name: data.supplier.name,
          phone: data.supplier.phone ?? '',
          address: data.supplier.address ?? '',
          note: data.supplier.note ?? '',
          is_active: data.supplier.is_active,
          entity_type: data.supplier.entity_type ?? 'individual',
          legal_name: data.supplier.legal_name ?? '',
          contact_position: data.supplier.contact_position ?? '',
          tax_id: data.supplier.tax_id ?? '',
          contact_name: data.supplier.contact_name ?? '',
          bank_name: data.supplier.bank_name ?? '',
          bank_account_no: data.supplier.bank_account_no ?? '',
          bank_account_name: data.supplier.bank_account_name ?? '',
          credit_days: data.supplier.credit_days ?? null,
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private loadContracts(): void {
    this.api.getSupplierContracts(this.supplierId).subscribe({ next: (list) => { this.contracts = list; this.applyContractFilter(); }, error: () => { this.contracts = []; this.applyContractFilter(); } });
  }

  reprintContract(contract: SupplyContract): void {
    void this.agreements.reprint(contract);
  }

  async endContract(contract: SupplyContract): Promise<void> {
    if (!(await ConfirmDialog('สิ้นสุดข้อตกลง', `${contract.code}: ใบสั่งซื้อใหม่จะไม่ใช้ราคาและเครดิตของข้อตกลงนี้อีก (ใบเก่ายังเหมือนเดิม)`))) return;
    this.api.endSupplyContract(contract.contract_id).subscribe({
      next: () => { DialogSuccess('สิ้นสุดข้อตกลงเรียบร้อยแล้ว'); this.loadContracts(); },
      error: (err) => DialogErrorHtmlConfirm(err?.error?.message ?? 'สิ้นสุดข้อตกลงไม่สำเร็จ'),
    });
  }

  back(): void {
    this.router.navigate(['/main-conten-mng/suppliers']);
  }

  private updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedOrders = this.filteredOrders.slice(start, start + this.pageSize);
  }

  /** dd/MM/yyyy of a date-only ISO string, so a search for what the table shows finds it */
  private ymd(iso: string | null | undefined): string {
    const d = String(iso ?? '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '';
  }

  private matches(keyword: string, parts: unknown[]): boolean {
    const q = keyword.trim().toLowerCase();
    return !q || parts.some((p) => String(p ?? '').toLowerCase().includes(q));
  }

  private applyOrderFilter(): void {
    const q = this.orderSearch.value;
    this.filteredOrders = this.orders.filter((o) => this.matches(q, [o.code, this.statusLabel[o.status], this.ymd(o.order_date), this.ymd(o.received_date), o.quantity, o.unit_cost, o.total_cost]));
    this.updatePage();
  }

  private applyContractFilter(): void {
    const q = this.contractSearch.value;
    this.filteredContracts = this.contracts.filter((c) => this.matches(q, [
      c.code, this.ymd(c.created_at), c.quantity, c.per === 'month' ? 'เดือน' : 'ปี', c.unit_price,
      c.credit_days === 0 ? 'จ่ายสด' : c.credit_days, c.status === 'active' ? 'ใช้อยู่' : 'สิ้นสุดแล้ว',
    ]));
  }

  openOrder(order: SupplierOrderHistory): void {
    this.api.getPurchaseOrder(order.po_id).subscribe((po) => openDrawer(this.dialog, StockDetailDialog, { kind: 'purchase', po }));
  }

  openContract(contract: SupplyContract): void {
    openDrawer(this.dialog, ContractDetailDialog, contract);
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.updatePage();
  }

  onLocationChange(loc: LatLng): void {
    this.lat = loc.lat;
    this.lng = loc.lng;
  }

  // A default suggested from the pinned position — the field stays a normal editable input,
  // and typing in it afterward has no effect on the pin.
  onAddressChange(address: string): void {
    this.form.controls.address.setValue(address);
  }

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving = true;
    this.api.updateSupplier({
      supplier_id: this.supplierId,
      name: v.name.trim(),
      phone: v.phone.trim(),
      address: v.address.trim() || null,
      note: v.note.trim() || null,
      is_active: v.is_active,
      entity_type: v.entity_type,
      legal_name: v.legal_name.trim(),
      // an individual signs for themself: no separate signatory is kept
      contact_position: v.entity_type === 'juristic' ? v.contact_position.trim() : '',
      tax_id: v.tax_id.trim(),
      contact_name: v.entity_type === 'juristic' ? v.contact_name.trim() : '',
      bank_name: v.bank_name.trim(),
      bank_account_no: v.bank_account_no.trim(),
      bank_account_name: v.bank_account_name.trim(),
      credit_days: v.credit_days ?? null,
      latitude: this.lat,
      longitude: this.lng,
    }).subscribe({
      next: () => {
        this.saving = false;
        DialogSuccess('บันทึกข้อมูลร้านค้าเรียบร้อยแล้ว');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        DialogErrorHtmlConfirm(err?.error?.message ?? 'บันทึกไม่สำเร็จ');
      },
    });
  }

  /** Asks for the quantity (per month / per year) and prints the supply agreement for this supplier. */
  printAgreement(): void {
    const supplier = this.profile?.supplier;
    if (supplier) void this.agreements.print(supplier).then((created) => { if (created) this.loadContracts(); });
  }

  async toggleActive(): Promise<void> {
    const nextActive = !this.form.controls.is_active.value;
    const confirmMsg = nextActive
      ? 'เปิดรับไก่จากร้านนี้อีกครั้งใช่หรือไม่'
      : 'ไม่รับไก่จากร้านนี้แล้วใช่หรือไม่ (ยังสามารถเปิดกลับมาได้ภายหลัง)';
    if (!(await ConfirmDialog('ยืนยันการเปลี่ยนสถานะ', confirmMsg))) return;
    // only the status is sent: an old supplier without contract details can still be switched on/off
    this.api.updateSupplier({ supplier_id: this.supplierId, is_active: nextActive }).subscribe({
      next: () => {
        this.form.controls.is_active.setValue(nextActive);
        DialogSuccess('อัปเดตสถานะเรียบร้อยแล้ว');
        this.load();
      },
      error: (err) => DialogErrorHtmlConfirm(err?.error?.message ?? 'อัปเดตสถานะไม่สำเร็จ'),
    });
  }
}
