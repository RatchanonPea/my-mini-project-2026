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
import { Pager } from '../../../shared/pager/pager';
import { LatLng, LocationPicker } from '../../../shared/location-picker/location-picker';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTableModule, Pager, LocationPicker],
  templateUrl: './suppliers.html',
  styleUrls: ['./suppliers.scss'],
})
export class Suppliers implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
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
      latitude: this.lat,
      longitude: this.lng,
    }).subscribe({
      next: () => {
        this.saving = false;
        DialogSuccess('เพิ่มร้านค้าเรียบร้อยแล้ว');
        this.form.reset({ name: '', phone: '', address: '', note: '' });
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

  async toggleActive(supplier: Supplier, event: Event): Promise<void> {
    event.stopPropagation();
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
}
