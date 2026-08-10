import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

interface SaleItem {
  id: number;
  product: string;
  quantity: number;
  price: number;
  total: number;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatTableModule],
  templateUrl: './sales.html',
  styleUrls: ['./sales.scss']
})
export class Sales {
  menuItems = ['ไก่ย่าง', 'ส้มตำ', 'ข้าวเหนียว', 'น้ำตก', 'คอหมูย่าง'];
  displayedColumns = ['id', 'product', 'quantity', 'price', 'total', 'action'];
  soldItems: SaleItem[] = [];
  dataSource = new MatTableDataSource<SaleItem>([]);
  isEditing = false;
  newSale: Partial<SaleItem> = {
    product: '',
    quantity: 1,
    price: 0,
  };

  canSaveSale(): boolean {
    return !!this.newSale.product && (this.newSale.quantity ?? 0) > 0 && (this.newSale.price ?? 0) > 0;
  }

  saveSale(): void {
    if (!this.canSaveSale()) {
      return;
    }

    if (this.isEditing && this.newSale.id) {
      this.updateSale();
    } else {
      this.addSale();
    }
  }

  addSale(): void {
    const id = this.soldItems.length + 1;
    const quantity = this.newSale.quantity || 0;
    const price = this.newSale.price || 0;
    const item: SaleItem = {
      id,
      product: this.newSale.product || '',
      quantity,
      price,
      total: quantity * price,
    };
    this.soldItems = [item, ...this.soldItems];
    this.dataSource.data = this.soldItems;
    this.resetForm();
  }

  editSale(item: SaleItem): void {
    this.isEditing = true;
    this.newSale = { ...item };
  }

  updateSale(): void {
    if (!this.newSale.id) {
      return;
    }

    const quantity = this.newSale.quantity || 0;
    const price = this.newSale.price || 0;
    this.soldItems = this.soldItems.map(item => {
      if (item.id === this.newSale.id) {
        return {
          ...item,
          product: this.newSale.product || item.product,
          quantity,
          price,
          total: quantity * price,
        };
      }
      return item;
    });
    this.dataSource.data = this.soldItems;
    this.resetForm();
  }

  cancelEdit(): void {
    this.resetForm();
  }

  removeSale(id: number): void {
    this.soldItems = this.soldItems.filter(item => item.id !== id);
    this.dataSource.data = this.soldItems;
    if (this.isEditing && this.newSale.id === id) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.newSale = { product: '', quantity: 1, price: 0 };
  }
}
