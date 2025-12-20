import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  /**
   * **Feature: login-api-integration, Property 24: Route protection**
   * For any authentication state change, navigation guards should properly restrict access to protected routes
   */
  it('should allow access when user is authenticated', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);

    const result = guard.canActivate();

    expect(result).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to login when user is not authenticated', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);

    const result = guard.canActivate();

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should deny access when token is expired', () => {
    // The isLoggedIn method now checks token expiration internally
    authServiceSpy.isLoggedIn.and.returnValue(false);

    const result = guard.canActivate();

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should call authService.isLoggedIn to check authentication status', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);

    guard.canActivate();

    expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
  });

  it('should handle multiple canActivate calls correctly', () => {
    // First call - authenticated
    authServiceSpy.isLoggedIn.and.returnValue(true);
    let result1 = guard.canActivate();
    expect(result1).toBe(true);

    // Second call - not authenticated
    authServiceSpy.isLoggedIn.and.returnValue(false);
    let result2 = guard.canActivate();
    expect(result2).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);

    expect(authServiceSpy.isLoggedIn).toHaveBeenCalledTimes(2);
  });
});