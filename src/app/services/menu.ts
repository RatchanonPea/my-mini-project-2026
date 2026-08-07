import { Injectable } from '@angular/core';

export interface MenuItem {
  path: string;
  label: string;
  icon?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private menuItems: MenuItem[] = [
    {
      path: 'main-conten-mng/dashboard',
      label: 'Dashboard',
      icon: 'fas fa-chart-line'
    },
    {
      path: 'main-conten-mng/sales',
      label: 'Sales / POS',
      icon: 'fas fa-cash-register'
    },
    {
      path: 'main-conten-mng/expenses',
      label: 'Expenses',
      icon: 'fas fa-money-bill-wave'
    },
    {
      path: 'main-conten-mng/reports',
      label: 'Reports',
      icon: 'fas fa-chart-bar'
    },
    {
      path: 'main-conten-mng/settings',
      label: 'ตั้งค่า',
      icon: 'fas fa-cog',
      children: [
        {
          path: 'main-conten-mng/products',
          label: 'ข้อมูลสินค้า',
          icon: 'fas fa-drumstick-bite'
        },
        {
          path: 'main-conten-mng/users',
          label: 'ข้อมูลพนักงาน',
          icon: 'fas fa-users'
        },
        {
          path: 'main-conten-mng/settings',
          label: 'ตั้งค่าร้าน',
          icon: 'fas fa-store'
        }
      ]
    }
  ];

  getMenuItems(): MenuItem[] {
    return this.menuItems;
  }

  addMenuItem(item: MenuItem): void {
    this.menuItems.push(item);
  }

  removeMenuItem(path: string): void {
    this.menuItems = this.menuItems.filter(item => item.path !== path);
  }
}
