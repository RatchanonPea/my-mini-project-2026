import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainContentMngRoutingModule } from './main-conten-mng-routing.module';
import { MainContentMngComponent } from './main-conten-mng.component';
import { MainPage } from './main-page/main-page';

@NgModule({
  declarations: [MainContentMngComponent, MainPage],
  imports: [
    CommonModule,
    MainContentMngRoutingModule
  ]
})
export class MainContenMngModule { }
