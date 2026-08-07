import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

interface ExpenseItem {
  id: number;
  category: string;
  description: string;
  amount: number;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTableModule],
  template: `
    <section class="expenses-page">
      <div class="page-header">
        <div>
          <h3>จัดการค่าใช้จ่าย</h3>
          <p class="subtitle">เพิ่มค่าใช้จ่ายร้านอาหาร ให้วัตถุดิบและต้นทุนถูกตรวจสอบง่าย</p>
        </div>
      </div>

      <div class="expenses-grid">
        <mat-card class="expense-entry-card">
          <mat-card-header>
            <mat-card-title>บันทึกค่าใช้จ่าย</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>หมวด</mat-label>
                <input matInput [(ngModel)]="newExpense.category" placeholder="อาหาร วัตถุดิบ ค่าน้ำ ค่าไฟ" />
              </mat-form-field>
            </div>
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>รายละเอียด</mat-label>
                <input matInput [(ngModel)]="newExpense.description" placeholder="เช่น ซื้อผักสด, บิลแก๊ส" />
              </mat-form-field>
            </div>
            <div class="form-row small-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>จำนวนเงิน (บาท)</mat-label>
                <input matInput type="number" [(ngModel)]="newExpense.amount" min="0" />
              </mat-form-field>
            </div>
            <div class="form-actions">
              <button mat-flat-button color="primary" (click)="addExpense()" [disabled]="!canAddExpense()">
                <mat-icon>receipt_long</mat-icon> บันทึกค่าใช้จ่าย
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="expense-history-card">
          <mat-card-header>
            <mat-card-title>ตารางค่าใช้จ่าย</mat-card-title>
            <mat-card-subtitle>ดูค่าใช้จ่ายทั้งหมดและรวมยอดรายวัน</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="table-wrapper">
              <table mat-table [dataSource]="expenseItems" class="mat-elevation-z2">
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef> # </th>
                  <td mat-cell *matCellDef="let expense">{{ expense.id }}</td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef> หมวด </th>
                  <td mat-cell *matCellDef="let expense">{{ expense.category }}</td>
                </ng-container>
                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef> รายละเอียด </th>
                  <td mat-cell *matCellDef="let expense">{{ expense.description }}</td>
                </ng-container>
                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef> จำนวนเงิน </th>
                  <td mat-cell *matCellDef="let expense">{{ expense.amount | currency:'THB ':'symbol':'1.0-0' }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
            <div class="summary-row">
              <span>รวมทั้งหมด</span>
              <strong>{{ totalExpense | currency:'THB ':'symbol':'1.0-0' }}</strong>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [
    `.expenses-page { padding: 1.5rem; }
     .page-header { margin-bottom: 1.5rem; }
     .subtitle { color: #6b7280; }
     .expenses-grid { display: grid; gap: 1.25rem; grid-template-columns: 1.3fr 1fr; }
     .expense-entry-card, .expense-history-card { padding: 1rem; }
     .form-row { display: grid; gap: 1rem; margin-bottom: 1rem; }
     .small-row { grid-template-columns: 1fr; }
     .full-width { width: 100%; }
     .form-actions { margin-top: 1rem; }
     .table-wrapper { overflow-x: auto; }
     table { width: 100%; border-collapse: collapse; }
     th, td { padding: 0.75rem 0.5rem; }
     .summary-row { margin-top: 1rem; display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
    `
  ]
})
export class Expenses {
  displayedColumns = ['id', 'category', 'description', 'amount'];
  expenseItems: ExpenseItem[] = [];
  newExpense: Partial<ExpenseItem> = {
    category: '',
    description: '',
    amount: 0,
  };

  get totalExpense(): number {
    return this.expenseItems.reduce((sum, item) => sum + item.amount, 0);
  }

  canAddExpense(): boolean {
    return !!this.newExpense.category && !!this.newExpense.description && this.newExpense.amount !== undefined && this.newExpense.amount > 0;
  }

  addExpense(): void {
    if (!this.canAddExpense()) {
      return;
    }

    const id = this.expenseItems.length + 1;
    this.expenseItems = [
      {
        id,
        category: this.newExpense.category || '',
        description: this.newExpense.description || '',
        amount: this.newExpense.amount || 0,
      },
      ...this.expenseItems,
    ];

    this.newExpense = { category: '', description: '', amount: 0 };
  }
}
