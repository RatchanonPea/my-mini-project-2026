import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCard } from "@angular/material/card";
import { ConfirmDelete, ConfirmDialog, DialogSuccess } from '../../../common/helper';
import { MatIconModule } from '@angular/material/icon';

interface GridItem {
  No?: number;
  id: number;
  code?: string;
  title: string;
  description: string;
  price?: number;
}

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatPaginatorModule, MatIconModule],
  templateUrl: './main-page.html',
  styleUrls: ['./main-page.scss'],
})
export class MainPage {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  pageEvent: any;
  pageIndex = 0;
  pageSize = 5;
  dataSource = new MatTableDataSource<any>([]);
  items: GridItem[] = [
    { id: 1, code: 'A001', title: 'สินค้า A', description: 'รายละเอียดสินค้าชิ้นที่ 1', price: 100 },
    { id: 2, code: 'A002', title: 'สินค้า B', description: 'รายละเอียดสินค้าชิ้นที่ 2', price: 200 },
    { id: 3, code: 'A003', title: 'สินค้า C', description: 'รายละเอียดสินค้าชิ้นที่ 3', price: 300 }
  ];

  newItem: Partial<GridItem> = {
    title: '',
    description: '',
    price: 0
  };

  displayedColumns = ['No', 'id', 'code', 'title', 'description', 'price', 'action'];

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


  addItem() {
    if (!this.newItem.title || !this.newItem.description) {
      return;
    }

    const existingIndex = this.items.findIndex(item => item.id === this.newItem.id);
    const existingItem = this.items[existingIndex];

    if (existingIndex !== -1) {

      // ======================
      // 🟡 EDIT เท่านั้น
      // ======================
      const current = this.items[existingIndex];

      const isChanged =
        current.title !== this.newItem.title?.trim() ||
        current.description !== this.newItem.description?.trim() ||
        current.price !== this.newItem.price;

      if (!isChanged) {
        // ไม่มีการเปลี่ยน → ไม่ต้องถาม
        this.updateItem2(existingIndex);
        return;
      }

      // มีการเปลี่ยน → ค่อย confirm
      ConfirmDialog('ยืนยันการแก้ไข', 'คุณต้องการอัปเดตรายการนี้ใช่หรือไม่')
        .then(confirm => {
          if (confirm) {
            this.updateItem2(existingIndex);
          }
        });

    } else {

      // ======================
      // 🟢 ADD (ไม่ต้องเช็ค isChanged)
      // ======================
      const nextId = this.items.length > 0
        ? Math.max(...this.items.map(item => item.id)) + 1
        : 1;

      const newCode = this.generateCode();

      this.items = [
        ...this.items,
        {
          id: nextId,
          code: newCode,
          title: this.newItem.title!.trim(),
          description: this.newItem.description!.trim(),
          price: this.newItem.price
        }
      ];

      this.updateTable();
      DialogSuccess('เพิ่มรายการสำเร็จ');
      this.resetForm();
    }

    // if (existingIndex !== -1) {
    //   ConfirmDialog('ยืนยันการแก้ไข', 'คุณต้องการอัปเดตรายการนี้ใช่หรือไม่')
    //     .then((confirm) => {
    //       if (confirm) {
    //         this.items[existingIndex] = {
    //           ...this.items[existingIndex]!, // 👈 ใส่ !
    //           title: this.newItem.title!.trim(),
    //           description: this.newItem.description!.trim(),
    //           price: this.newItem.price
    //         };

    //         this.updateTable();
    //         DialogSuccess('อัปเดตรายการสำเร็จ');

    //         this.resetForm();
    //       }
    //     });

    // } else {
    //   // 🔥 ADD NEW
    //   const nextId = this.items.length > 0
    //     ? Math.max(...this.items.map(item => item.id)) + 1
    //     : 1;

    //   const newCode = this.generateCode();

    //   this.items = [
    //     ...this.items,
    //     {
    //       id: nextId,
    //       code: newCode,
    //       title: this.newItem.title.trim(),
    //       description: this.newItem.description.trim(),
    //       price: this.newItem.price
    //     }
    //   ];

    //   this.updateTable();
    //   DialogSuccess('เพิ่มรายการสำเร็จ');

    //   this.resetForm();
    // }
  }

  updateItem2(index: number) {
    this.items[index] = {
      ...this.items[index],
      title: this.newItem.title!.trim(),
      description: this.newItem.description!.trim(),
      price: this.newItem.price
    };

    this.updateTable();
    DialogSuccess('อัปเดตรายการสำเร็จ');
    this.resetForm();
  }
  updateItem(index: number, existingItem: any) {
    this.items[index] = {
      ...existingItem,
      title: this.newItem.title!.trim(),
      description: this.newItem.description!.trim(),
      price: this.newItem.price
    };

    this.updateTable();
    DialogSuccess('อัปเดตรายการสำเร็จ');
    this.resetForm();
  }
  generateCode(): string {
    const prefix = 'A';

    // ดึงเลขทั้งหมดที่มี
    const numbers = this.items
      .map(item => item.code)
      .filter(code => code) // กัน undefined
      .map(code => Number(code!.replace(prefix, '')));

    const max = numbers.length > 0 ? Math.max(...numbers) : 0;

    const next = max + 1;

    return prefix + next.toString().padStart(3, '0');
  }
  resetForm() {
    this.newItem = {
      id: 0,
      code: '',
      title: '',
      description: '',
      price: 0
    };
  }

  editItem(item: any) {
    console.log('edit:', item);

    // ตัวอย่าง: เอาค่ามาใส่ form
    this.newItem = { ...item };
  }

  removeItem(id: number): void {
    ConfirmDelete('ยืนยันการลบ', "คุณต้องการลบรายการนี้ใช่หรือไม่")
      .then(async emit => {
        if (emit) {
          this.items = this.items.filter(item => item.id !== id);
          DialogSuccess('ลบรายการสำเร็จ');
          this.updateTable(); // 👈 สำคัญ
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
  //  calculate total price of all items
  getTotalPrice(): number {
    return this.items.reduce((sum, item) => sum + (item.price || 0), 0);
  }

}
