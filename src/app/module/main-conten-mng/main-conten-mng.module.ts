import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainContentMngRoutingModule } from './main-conten-mng-routing.module';
import { MainContentMngComponent } from './main-conten-mng.component';
import { Dashboard } from './dashboard/dashboard';
import { Users } from './users/users';
import { Sales } from './sales/sales';
import { Expenses } from './expenses/expenses';
import { Reports } from './reports/reports';
import { MainPage } from './main-page/main-page';
import { Settings } from './settings/settings';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [MainContentMngComponent],
  imports: [
    CommonModule,
    MainContentMngRoutingModule,
    Dashboard,
    Users,
    Sales,
    Expenses,
    Reports,
    MainPage,
    Settings,
    MatInputModule,
    MatDialogModule
  ]
})
export class MainContenMngModule { }
