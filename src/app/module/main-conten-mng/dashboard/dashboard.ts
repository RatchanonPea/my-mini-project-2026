import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface TopProduct {
  id: number;
  name: string;
  sold: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  selectedDate: Date = new Date();

  stats = [
    { title: 'ยอดขายวันนี้', value: '฿ 12,840', color: 'primary' },
    { title: 'ค่าใช้จ่ายวันนี้', value: '฿ 3,840', color: 'warn' },
    { title: 'กำไรสุทธิ', value: '฿ 9,000', color: 'accent' },
    { title: 'ออเดอร์รอดำเนินการ', value: '8', color: 'info' }
  ];

  displayedColumns: string[] = ['id', 'name', 'sold', 'revenue'];
  dataSource = new MatTableDataSource<TopProduct>([
    { id: 1, name: 'ส้มตำไทย', sold: 45, revenue: 11250 },
    { id: 2, name: 'ไก่ย่าง', sold: 32, revenue: 9600 },
    { id: 3, name: 'ข้าวเหนียวหมูปิ้ง', sold: 28, revenue: 8400 },
    { id: 4, name: 'ตำลาว', sold: 21, revenue: 6300 },
    { id: 5, name: 'เครื่องดื่มเย็น', sold: 18, revenue: 5400 }
  ]);

  ngOnInit() {
    // Initialize component
  }

  get totalRevenue(): number {
    return this.dataSource.data.reduce((sum, item) => sum + item.revenue, 0);
  }

  get totalSold(): number {
    return this.dataSource.data.reduce((sum, item) => sum + item.sold, 0);
  }

  get bestSellingMenu(): string {
    if (!this.dataSource.data.length) {
      return '-';
    }
    return this.dataSource.data.reduce((best, item) => item.revenue > best.revenue ? item : best, this.dataSource.data[0]).name;
  }

  get menuCount(): number {
    return this.dataSource.data.length;
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
  }
}

