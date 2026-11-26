import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

const ENTER_DELAY_MS = 2600;
const REMEMBERED_USER_KEY = 'rememberedUsername';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent implements OnInit, OnDestroy {
  datalogin: { username?: string; password?: string } = {};
  hidePassword = true;
  errorMessage = '';
  isSubmitting = false;
  isEntering = false;
  rememberMe = false;
  welcomeName = '';
  readonly enterDelayMs = ENTER_DELAY_MS;

  private enterTimer?: ReturnType<typeof setTimeout>;

  constructor(private router: Router, private authService: AuthService) {}

  // only the username is remembered, never the password
  ngOnInit() {
    try {
      const saved = localStorage.getItem(REMEMBERED_USER_KEY);
      if (saved) {
        this.datalogin.username = saved;
        this.rememberMe = true;
      }
    } catch {
      // storage blocked: just start with an empty form
    }
  }

  login() {
    if (this.isSubmitting || this.isEntering) return;

    if (!this.datalogin.username || !this.datalogin.password) {
      this.errorMessage = 'กรุณากรอก username และ password ให้ครบ';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.datalogin.username, this.datalogin.password).subscribe((success) => {
      this.isSubmitting = false;
      if (success) {
        this.saveRememberedUser();
        this.welcomeName = this.authService.getCurrentUser() ?? this.datalogin.username ?? '';
        this.isEntering = true;
        this.enterTimer = setTimeout(
          () => this.router.navigate(['/main-conten-mng/dashboard']),
          ENTER_DELAY_MS
        );
      } else {
        this.errorMessage = 'Username หรือ Password ไม่ถูกต้อง';
      }
    });
  }

  private saveRememberedUser() {
    try {
      if (this.rememberMe && this.datalogin.username) {
        localStorage.setItem(REMEMBERED_USER_KEY, this.datalogin.username);
      } else {
        localStorage.removeItem(REMEMBERED_USER_KEY);
      }
    } catch {
      // storage blocked: nothing to remember
    }
  }

  ngOnDestroy() {
    clearTimeout(this.enterTimer);
  }
}
