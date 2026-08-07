import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { Subscription } from 'rxjs';
import { ConfirmDialog } from '../../common/helper';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnInit, OnDestroy {
  currentUser: string | null = null;
  currentUserRole: string | null = null;
  isDropdownOpen = false;
  private subscription: Subscription = new Subscription();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
    this.subscription.add(
      this.authService.currentUserRole$.subscribe(role => {
        this.currentUserRole = role;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
     ConfirmDialog('ยืนยันการออกจากระบบ',"คุณต้องการออกจากระบบใช่หรือไม่")
        .then(async emit => {
          if (emit) {
            this.authService.logout();
          }
        });
  }
}
