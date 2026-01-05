import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthError {
  code: string;
  message: string;
  authMethod: string;
  canFallback: boolean;
  fallbackMethod?: string;
  timestamp: Date;
  details?: any;
}

export interface LoadingState {
  isLoading: boolean;
  operation: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthErrorService {
  private errorSubject = new BehaviorSubject<AuthError | null>(null);
  public error$ = this.errorSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<LoadingState>({ isLoading: false, operation: '' });
  public loading$ = this.loadingSubject.asObservable();

  constructor() {}

  // Error Management
  setError(error: AuthError): void {
    this.errorSubject.next(error);
    console.error('Auth Error:', error);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  getCurrentError(): AuthError | null {
    return this.errorSubject.value;
  }

  // Loading State Management
  setLoading(operation: string, message?: string): void {
    this.loadingSubject.next({
      isLoading: true,
      operation,
      message
    });
  }

  clearLoading(): void {
    this.loadingSubject.next({
      isLoading: false,
      operation: ''
    });
  }

  isLoading(): boolean {
    return this.loadingSubject.value.isLoading;
  }

  // Error Creation Helpers
  createSSOError(code: string, message: string, details?: any): AuthError {
    return {
      code,
      message,
      authMethod: 'sso',
      canFallback: true,
      fallbackMethod: 'custom',
      timestamp: new Date(),
      details
    };
  }

  createCustomAuthError(code: string, message: string, details?: any): AuthError {
    return {
      code,
      message,
      authMethod: 'custom',
      canFallback: false,
      timestamp: new Date(),
      details
    };
  }

  createGeneralError(code: string, message: string, authMethod: string, details?: any): AuthError {
    return {
      code,
      message,
      authMethod,
      canFallback: false,
      timestamp: new Date(),
      details
    };
  }

  // Common Error Messages
  getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'INVALID_CREDENTIALS': 'Invalid username or password. Please try again.',
      'SSO_LOGIN_FAILED': 'Microsoft sign-in failed. Please try again or use username/password.',
      'SSO_CALLBACK_FAILED': 'Microsoft authentication callback failed. Please try again.',
      'TOKEN_EXCHANGE_FAILED': 'Failed to complete Microsoft authentication. Please try again.',
      'SSO_SERVICE_UNAVAILABLE': 'Microsoft sign-in is temporarily unavailable. Please try username/password.',
      'NETWORK_ERROR': 'Network connection error. Please check your internet connection.',
      'SESSION_EXPIRED': 'Your session has expired. Please sign in again.',
      'ACCESS_DENIED': 'Access denied. You do not have permission to access this resource.',
      'ACCOUNT_LINKING_FAILED': 'Failed to link your Microsoft account. Please contact support.',
      'INVALID_REQUEST': 'Invalid request. Please try again.',
      'SERVER_ERROR': 'Server error occurred. Please try again later or contact support.',
      'CONSENT_REQUIRED': 'Additional permissions are required. Please complete the consent process.',
      'USER_CANCELLED': 'Sign-in was cancelled. Please try again if you want to continue.',
      'POPUP_BLOCKED': 'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
      'TIMEOUT': 'The operation timed out. Please try again.',
      'CONFIGURATION_ERROR': 'Authentication configuration error. Please contact your administrator.'
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  // User-Friendly Error Handling
  handleHttpError(error: any, authMethod: string): AuthError {
    let errorCode = 'UNKNOWN_ERROR';
    let message = 'An unexpected error occurred';
    let canFallback = false;
    let fallbackMethod = '';

    if (error.error && typeof error.error === 'object') {
      // Server returned structured error
      errorCode = error.error.errorCode || 'SERVER_ERROR';
      message = error.error.message || this.getErrorMessage(errorCode);
      canFallback = error.error.canFallback || false;
      fallbackMethod = error.error.fallbackMethod || '';
    } else if (error.status) {
      // HTTP error
      switch (error.status) {
        case 0:
          errorCode = 'NETWORK_ERROR';
          message = 'Network connection error. Please check your internet connection.';
          break;
        case 401:
          errorCode = 'INVALID_CREDENTIALS';
          message = authMethod === 'sso' ? 'Microsoft authentication failed' : 'Invalid username or password';
          canFallback = authMethod === 'sso';
          fallbackMethod = authMethod === 'sso' ? 'custom' : '';
          break;
        case 403:
          errorCode = 'ACCESS_DENIED';
          message = 'Access denied. You do not have permission to access this resource.';
          break;
        case 404:
          errorCode = 'SERVICE_NOT_FOUND';
          message = 'Authentication service not found. Please contact support.';
          break;
        case 500:
          errorCode = 'SERVER_ERROR';
          message = 'Server error occurred. Please try again later.';
          break;
        case 503:
          errorCode = 'SSO_SERVICE_UNAVAILABLE';
          message = 'Authentication service is temporarily unavailable.';
          canFallback = authMethod === 'sso';
          fallbackMethod = authMethod === 'sso' ? 'custom' : '';
          break;
        default:
          errorCode = 'HTTP_ERROR';
          message = `HTTP ${error.status}: ${error.statusText || 'Unknown error'}`;
      }
    } else if (error.message) {
      // JavaScript error
      message = error.message;
      errorCode = 'CLIENT_ERROR';
    }

    return {
      code: errorCode,
      message,
      authMethod,
      canFallback,
      fallbackMethod,
      timestamp: new Date(),
      details: error
    };
  }

  // Retry Logic
  shouldRetry(error: AuthError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR',
      'SSO_SERVICE_UNAVAILABLE'
    ];
    
    return retryableCodes.includes(error.code);
  }

  getRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
  }
}