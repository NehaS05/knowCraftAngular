import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginCredentials {
  username: string;
  password: string;
  accountType: 'client' | 'internal';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router) {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(credentials: LoginCredentials): Observable<boolean> {
    // Demo login - accept any credentials
    if (credentials.username && credentials.password) {
      localStorage.setItem('authToken', 'demo-token');
      localStorage.setItem('userType', credentials.accountType);
      this.isAuthenticatedSubject.next(true);
      return of(true);
    }
    return of(false);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }
}