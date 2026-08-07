import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

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
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTableModule],
  template: `
    <section class="sales-page">
      <div class="page-header">
        <div>
          <h3>บันทึกยอดขาย (Sales / POS)</h3>
          <p class="subtitle">เลือกเมนูอาหาร แล้วบันทึกยอดขาย ประวัติการขายวันนี้สามารถแก้ไขหรือยกเลิกได้</p>
        </div>
      </div>

      <div class="sales-grid">
        <mat-card class="sales-card">
          <mat-card-header>
            <mat-card-title>บันทึกรายการขาย</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>เมนูอาหาร</mat-label>
                <select matNativeControl [(ngModel)]="newSale.product">
                  <option value="">เลือกเมนูอาหาร</option>
                  <option *ngFor="let item of menuItems" [value]="item">{{ item }}</option>
                </select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>จำนวน</mat-label>
                <input matInput type="number" [(ngModel)]="newSale.quantity" min="1" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>ราคา/ชิ้น</mat-label>
                <input matInput type="number" [(ngModel)]="newSale.price" min="0" />
              </mat-form-field>
            </div>
            <div class="form-actions">
              <button mat-flat-button color="primary" (click)="addSale()" [disabled]="!canAddSale()">
                <mat-icon>add_shopping_cart</mat-icon> บันทึกยอดขายด่วน
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="history-card">
          <mat-card-header>
            <mat-card-title>ประวัติการขายวันนี้</mat-card-title>
            <mat-card-subtitle>แก้ไขหรือยกเลิกบิลได้</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="table-wrapper">
              <table mat-table [dataSource]="soldItems" class="mat-elevation-z2">
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef> # </th>
                  <td mat-cell *matCellDef="let item">{{ item.id }}</td>
                </ng-container>
                <ng-container matColumnDef="product">
                  <th mat-header-cell *matHeaderCellDef> เมนู </th>
                  <td mat-cell *matCellDef="let item">{{ item.product }}</td>
                </ng-container>
                <ng-container matColumnDef="quantity">
                  <th mat-header-cell *matHeaderCellDef> จำนวน </th>
                  <td mat-cell *matCellDef="let item">{{ item.quantity }}</td>
                </ng-container>
                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef> ราคา/ชิ้น </th>
                  <td mat-cell *matCellDef="let item">{{ item.price | currency:'THB ':'symbol':'1.0-0' }}</td>
                </ng-container>
                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef> รวม </th>
                  <td mat-cell *matCellDef="let item">{{ item.total | currency:'THB ':'symbol':'1.0-0' }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [
    `.sales-page { padding: 1.5rem; }
     .page-header { margin-bottom: 1.5rem; }
     .subtitle { color: #6b7280; }
     .sales-grid { display: grid; gap: 1.25rem; grid-template-columns: 1.5fr 1fr; }
     .sales-card, .history-card { padding: 1rem; }
     .form-row { display: grid; grid-template-columns: 1.5fr 0.8fr 0.8fr; gap: 1rem; align-items: end; }
     .full-width { width: 100%; }
     .form-actions { margin-top: 1rem; }
     .table-wrapper { overflow-x: auto; }
     table { width: 100%; border-collapse: collapse; }
     th, td { padding: 0.75rem 0.5rem; }
     th { text-align: left; }
    `
  ]
})
export class Sales {
  menuItems = ['ไก่ย่าง', 'ส้มตำ', 'ข้าวเหนียว', 'น้ำตก', 'คอหมูย่าง'];
  displayedColumns = ['id', 'product', 'quantity', 'price', 'total'];
  soldItems: SaleItem[] = [];
  newSale: Partial<SaleItem> = {
    product: '',
    quantity: 1,
    price: 0,
  };

  canAddSale(): boolean {
    return !!this.newSale.product && !!this.newSale.quantity && !!this.newSale.price;
  }

  addSale(): void {
    if (!this.canAddSale()) {
      return;
    }

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
    this.newSale = { product: '', quantity: 1, price: 0 };
  }
}
