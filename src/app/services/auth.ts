import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';

interface LoginResponse {
  success: boolean;
  message?: string;
  returnObject?: {
    user_id: number;
    username: string;
    full_name?: string;
    full_name_th?: string;
    full_name_en?: string;
    first_name_th?: string;
    last_name_th?: string;
    first_name_en?: string;
    last_name_en?: string;
    role?: string;
    role_name?: string;
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  private currentUserSubject = new BehaviorSubject<string | null>(this.getCurrentUser());
  private currentUserRoleSubject = new BehaviorSubject<string | null>(this.getCurrentUserRole());

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<LoginResponse>('/api/auth/login', { username, password }).pipe(
      map((response) => {
        if (response?.success && response?.returnObject) {
          const user = response.returnObject;
          const thaiName = [user.first_name_th, user.last_name_th].filter(Boolean).join(' ');
          const englishName = [user.first_name_en, user.last_name_en].filter(Boolean).join(' ');
          const displayName =
            user.full_name_th ??
            user.full_name_en ??
            user.full_name ??
            (thaiName || englishName || user.username || username);
          const role = user.role_name ?? user.role ?? '';

          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('currentUser', displayName);
          localStorage.setItem('currentUserRole', role);
          localStorage.setItem('userInfo', JSON.stringify(response.returnObject));

          this.isLoggedInSubject.next(true);
          this.currentUserSubject.next(displayName);
          this.currentUserRoleSubject.next(role);
          return true;
        }

        return false;
      }),
      catchError((error) => {
        console.error('Auth login failed', error);
        return of(false);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
    this.currentUserRoleSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('isLoggedIn');
  }

  getCurrentUser(): string | null {
    return localStorage.getItem('currentUser');
  }

  getCurrentUserRole(): string | null {
    return localStorage.getItem('currentUserRole');
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  get currentUser$(): Observable<string | null> {
    return this.currentUserSubject.asObservable();
  }

  get currentUserRole$(): Observable<string | null> {
    return this.currentUserRoleSubject.asObservable();
  }
}
