import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'auth/login',
		pathMatch: 'full',
	},
	{
		path: 'auth',
		loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
	},
	{
		path: '',
		component: LayoutComponent,
		canActivate: [AuthGuard],
		children: [
			{
				path: 'main-conten-mng',
				loadChildren: () => import('./module/main-conten-mng/main-conten-mng.module').then(m => m.MainContenMngModule)
			}
		]
	}
];
