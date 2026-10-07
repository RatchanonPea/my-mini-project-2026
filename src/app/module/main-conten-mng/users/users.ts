import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialog } from '../../../common/helper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService, User } from '../../../services/api';
import { Pager } from '../../../shared/pager/pager';
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
  imports: [Pager, MatPaginatorModule, MatTableModule, CommonModule, FormsModule, MatButtonModule, MatIconModule, MatChipsModule, MatInputModule, MatFormFieldModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  clickedRows = new Set<GridItem>();

  pageEvent: any;
  pageIndex = 0;
  pageSize = 10;
  dataSource = new MatTableDataSource<GridItem>([]);
  searchText = '';

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
    private router: Router,
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
        this.dataSource.filterPredicate = (data, filter) => {
          const haystack = [
            data.id,
            data.code ?? '',
            data.username ?? '',
            data.firstName ?? '',
            data.lastName ?? '',
            data.email ?? '',
            data.role ?? '',
            data.status ?? '',
            data.updatedBy ?? ''
          ].join(' ').toLowerCase();
          return haystack.includes(filter);
        };
        this.applySearch();
        this.totalItems = this.items.length;
      },
      error: (error) => console.error('Error fetching users:', error),
    });
  }

  applySearch(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
    this.pageIndex = 0;
    this.totalItems = this.dataSource.filteredData.length;
  }

  clearSearch(): void {
    this.searchText = '';
    this.applySearch();
  }

  private toGridItem(user: User): GridItem {
    const firstName =
      user.first_name ??
      user.first_name_th ??
      user.first_name_en ??
      (user.full_name_th ? user.full_name_th.split(' ')[0] ?? '' : '') ??
      '';

    const lastName =
      user.last_name ??
      user.last_name_th ??
      user.last_name_en ??
      (user.full_name_th ? user.full_name_th.split(' ').slice(1).join(' ') ?? '' : '') ??
      '' ;

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
      createdBy: '',
      createdDate: user.created_at ? this.parseSqlDatetimeToLocal(user.created_at) : new Date(),
      updatedBy: user.updated_by_name ?? '',
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

  openAddDialog(): void {
    this.router.navigate(['/main-conten-mng/users/new']);
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

  editItem(item: GridItem): void {
    this.router.navigate(['/main-conten-mng/users', item.id]);
  }

  removeItem(id: number): void {
    ConfirmDialog('ยืนยันการลบ', "คุณต้องการลบรายการนี้ใช่หรือไม่")
      .then(async emit => {
        if (emit) {
          this.dataSource.data = this.dataSource.data.filter(item => item.id !== id);
          this.items = this.items.filter(item => item.id !== id);
          this.applySearch();
          this.totalItems = this.dataSource.filteredData.length;
        }
      });
  }

  goToPage(index: number): void {
    this.paginator.pageIndex = index;
    this.paginator.page.emit({
      pageIndex: index,
      previousPageIndex: this.pageIndex,
      pageSize: this.paginator.pageSize,
      length: this.paginator.length,
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

