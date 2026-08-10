import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastSuccess } from '../../common/helper';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent {
  datalogin: { username?: string; password?: string } = {};
  hidePassword = true;
  errorMessage = '';
  isSubmitting = false;

  constructor(private router: Router, private authService: AuthService) {}

  login() {
    if (!this.datalogin.username || !this.datalogin.password) {
      this.errorMessage = 'กรุณากรอก username และ password ให้ครบ';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.datalogin.username, this.datalogin.password).subscribe((success) => {
      this.isSubmitting = false;
      if (success) {
        const welcomeName = this.authService.getCurrentUser() ?? this.datalogin.username;
        ToastSuccess('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${welcomeName}`);
        this.router.navigate(['/main-conten-mng/dashboard']);
      } else {
        this.errorMessage = 'Username หรือ Password ไม่ถูกต้อง';
      }
    });
  }
}
