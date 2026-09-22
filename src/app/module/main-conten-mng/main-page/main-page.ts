import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ConfirmDelete, ConfirmDialog, DialogErrorHtmlConfirm, DialogSuccess } from '../../../common/helper';
import { ApiService, Category, ProductItem } from '../../../services/api';
import { AuthService } from '../../../services/auth';
import { Pager } from '../../../shared/pager/pager';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [Pager, CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatPaginatorModule, MatIconModule, MatSelectModule],
  templateUrl: './main-page.html',
  styleUrls: ['./main-page.scss'],
})
export class MainPage implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  pageEvent: any;
  pageIndex = 0;
  pageSize = 10;
  dataSource = new MatTableDataSource<ProductItem>([]);
  items: ProductItem[] = [];
  categories: Category[] = [];
  newItem: Partial<ProductItem> = {
    product_name: '',
    category_id: null,
    is_active: true
  };
  isEditing = false;

  displayedColumns = ['No', 'product_id', 'product_code', 'product_name', 'category_name', 'price', 'updated_at', 'updated_by_name', 'action'];
  isLoading = false;
  currentUserRole: string | null = null;
  searchText = '';

  get isStaffRole(): boolean {
    return (this.currentUserRole ?? '').trim().toLowerCase() === 'staff';
  }

  get canManageProducts(): boolean {
    return !this.isStaffRole;
  }

  constructor(private api: ApiService, private authService: AuthService) {
  }

  ngOnInit() {
    this.currentUserRole = this.authService.getCurrentUserRole();
    this.authService.currentUserRole$.subscribe((role) => {
      this.currentUserRole = role;
    });
    this.loadItems();
    this.api.getCategories('product').subscribe((c) => (this.categories = c));
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadItems() {
    this.isLoading = true;
    this.api.getProducts().subscribe({
      next: (items) => {
        this.items = items.filter(item => item.is_active !== false);
        this.updateTable();
      },
      error: (err) => {
        console.error('Load products failed', err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  updateTable() {
    this.dataSource = new MatTableDataSource<ProductItem>([...this.items]);
    this.dataSource.filterPredicate = (data, filter) => {
      const haystack = [
        data.product_id ?? '',
        data.product_code ?? '',
        data.product_name ?? '',
        data.category_name ?? '',
        data.price ?? ''
      ].join(' ').toLowerCase();
      return haystack.includes(filter);
    };
    this.applySearch();
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.applySearch();
  }

  applySearch(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    this.pageIndex = 0;
  }

  addItem() {
    if (this.isStaffRole) {
      return;
    }

    const productName = this.newItem.product_name?.trim();
    const price = Number(this.newItem.price) || 0;

    if (!productName || !price) {
      return;
    }

    if (this.isEditing && this.newItem.product_id && this.newItem.product_id > 0) {
      const existing = this.items.find(item => item.product_id === this.newItem.product_id);
      if (!existing) {
        return;
      }

      const isChanged =
        existing.product_name !== productName ||
        existing.price !== price ||
        (existing.category_id ?? null) !== (this.newItem.category_id ?? null);

      if (!isChanged) {
        this.resetForm();
        return;
      }

      ConfirmDialog('ยืนยันการแก้ไข', 'คุณต้องการอัปเดตรายการนี้ใช่หรือไม่')
        .then(confirm => {
          if (confirm) {
            this.updateItem({
              product_id: existing.product_id,
              product_name: productName,
              price,
              category_id: this.newItem.category_id ?? null,
              is_active: existing.is_active ?? true
            });
          }
        });

      return;
    }

    const newItem: Omit<ProductItem, 'product_id'> = {
      product_name: productName,
      price,
      category_id: this.newItem.category_id ?? null,
      is_active: true
    };

    ConfirmDialog('ยืนยันการเพิ่มสินค้า', `คุณต้องการเพิ่มสินค้า "${productName}" ในราคา ${price} บาท ใช่หรือไม่ ?`)
      .then((confirm) => {
        if (!confirm) {
          return;
        }

        this.api.createProduct(newItem).subscribe({
          next: () => {
            this.resetForm();
            this.loadItems();
            DialogSuccess('เพิ่มรายการสำเร็จ');
          },
          error: (err) => {
            console.error('Create product failed', err);
            DialogErrorHtmlConfirm('ไม่สามารถเพิ่มสินค้าได้ กรุณาลองใหม่อีกครั้ง');
          }
        });
      });
  }

  updateItem(changes: Partial<ProductItem> & { product_id: number }) {
    this.api.updateProduct(changes).subscribe({
      next: () => {
        this.resetForm();
        this.loadItems();
        DialogSuccess('อัปเดตรายการสำเร็จ');
      },
      error: (err) => {
        console.error('Update product failed', err);
        DialogErrorHtmlConfirm('ไม่สามารถแก้ไขสินค้าได้ กรุณาลองใหม่อีกครั้ง');
      }
    });
  }

  // product_id is managed by the backend; this helper is not used for current API.
  generateCode(): string {
    return '';
  }

  resetForm() {
    this.newItem = {
      product_name: '',
      category_id: null,
      is_active: true
    };
    this.isEditing = false;
  }

  editItem(item: ProductItem) {
    if (this.isStaffRole) {
      return;
    }

    this.isEditing = true;
    this.newItem = {
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      category_id: item.category_id ?? null,
      is_active: item.is_active
    };
  }

  removeItem(product_id: number): void {
    if (this.isStaffRole) {
      return;
    }

    ConfirmDelete('ยืนยันการลบ', 'คุณต้องการลบรายการนี้ใช่หรือไม่')
      .then((emit) => {
        if (emit) {
          this.api.deleteProduct(product_id).subscribe({
            next: () => {
              this.loadItems();
              DialogSuccess('ลบรายการสำเร็จ');
            },
            error: (err) => {
              console.error('Delete product failed', err);
              DialogErrorHtmlConfirm('ไม่สามารถลบสินค้าได้ กรุณาลองใหม่อีกครั้ง');
            }
          });
        }
      });
  }

  get totalFiltered(): number {
    return this.dataSource.filteredData.length;
  }

  goToPage(index: number): void {
    this.paginator.pageIndex = index;
    this.paginator.page.emit({
      pageIndex: index,
      previousPageIndex: this.pageIndex,
      pageSize: this.paginator.pageSize,
      length: this.paginator.length,
    });
  }

  onPageChange(event: any) {
    this.pageEvent = event;
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getTotalPrice(): number {
    return this.items.reduce((sum, item) => sum + (item.price || 0), 0);
  }
}
