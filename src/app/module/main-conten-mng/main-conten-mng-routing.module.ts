import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Users } from './users/users';
import { Sales } from './sales/sales';
import { Expenses } from './expenses/expenses';
import { Reports } from './reports/reports';
import { MainPage } from './main-page/main-page';
import { Settings } from './settings/settings';

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
