import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MSALWrapperService } from './msal.service';
import { UserPreferencesService } from './user-preferences.service';
import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';

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
  phoneNumber: string;
  roleName: string;
  roleId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // SSO Properties
  isSSOEnabled?: boolean;
  ssoProvider?: string;
  lastSSOLogin?: string;
  // Legacy properties for backward compatibility
  userType?: string;
  lastLoginAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  authMethod: 'custom' | 'sso';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SSOLoginRequest {
  authorizationCode: string;
  state: string;
  redirectUri: string;
}

export interface SSOCallbackRequest {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthErrorResponse {
  errorCode: string;
  message: string;
  authMethod: string;
  canFallback: boolean;
  fallbackMethod: string;
}

export type AuthMethod = 'custom' | 'sso' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private authMethodSubject = new BehaviorSubject<AuthMethod>(null);
  public authMethod$ = this.authMethodSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient,
    private msalService: MSALWrapperService,
    private userPreferencesService: UserPreferencesService
  ) {
    this.initializeAuthentication();
  }

  private async initializeAuthentication(): Promise<void> {
    try {
      // Initialize MSAL first
      await this.msalService.initializeMSAL();
      
      // Check for existing authentication
      await this.checkExistingAuthentication();
    } catch (error) {
      console.error('Authentication initialization failed:', error);
    }
  }

  private async checkExistingAuthentication(): Promise<void> {
    // Check for custom authentication
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    const authMethod = localStorage.getItem('authMethod') as AuthMethod;
    
    if (token && userData && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(JSON.parse(userData));
      this.isAuthenticatedSubject.next(true);
      this.authMethodSubject.next(authMethod || 'custom');
      return;
    }
    
    // Check for SSO authentication
    if (this.msalService.isLoggedIn()) {
      try {
        await this.handleSSOAuthentication();
      } catch (error) {
        console.error('SSO authentication check failed:', error);
        this.clearAuthData();
      }
    } else if (token && this.isTokenExpired(token)) {
      // Token is expired, clear it
      this.clearAuthData();
    }
  }

  // Custom Authentication Methods
  login(credentials: LoginCredentials): Observable<boolean> {
    const loginRequest: LoginRequest = {
      username: credentials.username,
      password: credentials.password
    };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, loginRequest)
      .pipe(
        tap(response => {
          this.storeAuthData(response, 'custom');
          localStorage.setItem('userType', credentials.accountType);
          
          // Record successful authentication
          this.userPreferencesService.recordAuthMethodUsage('custom', true);
          
          // Update preferred method if user wants to remember
          const preferences = this.userPreferencesService.getPreferences();
          if (preferences.rememberAuthMethod) {
            this.userPreferencesService.setPreferredAuthMethod('custom');
          }
        }),
        map(() => true),
        catchError((error) => {
          // Record failed authentication
          this.userPreferencesService.recordAuthMethodUsage('custom', false);
          return this.handleError(error);
        })
      );
  }

  // SSO Authentication Methods
  async loginSSO(): Promise<void> {
    try {
      console.log('Starting SSO login...');
      
      if (!environment.authentication.enableSSO) {
        throw new Error('SSO is not enabled');
      }

      await this.msalService.loginWithRedirect();
    } catch (error) {
      console.error('SSO login failed:', error);
      throw error;
    }
  }

  async handleSSOCallback(): Promise<boolean> {
    try {
      console.log('Handling SSO callback...');
      
      const result = await this.msalService.handleRedirectPromise();
      if (result) {
        return await this.processSSOResult(result);
      }
      
      return false;
    } catch (error) {
      console.error('SSO callback handling failed:', error);
      throw error;
    }
  }

  private async handleSSOAuthentication(): Promise<void> {
    try {
      const account = this.msalService.getActiveAccount();
      if (!account) {
        return;
      }

      // Try to get a fresh token
      const tokenResult = await this.msalService.acquireTokenSilent(['User.Read']);
      await this.processSSOResult(tokenResult);
    } catch (error) {
      console.error('SSO authentication failed:', error);
      throw error;
    }
  }

  private async processSSOResult(result: AuthenticationResult): Promise<boolean> {
    try {
      const ssoCallbackRequest: SSOCallbackRequest = {
        accessToken: result.accessToken,
        idToken: result.idToken,
        refreshToken: undefined // MSAL v3+ doesn't expose refresh tokens directly
      };

      const response = await this.http.post<LoginResponse>(
        `${this.API_URL}/auth/sso-callback`, 
        ssoCallbackRequest
      ).toPromise();

      if (response) {
        this.storeAuthData(response, 'sso');
        
        // Record successful SSO authentication
        this.userPreferencesService.recordAuthMethodUsage('sso', true);
        
        // Update preferred method if user wants to remember
        const preferences = this.userPreferencesService.getPreferences();
        if (preferences.rememberAuthMethod) {
          this.userPreferencesService.setPreferredAuthMethod('sso');
        }
        
        console.log('SSO authentication successful');
        return true;
      }

      // Record failed SSO authentication
      this.userPreferencesService.recordAuthMethodUsage('sso', false);
      return false;
    } catch (error) {
      console.error('SSO result processing failed:', error);
      this.userPreferencesService.recordAuthMethodUsage('sso', false);
      throw error;
    }
  }

  // Common Authentication Methods
  async logout(): Promise<void> {
    const authMethod = this.getAuthMethod();
    
    try {
      // Handle SSO logout
      if (authMethod === 'sso' && this.msalService.isLoggedIn()) {
        await this.msalService.logout();
      }
      
      // Clear local authentication data
      this.clearAuthData();
      
      // Navigate to login page
      this.router.navigate(['/login']);
      
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Even if SSO logout fails, clear local data and redirect
      this.clearAuthData();
      this.router.navigate(['/login']);
    }
  }

  async logoutFromAllSessions(): Promise<void> {
    const authMethod = this.getAuthMethod();
    
    try {
      if (authMethod === 'sso' && this.msalService.isLoggedIn()) {
        // For SSO, logout from Microsoft will clear all sessions
        await this.msalService.logout();
      }
      
      // Clear all local storage data
      this.clearAllAuthData();
      
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Global logout failed:', error);
      this.clearAllAuthData();
      this.router.navigate(['/login']);
    }
  }

  private clearAllAuthData(): void {
    // Clear all authentication-related data
    const keysToRemove = [
      'authToken',
      'userData', 
      'userType',
      'authMethod',
      'preferredAuthMethod',
      'ssoTokens',
      'lastAuthTime'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.authMethodSubject.next(null);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('authToken');
    const authMethod = this.getAuthMethod();
    
    if (authMethod === 'sso') {
      return this.msalService.isLoggedIn() && !!(token && !this.isTokenExpired(token));
    }
    
    return !!(token && !this.isTokenExpired(token));
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  getAuthMethod(): AuthMethod {
    return localStorage.getItem('authMethod') as AuthMethod || null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.roleName === 'Admin';
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.roleName || null;
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

  // Token Management Methods
  async refreshToken(): Promise<boolean> {
    const authMethod = this.getAuthMethod();
    
    if (authMethod === 'sso' && this.msalService.isLoggedIn()) {
      try {
        const result = await this.msalService.acquireTokenSilent(['User.Read']);
        if (result && result.accessToken) {
          // Update stored token
          localStorage.setItem('authToken', result.accessToken);
          return true;
        }
      } catch (error) {
        console.error('SSO token refresh failed:', error);
      }
    }
    
    // Custom auth doesn't support token refresh - user needs to re-login
    return false;
  }

  async ensureValidToken(): Promise<string | null> {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }
    
    if (this.isTokenExpired(token)) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.getToken();
      } else {
        this.handleTokenExpiration();
        return null;
      }
    }
    
    return token;
  }

  // Session Management Methods
  async validateSession(): Promise<boolean> {
    const authMethod = this.getAuthMethod();
    const token = this.getToken();
    
    if (!token) {
      return false;
    }
    
    if (this.isTokenExpired(token)) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        this.clearAuthData();
        return false;
      }
    }
    
    // Additional validation for SSO
    if (authMethod === 'sso') {
      return this.msalService.isLoggedIn();
    }
    
    return true;
  }

  getSessionInfo(): { authMethod: AuthMethod; user: User | null; isValid: boolean } {
    return {
      authMethod: this.getAuthMethod(),
      user: this.getCurrentUser(),
      isValid: this.isLoggedIn()
    };
  }
  async getSSOConfig(): Promise<any> {
    try {
      return await this.http.get(`${this.API_URL}/auth/sso-config`).toPromise();
    } catch (error) {
      console.error('Failed to get SSO config:', error);
      return { ssoEnabled: false };
    }
  }

  isSSOEnabled(): boolean {
    return environment.authentication.enableSSO;
  }

  isCustomAuthEnabled(): boolean {
    return environment.authentication.enableCustomAuth;
  }

  getPreferredAuthMethod(): AuthMethod {
    return this.userPreferencesService.getPreferredAuthMethod();
  }

  setPreferredAuthMethod(method: AuthMethod): void {
    this.userPreferencesService.setPreferredAuthMethod(method);
  }

  shouldAutoRedirectSSO(): boolean {
    return this.userPreferencesService.shouldAutoRedirectSSO();
  }

  shouldShowAuthMethodSelection(): boolean {
    return this.userPreferencesService.shouldShowAuthMethodSelection();
  }

  getRecommendedAuthMethod(): AuthMethod {
    return this.userPreferencesService.getRecommendedAuthMethod();
  }

  // Private Helper Methods
  private storeAuthData(response: LoginResponse, authMethod: AuthMethod): void {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('userData', JSON.stringify(response.user));
    if (authMethod) {
      localStorage.setItem('authMethod', authMethod);
    }
    
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
    this.authMethodSubject.next(authMethod);
  }

  private handleTokenExpiration(): void {
    this.clearAuthData();
    this.showSessionExpiredMessage();
    this.router.navigate(['/login']);
  }

  private clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    localStorage.removeItem('authMethod');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.authMethodSubject.next(null);
  }

  private showSessionExpiredMessage(): void {
    // You can implement this with a toast service, alert, or other notification method
    alert('Your session has expired. Please log in again.');
  }

  private handleError(error: HttpErrorResponse): Observable<boolean> {
    let errorMessage = 'An error occurred';
    let canFallback = false;
    let fallbackMethod = '';
    
    // Check if this is an SSO error that can fallback to custom auth
    if (error.error && typeof error.error === 'object' && 'canFallback' in error.error) {
      const authError = error.error as AuthErrorResponse;
      errorMessage = authError.message;
      canFallback = authError.canFallback;
      fallbackMethod = authError.fallbackMethod;
    } else if (error.error instanceof ErrorEvent) {
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
    
    const authError = new Error(errorMessage) as any;
    authError.canFallback = canFallback;
    authError.fallbackMethod = fallbackMethod;
    
    return throwError(() => authError);
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    const authMethod = this.getAuthMethod();
    
    if (authMethod === 'sso') {
      return throwError(() => new Error('SSO users cannot change password. Please use your organization\'s password management system.'));
    }

    return this.http.post(`${this.API_URL}/auth/change-password`, request)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          let errorMessage = 'Failed to change password';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Current password is incorrect or you are not authenticated';
          } else if (error.status === 400) {
            errorMessage = 'Invalid password format or request data';
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}