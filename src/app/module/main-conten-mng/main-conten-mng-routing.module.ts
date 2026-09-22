import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Users } from './users/users';
import { Sales } from './sales/sales';
import { Expenses } from './expenses/expenses';
import { Reports } from './reports/reports';
import { MainPage } from './main-page/main-page';
import { Settings } from './settings/settings';
import { Inventory } from './inventory/inventory';
import { Purchases } from './purchases/purchases';
import { Suppliers } from './suppliers/suppliers';
import { SupplierProfile } from './suppliers/supplier-profile/supplier-profile';

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
        path: 'dashboard', data: { breadcrumb: 'Dashboard' }, component: Dashboard
      },
      {
        path: 'sales', data: { breadcrumb: 'Sales / POS' }, component: Sales
      },
      {
        path: 'expenses', data: { breadcrumb: 'Expenses' }, component: Expenses
      },
      {
        path: 'inventory', data: { breadcrumb: 'Inventory' }, component: Inventory
      },
      {
        path: 'purchases', data: { breadcrumb: 'สั่งซื้อไก่' }, component: Purchases
      },
      {
        path: 'suppliers', data: { breadcrumb: 'ผู้ขาย/ร้านที่สั่ง' }, component: Suppliers
      },
      {
        path: 'suppliers/:id', data: { breadcrumb: 'โปรไฟล์ร้านค้า' }, component: SupplierProfile
      },
      {
        path: 'reports', data: { breadcrumb: 'Reports' }, component: Reports
      },
      {
        path: 'products', data: { breadcrumb: 'ข้อมูลสินค้า' }, component: MainPage
      },
      {
        path: 'settings', data: { breadcrumb: 'ตั้งค่า' }, component: Settings
      },
      {
        path: 'users', data: { breadcrumb: 'ข้อมูลพนักงาน' }, component: Users
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainContentMngRoutingModule { }
