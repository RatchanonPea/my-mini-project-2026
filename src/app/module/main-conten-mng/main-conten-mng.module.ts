import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainContentMngRoutingModule } from './main-conten-mng-routing.module';
import { MainContentMngComponent } from './main-conten-mng.component';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [MainContentMngComponent],
  imports: [
    CommonModule,
    MainContentMngRoutingModule,
    MatInputModule,
    MatDialogModule
  ]
})
export class MainContenMngModule { }
