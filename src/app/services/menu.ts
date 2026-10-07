import { Injectable } from '@angular/core';

export interface MenuItem {
  path: string;
  label: string;
  icon?: string;
  children?: MenuItem[];
  expanded?: boolean;
  roles?: string[];
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
      path: 'main-conten-mng/inventory',
      label: 'Inventory',
      icon: 'fas fa-boxes-stacked'
    },
    {
      path: 'main-conten-mng/purchases',
      label: 'สั่งซื้อไก่',
      icon: 'fas fa-truck'
    },
    {
      path: 'main-conten-mng/suppliers',
      label: 'ผู้ขาย/ร้านที่สั่ง',
      icon: 'fas fa-store'
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
          icon: 'fas fa-users',
          roles: ['manager', 'admin']
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
