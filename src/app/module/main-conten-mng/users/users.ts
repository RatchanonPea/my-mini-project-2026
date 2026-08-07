import { Component, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddUserItemDialog } from './add-user-item-dialog/add-user-item-dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ConfirmDialog, DialogSuccess, DialogErrorHtmlConfirm } from '../../../common/helper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService, CreateUserPayload, UpdateUserPayload, User } from '../../../services/api';
import { AuthService } from '../../../services/auth';


interface GridItem {
  id: number;
  code?: string;
  username: string;
  // fullname : string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  role_id?: number;
  date: Date;
  status: string;
  // 🔥 audit fields
  createdBy: string,
  createdDate: Date,

  updatedBy: string,
  updatedDate: Date
}

@Component({
  selector: 'app-users',
  imports: [MatPaginatorModule, MatTableModule, CommonModule, MatButtonModule, MatIconModule, MatChipsModule, MatDialogModule],
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

  items: GridItem[] = [];
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
    'updatedBy',
    'updatedDate',
    'date',
    'status',
    'action'
  ];
  totalItems: any = 0;

  constructor(
    private dialog: MatDialog,
    private apiService: ApiService,
    private authService: AuthService,
  ) {}
  ngOnInit() {
    this.loadUsers();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  // Parse SQL style datetime "YYYY-MM-DD HH:mm:ss" into local Date
  // to avoid incorrect timezone shifts when using `new Date(string)` directly.
  private parseSqlDatetimeToLocal(value?: string): Date {
    if (!value) return new Date();

    // Match YYYY-MM-DD HH:mm[:ss]
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]) - 1;
      const day = Number(m[3]);
      const hour = Number(m[4]);
      const minute = Number(m[5]);
      const second = Number(m[6] ?? '0');
      return new Date(year, month, day, hour, minute, second);
    }

    // Fallback to Date constructor for ISO strings with timezone info
    return new Date(value);
  }

  loadUsers(): void {
    this.apiService.getUsers().subscribe({
      next: (response) => {
        console.log('Users API response:', response);
        const users = response.data ?? [];
        console.log('Users array length:', users.length);
        this.items = users.map((user) => this.toGridItem(user));
        this.dataSource.data = this.items;
        this.totalItems = this.items.length;
      },
      error: (error) => console.error('Error fetching users:', error),
    });
  }

  private toGridItem(user: User): GridItem {
    const firstName = user.first_name ?? '';
    const lastName = user.last_name ?? '';

    return {
      id: user.user_id,
      code: user.code ?? `U${user.user_id.toString().padStart(3, '0')}`,
      username: user.username,
      firstName,
      lastName,
      email: user.email ?? '',
      phone: user.phone ?? '',
      role: user.role_name ?? this.mapRoleId(user.role_id),
      role_id: user.role_id,
      date: user.created_at ? this.parseSqlDatetimeToLocal(user.created_at) : new Date(),
      status: user.status === false || user.status === 0 || user.status === '0' ? 'inactived' : 'active',
      createdBy: user.created_by ?? '',
      createdDate: user.created_at ? this.parseSqlDatetimeToLocal(user.created_at) : new Date(),
      updatedBy: user.updated_by ?? this.authService.getCurrentUser() ?? '',
      updatedDate: user.updated_at ? this.parseSqlDatetimeToLocal(user.updated_at) : new Date(),
    };
  }

  private mapRoleId(roleId?: number): string {
    // กำหนดให้ตรงกับ role_id ที่ backend ส่งกลับ
    if (roleId === 1) {
      return 'manager';
    }
    if (roleId === 2) {
      return 'admin';
    }
    if (roleId === 3) {
      return 'staff';
    }
    return 'user';
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

    const users = ['system', 'admin01', 'manager01']; // 🔥 คนที่ create/update

    return Array.from({ length: count }, (_, i) => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

      const createdAt = this.randomDate(); // 🔥 สุ่มเวลา
      const updatedAt = new Date(createdAt.getTime() + Math.random() * 1000000000);

      return {
        id: i + 1,
        code: 'U' + (i + 1).toString().padStart(3, '0'),
        username: `user${i + 1}`,

        firstName,
        lastName,

        email: `user${i + 1}@example.com`,
        password: this.generatePassword(),

        role: roles[Math.floor(Math.random() * roles.length)],
        date : new Date(),
        status: statuses[Math.floor(Math.random() * statuses.length)],

        // 🔥 audit fields
        createdBy: users[Math.floor(Math.random() * users.length)],
        createdDate: createdAt,

        updatedBy: users[Math.floor(Math.random() * users.length)],
        updatedDate: updatedAt
      };
    });
  }
  randomDate(): Date {
    const start = new Date(2023, 0, 1).getTime();
    const end = new Date().getTime();

    return new Date(start + Math.random() * (end - start));
  }
  generatePassword(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    return Array.from({ length }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddUserItemDialog, {
      width: '600px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const fullName = [result.firstName, result.lastName].filter(Boolean).join(' ');
        const currentUser = this.authService.getCurrentUser() ?? undefined;
        const payload: CreateUserPayload = {
          username: result.username,
          first_name: result.firstName,
          last_name: result.lastName,
          password_hash: result.password,
          email: result.email,
          phone: result.phone,
          status: result.status === 'active' ? 1 : 0,
          created_by: currentUser,
          updated_by: currentUser,
        };

        if (result.role_id != null) {
          payload.role_id = result.role_id;
        }

        this.apiService.createUser(payload).subscribe({
          next: () => {
            this.loadUsers();
            DialogSuccess('สร้างผู้ใช้ใหม่เรียบร้อยแล้ว', 'สร้างสำเร็จ');
          },
          error: (error) => {
            console.error('Error creating user:', error);
            DialogErrorHtmlConfirm('ไม่สามารถสร้างผู้ใช้ได้ โปรดลองอีกครั้ง');
          },
        });
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
    const dialogData = {
      ...item,
      // dialog expects `updatedAt`/`createdAt` names; map from grid fields
      updatedAt: item.updatedDate,
      createdAt: item.createdDate,
      date: item.date,
    };

    const dialogRef = this.dialog.open(AddUserItemDialog, {
      width: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload: UpdateUserPayload = {
          user_id: result.id,
          code: result.code,
          username: result.username,
          first_name: result.firstName,
          last_name: result.lastName,
          email: result.email,
          phone: result.phone,
          role_id: result.role_id ?? undefined,
          status: result.status === 'active' ? 1 : 0,
          updated_by: this.authService.getCurrentUser() ?? undefined,
        };

        if (result.password) {
          payload.password_hash = result.password;
        }

        this.apiService.updateUser(payload).subscribe({
          next: () => {
            this.loadUsers();
            DialogSuccess('แก้ไขข้อมูลผู้ใช้สำเร็จแล้ว', 'อัปเดตสำเร็จ');
          },
          error: (error) => {
            console.error('Error updating user:', error);
            DialogErrorHtmlConfirm('ไม่สามารถอัปเดตผู้ใช้ได้ โปรดลองอีกครั้ง');
          },
        });
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

