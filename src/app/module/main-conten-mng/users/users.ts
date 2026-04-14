import { Component, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatDialog } from '@angular/material/dialog';
import { AddUserItemDialog } from './add-user-item-dialog/add-user-item-dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ConfirmDialog } from '../../../common/helper';
import { MatButtonModule } from '@angular/material/button';

interface GridItem {
  No?: number;
  id: number;
  code?: string;
  title: string;
  description: string;
  price?: number;
}

@Component({
  selector: 'app-users',
  imports: [MatPaginatorModule, MatTableModule, CommonModule, MatButtonModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  pageEvent: any;
  pageIndex = 0;
  pageSize = 5;
  dataSource = new MatTableDataSource<GridItem>([]);
  items: GridItem[] = [
    { id: 1, code: 'A001', title: 'สินค้า A', description: 'รายละเอียดสินค้าชิ้นที่ 1', price: 100 },
    { id: 2, code: 'A002', title: 'สินค้า B', description: 'รายละเอียดสินค้าชิ้นที่ 2', price: 200 },
    { id: 3, code: 'A003', title: 'สินค้า C', description: 'รายละเอียดสินค้าชิ้นที่ 3', price: 300 }
  ];
  displayedColumns = ['No', 'id', 'code', 'title', 'description', 'price', 'action'];
  totalItems: any = 0;

  constructor(
    private dialog: MatDialog,
  ) {
    this.dataSource.data = this.items;
  }
  ngOnInit() {

  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddUserItemDialog, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // เพิ่มข้อมูลเข้า table
        this.dataSource.data = [...this.dataSource.data, result];
        this.totalItems++;
      }
    });
  }
  removeItem(id: number): void {
    ConfirmDialog('ยืนยันการลบ', "คุณต้องการลบรายการนี้ใช่หรือไม่")
      .then(async emit => {
        if (emit) {
          this.dataSource.data = this.dataSource.data.filter(item => item.id !== id);
          this.totalItems--;
        }
      });
  }

  onPageChange(event: any) {
    this.pageEvent = event;
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    console.log('หน้า:', event.pageIndex + 1); // 👈 หน้า (เริ่ม 1)
    console.log('ต่อหน้า:', event.pageSize);
  }

}

