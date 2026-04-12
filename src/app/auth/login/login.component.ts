import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent {
  datalogin: any = {};
  constructor(private router: Router, private authService: AuthService) {}

  login() {
    console.log(this.datalogin);

    if (this.authService.login(this.datalogin.username, this.datalogin.password)) {
      this.router.navigate(['/main-conten-mng/dashboard']);
    } else {
      alert('Username หรือ Password ไม่ถูกต้อง');
    }
  }
}
