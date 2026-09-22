import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { ApiService, SupplierOrderHistory, SupplierProfile as SupplierProfileData } from '../../../../services/api';
import { ConfirmDialog, DialogErrorHtmlConfirm, DialogSuccess } from '../../../../common/helper';
import { Pager } from '../../../../shared/pager/pager';
import { LatLng, LocationPicker } from '../../../../shared/location-picker/location-picker';

@Component({
  selector: 'app-supplier-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatTableModule, Pager, LocationPicker],
  templateUrl: './supplier-profile.html',
  styleUrls: ['./supplier-profile.scss'],
})
export class SupplierProfile implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly statusLabel: Record<string, string> = { ordered: 'สั่งแล้ว', received: 'รับแล้ว', cancelled: 'ยกเลิก' };
  displayedColumns = ['code', 'order_date', 'quantity', 'unit_cost', 'total_cost', 'status', 'received_date'];

  supplierId = 0;
  profile: SupplierProfileData | null = null;
  orders: SupplierOrderHistory[] = [];
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
  });

  ngOnInit(): void {
    this.supplierId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getSupplierProfile(this.supplierId).subscribe({
      next: (data) => {
        this.profile = data;
        this.orders = data.orders;
        this.pageIndex = 0;
        this.updatePage();
        this.lat = data.supplier.latitude;
        this.lng = data.supplier.longitude;
        this.form.setValue({
          name: data.supplier.name,
          phone: data.supplier.phone ?? '',
          address: data.supplier.address ?? '',
          note: data.supplier.note ?? '',
          is_active: data.supplier.is_active,
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  back(): void {
    this.router.navigate(['/main-conten-mng/suppliers']);
  }

  private updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedOrders = this.orders.slice(start, start + this.pageSize);
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

  async toggleActive(): Promise<void> {
    const nextActive = !this.form.controls.is_active.value;
    const confirmMsg = nextActive
      ? 'เปิดรับไก่จากร้านนี้อีกครั้งใช่หรือไม่'
      : 'ไม่รับไก่จากร้านนี้แล้วใช่หรือไม่ (ยังสามารถเปิดกลับมาได้ภายหลัง)';
    if (!(await ConfirmDialog('ยืนยันการเปลี่ยนสถานะ', confirmMsg))) return;
    this.form.controls.is_active.setValue(nextActive);
    this.save();
  }
}
