import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainContentMngComponent } from '../app/module/main-conten-mng/main-conten-mng.component';

const routes: Routes = [
  // เพิ่มเส้นทางของคุณที่นี่ เช่น
  // { path: 'home', component: HomeComponent },
   {
    path: "",
    redirectTo: "/auth/login",
    pathMatch: "full",
  },
  {
    path: "main-conten-mng",
    data: { breadcrumb: "Main Content Management" },
    component: MainContentMngComponent,
    // canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
