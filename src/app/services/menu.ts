import { Injectable } from '@angular/core';
import { Router, Routes } from '@angular/router';

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
  private menuItems: MenuItem[] = [];

  constructor(private router: Router) {
    this.generateMenuFromRoutes();
  }

  private generateMenuFromRoutes(): void {
    const routes = this.router.config;
    this.menuItems = this.processRoutes(routes);
  }

  private processRoutes(routes: Routes, parentPath = ''): MenuItem[] {
    const menuItems: MenuItem[] = [];

    routes.forEach(route => {
      if (!route.path || route.path.includes('*') || route.path === 'auth') {
        if (route.children) {
          menuItems.push(...this.processRoutes(route.children, parentPath));
        }
        return;
      }

      const fullPath = parentPath ? `${parentPath}/${route.path}` : route.path;
      const label = this.generateLabelFromPath(route.path);

      const menuItem: MenuItem = {
        path: fullPath,
        label: label,
        icon: this.getIconForPath(route.path)
      };

      if (route.children) {
        menuItem.children = this.processRoutes(route.children, fullPath);
      }

      if (route.loadChildren) {
        menuItem.children = menuItem.children || this.getLazyLoadedMenuChildren(fullPath);
      }

      menuItems.push(menuItem);
    });

    return menuItems;
  }

  private generateLabelFromPath(path: string): string {
    // แปลง path เป็น label ที่อ่านง่าย
    return path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getLazyLoadedMenuChildren(parentPath: string): MenuItem[] {
    if (parentPath === 'main-conten-mng') {
      return [
        {
          path: 'main-conten-mng/main-page',
          label: 'Main Page',
          icon: this.getIconForPath('main-page')
        },
        {
          path: 'main-conten-mng/dashboard',
          label: 'Dashboard',
          icon: this.getIconForPath('dashboard')
        },
        {
          path: 'main-conten-mng/users',
          label: 'Users',
          icon: this.getIconForPath('users')
        }
      ];
    }

    return [];
  }

  private getIconForPath(path: string): string {
    // กำหนด icon ตาม path
    const iconMap: { [key: string]: string } = {
      'main-conten-mng': 'fas fa-home',
      'dashboard': 'fas fa-tachometer-alt',
      'users': 'fas fa-users',
      'settings': 'fas fa-cog',
      'reports': 'fas fa-chart-bar'
    };

    return iconMap[path] || 'fas fa-circle';
  }

  getMenuItems(): MenuItem[] {
    return this.menuItems;
  }

  addMenuItem(item: MenuItem): void {
    this.menuItems.push(item);
  }

  removeMenuItem(path: string): void {
    this.menuItems = this.menuItems.filter(item => item.path !== path);
  }

  updateMenuFromRoutes(): void {
    this.generateMenuFromRoutes();
  }

  scanAndUpdateMenu(): void {
    // Scan ทุก routes ที่เป็น lazy loaded modules
    const routes = this.router.config;
    routes.forEach(route => {
      if (route.loadChildren) {
        // สำหรับ lazy loaded modules เราจะต้อง load และ scan routes ย่อย
        this.scanLazyLoadedRoutes(route);
      }
    });
    this.generateMenuFromRoutes();
  }

  private scanLazyLoadedRoutes(route: any): void {
    // วิธีนี้จะทำงานเมื่อ module ถูก load
    // แต่สำหรับ dynamic menu เราต้องการ scan ตอน build time หรือ runtime
    // ในกรณีนี้ เราจะใช้การ scan จาก router config ที่มีอยู่
  }
}
