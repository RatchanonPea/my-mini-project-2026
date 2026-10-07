import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { DialogErrorHtmlConfirm } from '../common/helper';

// Restricts a route to specific roles (route.data.roles), e.g. Users management being
// manager/admin-only. Unlike the sidebar's role filter (which just hides the menu link), this
// also blocks direct URL entry and deep-links (e.g. from a notification) from a disallowed role —
// they can still see that an edit happened, just not open the page itself.
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles = route.data?.['roles'] as string[] | undefined;
    if (!allowedRoles || !allowedRoles.length) {
      return true;
    }
    const role = this.authService.getCurrentUserRole();
    if (role && allowedRoles.includes(role)) {
      return true;
    }
    DialogErrorHtmlConfirm('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ ต้องเป็นผู้จัดการหรือแอดมินเท่านั้น', 'ไม่มีสิทธิ์เข้าถึง');
    this.router.navigate(['/main-conten-mng/dashboard']);
    return false;
  }
}
