import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'auth/login',
		pathMatch: 'full',
	},
	{
		path: 'main-conten-mng',
		loadChildren: () => import('./module/main-conten-mng/main-conten-mng.module').then(m => m.MainContenMngModule),
		canActivate: [AuthGuard]
	}
	,
	{
		path: 'auth',
		loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
	}
];
