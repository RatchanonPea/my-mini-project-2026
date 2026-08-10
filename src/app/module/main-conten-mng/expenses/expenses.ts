import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

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
  templateUrl: './expenses.html',
  styleUrls: ['./expenses.scss']
})
export class Expenses {
  displayedColumns = ['id', 'category', 'description', 'amount'];
  expenseItems: ExpenseItem[] = [];
  dataSource = new MatTableDataSource<ExpenseItem>(this.expenseItems);
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

    this.dataSource.data = this.expenseItems;
    this.newExpense = { category: '', description: '', amount: 0 };
  }
}
