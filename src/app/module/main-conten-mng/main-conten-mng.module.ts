import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainContentMngRoutingModule } from './main-conten-mng-routing.module';
import { MainContentMngComponent } from './main-conten-mng.component';
import { Dashboard } from './dashboard/dashboard';
import { Users } from './users/users';
import { AddUserItemDialog } from './users/add-user-item-dialog/add-user-item-dialog';
import { MatInputModule } from "@angular/material/input";

@NgModule({
  declarations: [MainContentMngComponent],
  imports: [
    CommonModule,
    MainContentMngRoutingModule,
    Dashboard,
    Users,
    AddUserItemDialog,
    MatInputModule
]
})
export class MainContenMngModule { }
