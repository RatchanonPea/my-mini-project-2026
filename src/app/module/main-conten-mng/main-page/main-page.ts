import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCard } from "@angular/material/card";

interface GridItem {
  id: number;
  title: string;
  description: string;
  price?: number;
}

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatPaginatorModule],
  templateUrl: './main-page.html',
  styleUrls: ['./main-page.scss'],
})
export class MainPage {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  pageEvent: any;
  dataSource = new MatTableDataSource<any>([]);
  items: GridItem[] = [
    { id: 1, title: 'สินค้า A', description: 'รายละเอียดสินค้าชิ้นที่ 1', price: 100 },
    { id: 2, title: 'สินค้า B', description: 'รายละเอียดสินค้าชิ้นที่ 2', price: 200 },
    { id: 3, title: 'สินค้า C', description: 'รายละเอียดสินค้าชิ้นที่ 3', price: 300 }
  ];

  newItem: Partial<GridItem> = {
    title: '',
    description: '',
    price: 0
  };

  displayedColumns = ['id', 'title', 'description', 'price', 'action'];

  constructor() {
    this.dataSource.data = this.items;
  }
  ngOnInit() {
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  updateTable() {
    this.dataSource.data = this.items;
  }

  addItem(): void {
    if (!this.newItem.title || !this.newItem.description) {
      return;
    }

    const nextId = this.items.length > 0 ? Math.max(...this.items.map(item => item.id)) + 1 : 1;
    this.items = [
      ...this.items,
      {
        id: nextId,
        title: this.newItem.title.trim(),
        description: this.newItem.description.trim(),
        price: this.newItem.price
      }

    ];
    this.updateTable(); // 👈 สำคัญ
    this.newItem.title = '';
    this.newItem.description = '';
    this.newItem.price = 0;

  }

  removeItem(id: number): void {
    this.items = this.items.filter(item => item.id !== id);
    this.updateTable(); // 👈 สำคัญ
  }

  onPageChange(event: any) {
    this.pageEvent = event;

    console.log('หน้า:', event.pageIndex + 1); // 👈 หน้า (เริ่ม 1)
    console.log('ต่อหน้า:', event.pageSize);
  }
  //  calculate total price of all items
  getTotalPrice(): number {
    return this.items.reduce((sum, item) => sum + (item.price || 0), 0);
  }
}
