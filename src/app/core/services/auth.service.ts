import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginCredentials {
  username: string;
  password: string;
  accountType: 'client' | 'internal';
}

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  userType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    // Check if user is already logged in and token is valid
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(JSON.parse(userData));
      this.isAuthenticatedSubject.next(true);
    } else if (token && this.isTokenExpired(token)) {
      // Token is expired, clear it
      this.clearAuthData();
    }
  }

  login(credentials: LoginCredentials): Observable<boolean> {
    const loginRequest: LoginRequest = {
      username: credentials.username,
      password: credentials.password
    };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, loginRequest)
      .pipe(
        tap(response => {
          // Store token and user data
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userData', JSON.stringify(response.user));
          localStorage.setItem('userType', credentials.accountType);
          
          // Update subjects
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }),
        map(() => true),
        catchError(this.handleError.bind(this))
      );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('authToken');
    return !!(token && !this.isTokenExpired(token));
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    const token = localStorage.getItem('authToken');
    if (token && this.isTokenExpired(token)) {
      this.handleTokenExpiration();
      return null;
    }
    return token;
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      // If we can't parse the token, consider it expired
      return true;
    }
  }

  private handleTokenExpiration(): void {
    this.clearAuthData();
    // Show session expired message
    this.showSessionExpiredMessage();
    this.router.navigate(['/login']);
  }

  private clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private showSessionExpiredMessage(): void {
    // You can implement this with a toast service, alert, or other notification method
    // For now, we'll use a simple alert
    alert('Your session has expired. Please log in again.');
  }

  private handleError(error: HttpErrorResponse): Observable<boolean> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = 'Connection error. Please try again.';
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid username or password';
          break;
        case 403:
          errorMessage = 'Access denied';
          break;
        case 404:
          errorMessage = 'Service not found';
          break;
        case 500:
          errorMessage = 'Server error. Please contact support.';
          break;
        case 0:
          errorMessage = 'Connection error. Please try again.';
          break;
        default:
          errorMessage = error.error?.message || 'An error occurred';
      }
    }
    
    console.error('Auth Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}