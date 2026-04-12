import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPage } from './main-page/main-page';
import { Dashboard } from './dashboard/dashboard';
import { Users } from './users/users';

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
        path: 'main-page', data: { breadcrumb: 'Main Page' }, component: MainPage
      },
      {
        path: 'dashboard', data: { breadcrumb: 'Dashboard' }, component: Dashboard
      },
      {
        path: 'users', data: { breadcrumb: 'Users' }, component: Users
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainContentMngRoutingModule { }
