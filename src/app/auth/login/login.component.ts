import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent {
  datalogin: any = {};
  constructor(private router: Router) {}

  login() {
    if (this.datalogin.username === 'Pea01' && this.datalogin.password === '1234') {
      localStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/main-conten-mng/main-page']);
    } else {
      alert('Username หรือ Password ไม่ถูกต้อง');
    }
  }
}
