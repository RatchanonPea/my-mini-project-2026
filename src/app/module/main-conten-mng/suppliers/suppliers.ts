import { SupplierContractFields, contractControls } from './contract-fields/contract-fields';
import { NoData } from '../../../shared/no-data/no-data';
import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiService, Supplier } from '../../../services/api';
import { ConfirmDialog, DialogErrorHtmlConfirm, DialogSuccess } from '../../../common/helper';
import { SupplyAgreementService } from './supply-agreement';
import { Pager } from '../../../shared/pager/pager';
import { LatLng, LocationPicker } from '../../../shared/location-picker/location-picker';
import { ClearButton } from '../../../shared/clear-button/clear-button';
import { CharCount } from '../../../shared/char-count/char-count';
import { RowDrawer, RowDrawerData, openDrawer } from '../../../shared/row-drawer/row-drawer';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CharCount, ClearButton, SupplierContractFields, NoData, CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTableModule, Pager, LocationPicker],
  templateUrl: './suppliers.html',
  styleUrls: ['./suppliers.scss'],
})
export class Suppliers implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private agreements = inject(SupplyAgreementService);
  private reload$ = new Subject<void>();
  @ViewChild(LocationPicker) private locationPicker?: LocationPicker;

  displayedColumns = ['code', 'name', 'phone', 'is_active', 'action'];
  dataSource = new MatTableDataSource<Supplier>([]);

  readonly pageSize = 10;
  pageIndex = 0;
  total = 0;

  saving = false;

  lat: number | null = null;
  lng: number | null = null;

  filterForm = this.fb.nonNullable.group({ keyword: [''] });

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
    address: [''],
    note: [''],
    ...contractControls(),
  });

  ngOnInit(): void {
    this.reload$.pipe(
      switchMap(() => this.api.searchSuppliers({
        keyword: this.filterForm.controls.keyword.value,
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
      }).pipe(catchError(() => of({ items: [], total: 0, total_amount: 0, page: 1, pageSize: this.pageSize })))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.dataSource.data = result.items;
      this.total = result.total;
    });

    this.reload$.next();
  }

  search(): void {
    this.pageIndex = 0;
    this.reload$.next();
  }

  clearFilter(): void {
    this.filterForm.reset({ keyword: '' });
    this.search();
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.reload$.next();
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

  addSupplier(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving = true;
    this.api.createSupplier({
      name: v.name.trim(),
      phone: v.phone.trim() || null,
      address: v.address.trim() || null,
      note: v.note.trim() || null,
      entity_type: v.entity_type,
      legal_name: v.legal_name.trim() || null,
      contact_position: v.entity_type === 'juristic' ? v.contact_position.trim() || null : null,
      tax_id: v.tax_id.trim() || null,
      contact_name: v.entity_type === 'juristic' ? v.contact_name.trim() || null : null,
      bank_name: v.bank_name.trim() || null,
      bank_account_no: v.bank_account_no.trim() || null,
      bank_account_name: v.bank_account_name.trim() || null,
      credit_days: v.credit_days ?? null,
      latitude: this.lat,
      longitude: this.lng,
    }).subscribe({
      next: () => {
        this.saving = false;
        DialogSuccess('เพิ่มร้านค้าเรียบร้อยแล้ว');
        this.form.reset({ name: '', phone: '', address: '', note: '', entity_type: 'individual', legal_name: '', contact_position: '', tax_id: '', contact_name: '', bank_name: '', bank_account_no: '', bank_account_name: '', credit_days: null });
        this.lat = null;
        this.lng = null;
        this.locationPicker?.reset();
        this.reload$.next();
      },
      error: (err) => {
        this.saving = false;
        DialogErrorHtmlConfirm(err?.error?.message ?? 'เพิ่มร้านค้าไม่สำเร็จ');
      },
    });
  }

  openProfile(supplier: Supplier): void {
    this.router.navigate(['/main-conten-mng/suppliers', supplier.supplier_id]);
  }

  /** Asks for the quantity (per month / per year) and prints the supply agreement for this supplier. */
  printAgreement(supplier: Supplier, event?: Event): void {
    event?.stopPropagation();
    void this.agreements.print(supplier);
  }

  async toggleActive(supplier: Supplier, event?: Event): Promise<void> {
    event?.stopPropagation();
    const nextActive = !supplier.is_active;
    const confirmMsg = nextActive
      ? `เปิดรับไก่จากร้าน "${supplier.name}" อีกครั้งใช่หรือไม่`
      : `ไม่รับไก่จากร้าน "${supplier.name}" แล้วใช่หรือไม่`;
    if (!(await ConfirmDialog('ยืนยันการเปลี่ยนสถานะ', confirmMsg))) return;

    this.api.updateSupplier({ supplier_id: supplier.supplier_id, is_active: nextActive }).subscribe({
      next: () => {
        DialogSuccess('อัปเดตสถานะเรียบร้อยแล้ว');
        this.reload$.next();
      },
      error: (err) => DialogErrorHtmlConfirm(err?.error?.message ?? 'อัปเดตสถานะไม่สำเร็จ'),
    });
  }

  openRow(supplier: Supplier): void {
    openDrawer<RowDrawer, RowDrawerData>(this.dialog, RowDrawer, {
      title: supplier.name,
      subtitle: supplier.code,
      icon: 'storefront',
      highlight: { label: 'สถานะ', value: supplier.is_active ? 'รับไก่อยู่' : 'ไม่รับไก่แล้ว', negative: !supplier.is_active },
      fields: [
        { label: 'เบอร์โทร', value: supplier.phone },
        { label: 'ที่อยู่', value: supplier.address },
        { label: 'หมายเหตุ', value: supplier.note },
        {
          label: 'เครดิต',
          value: supplier.credit_days === null || supplier.credit_days === undefined ? null : supplier.credit_days === 0 ? 'จ่ายสด' : `${supplier.credit_days} วัน`,
        },
        { label: 'ธนาคาร', value: supplier.bank_name },
        { label: 'เลขบัญชี', value: supplier.bank_account_no },
        { label: 'ชื่อบัญชี', value: supplier.bank_account_name },
      ],
      actions: [
        {
          label: supplier.is_active ? 'หยุดรับไก่' : 'เปิดรับไก่',
          icon: supplier.is_active ? 'block' : 'check_circle',
          kind: supplier.is_active ? 'warn' : undefined,
          run: () => void this.toggleActive(supplier),
        },
        { label: 'พิมพ์ข้อตกลง', icon: 'description', run: () => this.printAgreement(supplier) },
        { label: 'เปิดโปรไฟล์', icon: 'open_in_new', kind: 'primary', run: () => this.openProfile(supplier) },
      ],
    });
  }
}
