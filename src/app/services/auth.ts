import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  private currentUserSubject = new BehaviorSubject<string | null>(this.getCurrentUser());

  constructor(private router: Router) {}

  login(username: string, password: string): boolean {
    if (username === 'Pea01' && password === '1234') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', username);
      this.isLoggedInSubject.next(true);
      this.currentUserSubject.next(username);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('isLoggedIn');
  }

  getCurrentUser(): string | null {
    return localStorage.getItem('currentUser');
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  get currentUser$(): Observable<string | null> {
    return this.currentUserSubject.asObservable();
  }
}
