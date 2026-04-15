import { Component, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatDialog } from '@angular/material/dialog';
import { AddUserItemDialog } from './add-user-item-dialog/add-user-item-dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ConfirmDialog } from '../../../common/helper';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";
import { MatIconModule } from '@angular/material/icon';
import { MatChip } from '@angular/material/chips';
import { MatChipsModule } from '@angular/material/chips';


interface GridItem {
  id: number;
  code?: string;
  username: string;
  // fullname : string;
  firstName: string;
  lastName: string;

  email?: string;
  role: string;
  status: string;
}

@Component({
  selector: 'app-users',
  imports: [MatPaginatorModule, MatTableModule, CommonModule, MatButtonModule, MatIcon, MatChipsModule, MatIconModule, MatChip],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  clickedRows = new Set<GridItem>();

  pageEvent: any;
  pageIndex = 0;
  pageSize = 5;
  dataSource = new MatTableDataSource<GridItem>([]);

  items : GridItem[] = this.generateMockData(20);
  // items: GridItem[] = [
  //   {
  //     id: 1,
  //     code: 'U001',
  //     username: 'admin01',
  //     fullname: 'สมชาย ใจดี',
  //     firstName: 'สมชาย',
  //     lastName: 'ใจดี',
  //     email: 'somchai@example.com',
  //     role: 'admin',
  //     status: 'active'
  //   },
  //   {
  //     id: 2,
  //     code: 'U002',
  //     username: 'user02',
  //     // fullname: 'สมหญิง รักดี',
  //     firstName: 'สมหญิง',
  //     lastName: 'รักดี',
  //     email: 'somying@example.com',
  //     role: 'user',
  //     status: 'active'
  //   },
  //   {
  //     id: 3,
  //     code: 'U003',
  //     username: 'manager01',
  //     // fullname: 'ประยุทธ์ เก่งงาน',
  //     firstName: 'ประยุทธ์',
  //     lastName: 'เก่งงาน',
  //     email: 'manager@example.com',
  //     role: 'manager',
  //     status: 'inactive'
  //   },
  //   {
  //     id: 4,
  //     code: 'U004',
  //     username: 'staff01',
  //     // fullname: 'กิตติพงษ์ ทำดี',
  //     firstName: 'กิตติพงษ์',
  //     lastName: 'ทำดี',
  //     email: 'kitti@example.com',
  //     role: 'user',
  //     status: 'active'
  //   },
  //   {
  //     id: 5,
  //     code: 'U005',
  //     username: 'guest01',
  //     // fullname: 'ทดสอบ ระบบ',
  //     firstName: 'ทดสอบ',
  //     lastName: 'ระบบ',
  //     email: 'guest@example.com',
  //     role: 'guest',
  //     status: 'inactive'
  //   }
  // ];
  // displayedColumns = ['No', 'id', 'code', 'title', 'description', 'price', 'action'];
  displayedColumns = [
    'No',
    'id',
    'code',
    'username',
    'fullname',
    'email',
    'role',
    'status',
    'action'
  ];
  totalItems: any = 0;

  constructor(
    private dialog: MatDialog,
  ) {
    this.dataSource.data = this.items;
  }
  ngOnInit() {
    this.items = this.generateMockData(20);
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

 generateMockData(count: number): GridItem[] {
  const roles = ['admin', 'user', 'manager'];
  const statuses = ['active', 'inactived'];

  const firstNames = [
    'สมชาย', 'สมหญิง', 'กิตติ', 'ณัฐ', 'วิชัย',
    'อนันต์', 'พงษ์ศักดิ์', 'ศิริพร', 'สุดา', 'นภา'
  ];

  const lastNames = [
    'ใจดี', 'รักดี', 'ทองสุข', 'มีชัย', 'เจริญสุข',
    'บุญมี', 'ศรีสุข', 'แซ่ลิ้ม', 'ตั้งใจ', 'รุ่งเรือง'
  ];

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return {
      id: i + 1,
      code: 'U' + (i + 1).toString().padStart(3, '0'),
      username: `user${i + 1}`,

      firstName,
      lastName,

      email: `${firstName}.${lastName}${i + 1}@example.com`,

      role: roles[Math.floor(Math.random() * roles.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    };
  });
}

  openAddDialog() {
    const dialogRef = this.dialog.open(AddUserItemDialog, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // เพิ่มข้อมูลเข้า table
        result.code = this.generateCode();
        // 🔥 set audit
        result.createdBy = 'admin'; // หรือเอาจาก login user
        result.createdAt = new Date();
        this.dataSource.data = [...this.dataSource.data, result];
        this.totalItems++;
      }
    });
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

  editItem(item: any) {
    const dialogRef = this.dialog.open(AddUserItemDialog, {
      width: '400px',
      data: item
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {

        const index = this.dataSource.data.findIndex(x => x.id === result.id);

        if (index !== -1) {
          result.updatedBy = 'admin'; // 🔥 ใครแก้
          result.updatedAt = new Date();

          const updatedData = [...this.dataSource.data];
          updatedData[index] = result;

          this.dataSource.data = updatedData;
        }
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

