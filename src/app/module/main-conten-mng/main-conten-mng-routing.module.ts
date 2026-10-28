import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../../auth/role.guard';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Main Content' },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard', data: { breadcrumb: 'Dashboard' }, loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'sales', data: { breadcrumb: 'Sales / POS' }, loadComponent: () => import('./sales/sales').then(m => m.Sales)
      },
      {
        path: 'expenses', data: { breadcrumb: 'Expenses' }, loadComponent: () => import('./expenses/expenses').then(m => m.Expenses)
      },
      {
        path: 'inventory', data: { breadcrumb: 'Inventory' }, loadComponent: () => import('./inventory/inventory').then(m => m.Inventory)
      },
      {
        path: 'purchases', data: { breadcrumb: 'สั่งซื้อไก่' }, loadComponent: () => import('./purchases/purchases').then(m => m.Purchases)
      },
      {
        path: 'suppliers', data: { breadcrumb: 'ผู้ขาย/ร้านที่สั่ง' }, loadComponent: () => import('./suppliers/suppliers').then(m => m.Suppliers)
      },
      {
        path: 'suppliers/:id', data: { breadcrumb: 'โปรไฟล์ร้านค้า' }, loadComponent: () => import('./suppliers/supplier-profile/supplier-profile').then(m => m.SupplierProfile)
      },
      {
        path: 'reports', data: { breadcrumb: 'Reports' }, loadComponent: () => import('./reports/reports').then(m => m.Reports)
      },
      {
        path: 'products', data: { breadcrumb: 'ข้อมูลสินค้า' }, loadComponent: () => import('./main-page/main-page').then(m => m.MainPage)
      },
      {
        path: 'settings', data: { breadcrumb: 'ตั้งค่า' }, loadComponent: () => import('./settings/settings').then(m => m.Settings)
      },
      {
        path: 'users', data: { breadcrumb: 'ข้อมูลพนักงาน', roles: ['manager', 'admin'] }, loadComponent: () => import('./users/users').then(m => m.Users), canActivate: [RoleGuard]
      },
      {
        path: 'users/new', data: { breadcrumb: 'เพิ่มผู้ใช้', roles: ['manager', 'admin'] }, loadComponent: () => import('./users/user-profile/user-profile').then(m => m.UserProfile), canActivate: [RoleGuard]
      },
      {
        path: 'users/:id', data: { breadcrumb: 'โปรไฟล์ผู้ใช้', roles: ['manager', 'admin'] }, loadComponent: () => import('./users/user-profile/user-profile').then(m => m.UserProfile), canActivate: [RoleGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainContentMngRoutingModule { }
