import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { MSALWrapperService } from '../services/msal.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private msalService: MSALWrapperService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token from the service
    const authToken = this.authService.getToken();
    const authMethod = this.authService.getAuthMethod();

    // Clone the request and add the authorization header if token exists
    if (authToken) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`,
          'X-Auth-Method': authMethod || 'custom'
        }
      });
    }

    // Handle the request and catch any errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized responses
        if (error.status === 401) {
          return this.handle401Error(request, next, authMethod);
        }
        
        // Handle other authentication-related errors
        if (error.status === 403) {
          console.warn('Access forbidden - insufficient permissions');
        }
        
        // Re-throw the error so it can be handled by the calling code
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler, authMethod: string | null): Observable<HttpEvent<any>> {
    // Try to refresh token based on authentication method
    if (authMethod === 'sso' && this.msalService.isLoggedIn()) {
      return from(this.refreshSSOToken()).pipe(
        switchMap((newToken) => {
          if (newToken) {
            // Retry the request with the new token
            const newRequest = request.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
                'X-Auth-Method': 'sso'
              }
            });
            return next.handle(newRequest);
          } else {
            // Token refresh failed, logout
            this.authService.logout();
            return throwError(() => new Error('Token refresh failed'));
          }
        }),
        catchError((refreshError) => {
          console.error('Token refresh failed:', refreshError);
          this.authService.logout();
          return throwError(() => refreshError);
        })
      );
    } else {
      // For custom auth or when SSO refresh is not possible, logout immediately
      this.authService.logout();
      return throwError(() => new Error('Authentication failed'));
    }
  }

  private async refreshSSOToken(): Promise<string | null> {
    try {
      // Try to acquire token silently
      const result = await this.msalService.acquireTokenSilent(['User.Read']);
      
      if (result && result.accessToken) {
        // Update the stored token
        localStorage.setItem('authToken', result.accessToken);
        return result.accessToken;
      }
      
      return null;
    } catch (error) {
      console.error('Silent token acquisition failed:', error);
      
      // If silent acquisition fails, we might need interactive authentication
      // For now, we'll return null and let the calling code handle logout
      return null;
    }
  }
}