import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, LoginCredentials, LoginResponse, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    userType: 'Client',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    lastLoginAt: '2023-01-01T00:00:00Z'
  };

  const mockLoginResponse: LoginResponse = {
    token: 'mock-jwt-token',
    user: mockUser
  };

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  /**
   * **Feature: login-api-integration, Property 8: Frontend API communication**
   * For any valid login form submission, the Frontend_Login_Component should send credentials to the Backend_Auth_API with correct field mapping
   */
  it('should send correct credentials to backend API', () => {
    const credentials: LoginCredentials = {
      username: 'testuser',
      password: 'testpass',
      accountType: 'client'
    };

    service.login(credentials).subscribe();

    const req = httpMock.expectOne('http://localhost:5000/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'testuser',
      password: 'testpass'
    });

    req.flush(mockLoginResponse);
  });

  /**
   * **Feature: login-api-integration, Property 9: Authentication response structure**
   * For any successful authentication, the Backend_Auth_API should return both JWT_Token and user information
   */
  it('should handle successful authentication response', () => {
    const credentials: LoginCredentials = {
      username: 'testuser',
      password: 'testpass',
      accountType: 'client'
    };

    service.login(credentials).subscribe(result => {
      expect(result).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:5000/api/auth/login');
    req.flush(mockLoginResponse);

    // Verify authentication state
    expect(service.isLoggedIn()).toBe(true);
    service.isAuthenticated$.subscribe(isAuth => {
      expect(isAuth).toBe(true);
    });
  });

  /**
   * **Feature: login-api-integration, Property 10: Local storage management**
   * For any successful authentication, the Auth_Service should store both JWT_Token and user data in localStorage
   */
  it('should store token and user data in localStorage on successful login', () => {
    const credentials: LoginCredentials = {
      username: 'testuser',
      password: 'testpass',
      accountType: 'client'
    };

    service.login(credentials).subscribe();

    const req = httpMock.expectOne('http://localhost:5000/api/auth/login');
    req.flush(mockLoginResponse);

    expect(localStorage.getItem('authToken')).toBe('mock-jwt-token');
    expect(localStorage.getItem('userData')).toBe(JSON.stringify(mockUser));
    expect(localStorage.getItem('userType')).toBe('client');
  });

  /**
   * **Feature: login-api-integration, Property 16: Logout cleanup**
   * For any logout operation, the system should clear all stored authentication data from localStorage
   */
  it('should clear all authentication data on logout', () => {
    // Setup initial state
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('userData', JSON.stringify(mockUser));
    localStorage.setItem('userType', 'client');

    service.logout();

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(localStorage.getItem('userType')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle authentication errors correctly', () => {
    const credentials: LoginCredentials = {
      username: 'testuser',
      password: 'wrongpass',
      accountType: 'client'
    };

    service.login(credentials).subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error.message).toBe('Invalid username or password');
      }
    });

    const req = httpMock.expectOne('http://localhost:5000/api/auth/login');
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should handle network errors correctly', () => {
    const credentials: LoginCredentials = {
      username: 'testuser',
      password: 'testpass',
      accountType: 'client'
    };

    service.login(credentials).subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error.message).toBe('Connection error. Please try again.');
      }
    });

    const req = httpMock.expectOne('http://localhost:5000/api/auth/login');
    req.error(new ErrorEvent('Network error'));
  });

  it('should initialize authentication state from localStorage', () => {
    localStorage.setItem('authToken', 'existing-token');
    localStorage.setItem('userData', JSON.stringify(mockUser));

    // Create new service instance to test initialization
    const newService = new AuthService(routerSpy, TestBed.inject(HttpClientTestingModule));

    newService.isAuthenticated$.subscribe(isAuth => {
      expect(isAuth).toBe(true);
    });

    newService.currentUser$.subscribe(user => {
      expect(user).toEqual(mockUser);
    });
  });

  it('should return current user from localStorage', () => {
    localStorage.setItem('userData', JSON.stringify(mockUser));

    const currentUser = service.getCurrentUser();
    expect(currentUser).toEqual(mockUser);
  });

  it('should return null when no user data in localStorage', () => {
    const currentUser = service.getCurrentUser();
    expect(currentUser).toBeNull();
  });

  it('should return token from localStorage', () => {
    localStorage.setItem('authToken', 'test-token');

    const token = service.getToken();
    expect(token).toBe('test-token');
  });

  it('should return null when no token in localStorage', () => {
    const token = service.getToken();
    expect(token).toBeNull();
  });

  /**
   * **Feature: login-api-integration, Property 17: Token expiration handling**
   * For any expired JWT_Token, the Auth_Service should detect expiration, clear the session, and redirect to login
   */
  it('should detect expired token correctly', () => {
    // Create a mock expired token (expired 1 hour ago)
    const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const expiredPayload = { exp: expiredTime, sub: '1' };
    const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;

    expect(service.isTokenExpired(expiredToken)).toBe(true);
  });

  it('should detect valid token correctly', () => {
    // Create a mock valid token (expires in 1 hour)
    const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const validPayload = { exp: futureTime, sub: '1' };
    const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;

    expect(service.isTokenExpired(validToken)).toBe(false);
  });

  /**
   * **Feature: login-api-integration, Property 18: Authentication state management**
   * For any token validation failure, the Auth_Service should update the authentication state to false
   */
  it('should clear auth data when token is expired on getToken call', () => {
    const expiredTime = Math.floor(Date.now() / 1000) - 3600;
    const expiredPayload = { exp: expiredTime, sub: '1' };
    const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;

    localStorage.setItem('authToken', expiredToken);
    localStorage.setItem('userData', JSON.stringify(mockUser));

    spyOn(window, 'alert'); // Mock alert
    const token = service.getToken();

    expect(token).toBeNull();
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  /**
   * **Feature: login-api-integration, Property 19: Session expiration notification**
   * For any automatic logout due to token expiration, the system should display a session expired message
   */
  it('should show session expired message on token expiration', () => {
    const expiredTime = Math.floor(Date.now() / 1000) - 3600;
    const expiredPayload = { exp: expiredTime, sub: '1' };
    const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;

    localStorage.setItem('authToken', expiredToken);
    spyOn(window, 'alert');

    service.getToken();

    expect(window.alert).toHaveBeenCalledWith('Your session has expired. Please log in again.');
  });

  it('should return false for isLoggedIn when token is expired', () => {
    const expiredTime = Math.floor(Date.now() / 1000) - 3600;
    const expiredPayload = { exp: expiredTime, sub: '1' };
    const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;

    localStorage.setItem('authToken', expiredToken);

    expect(service.isLoggedIn()).toBe(false);
  });

  it('should return true for isLoggedIn when token is valid', () => {
    const futureTime = Math.floor(Date.now() / 1000) + 3600;
    const validPayload = { exp: futureTime, sub: '1' };
    const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;

    localStorage.setItem('authToken', validToken);

    expect(service.isLoggedIn()).toBe(true);
  });

  it('should handle malformed tokens as expired', () => {
    const malformedToken = 'invalid.token.format';

    expect(service.isTokenExpired(malformedToken)).toBe(true);
  });

  it('should clear expired token on service initialization', () => {
    const expiredTime = Math.floor(Date.now() / 1000) - 3600;
    const expiredPayload = { exp: expiredTime, sub: '1' };
    const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;

    localStorage.setItem('authToken', expiredToken);
    localStorage.setItem('userData', JSON.stringify(mockUser));

    // Create new service instance to test initialization
    const newService = new AuthService(routerSpy, TestBed.inject(HttpClientTestingModule));

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
  });
});