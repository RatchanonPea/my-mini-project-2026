import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDelete, ConfirmDialog, DialogSuccess } from '../../../common/helper';
import { ApiService, ProductItem } from '../../../services/api';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatPaginatorModule, MatIconModule],
  templateUrl: './main-page.html',
  styleUrls: ['./main-page.scss'],
})
export class MainPage implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  pageEvent: any;
  pageIndex = 0;
  pageSize = 5;
  dataSource = new MatTableDataSource<ProductItem>([]);
  items: ProductItem[] = [];
  newItem: Partial<ProductItem> = {
    product_name: '',
    is_active: true
  };
  isEditing = false;

  displayedColumns = ['No', 'product_id', 'product_code', 'product_name', 'price', 'action'];
  isLoading = false;

  constructor(private api: ApiService) {
  }

  ngOnInit() {
    this.loadItems();
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
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  addItem() {
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
        existing.price !== price;

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
              is_active: existing.is_active ?? true
            });
          }
        });

      return;
    }

    const newItem: Omit<ProductItem, 'product_id'> = {
      product_name: productName,
      price,
      is_active: true
    };

    this.api.createProduct(newItem).subscribe({
      next: (created) => {
        this.items = [...this.items, created];
        this.updateTable();
        DialogSuccess('เพิ่มรายการสำเร็จ');
        this.resetForm();
      },
      error: (err) => {
        console.error('Create product failed', err);
      }
    });
  }

  updateItem(changes: Partial<ProductItem> & { product_id: number }) {
    this.api.updateProduct(changes).subscribe({
      next: (updated) => {
        this.items = this.items.map(item => item.product_id === updated.product_id ? updated : item);
        this.updateTable();
        DialogSuccess('อัปเดตรายการสำเร็จ');
        this.resetForm();
      },
      error: (err) => {
        console.error('Update product failed', err);
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
      is_active: true
    };
    this.isEditing = false;
  }

  editItem(item: ProductItem) {
    this.isEditing = true;
    this.newItem = {
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      is_active: item.is_active
    };
  }

  removeItem(product_id: number): void {
    ConfirmDelete('ยืนยันการลบ', 'คุณต้องการลบรายการนี้ใช่หรือไม่')
      .then((emit) => {
        if (emit) {
          this.api.deleteProduct(product_id).subscribe({
            next: (updated) => {
              this.items = this.items.map(item => item.product_id === updated.product_id ? updated : item)
                .filter(item => item.is_active !== 0);
              this.updateTable();
              DialogSuccess('ลบรายการสำเร็จ');
            },
            error: (err) => {
              console.error('Delete product failed', err);
            }
          });
        }
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
