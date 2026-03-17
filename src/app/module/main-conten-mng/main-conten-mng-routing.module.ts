import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPage } from './main-page/main-page';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Main Content' },
    children: [
      {
        path: 'main-page', data: { breadcrumb: 'Main Page' }, component: MainPage
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainContentMngRoutingModule { }
