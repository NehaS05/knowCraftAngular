import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        { provide: AuthService, useValue: authSpy }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * **Feature: login-api-integration, Property 20: Automatic token inclusion**
   * For any API call, the HTTP interceptor should automatically include the JWT_Token in the Authorization header
   */
  it('should add Authorization header when token exists', () => {
    const mockToken = 'mock-jwt-token';
    authServiceSpy.getToken.and.returnValue(mockToken);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    req.flush({});
  });

  it('should not add Authorization header when token does not exist', () => {
    authServiceSpy.getToken.and.returnValue(null);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBeNull();

    req.flush({});
  });

  /**
   * **Feature: login-api-integration, Property 21: Unauthorized response handling**
   * For any API call receiving a 401 Unauthorized response, the interceptor should trigger automatic logout
   */
  it('should trigger logout on 401 Unauthorized response', () => {
    const mockToken = 'mock-jwt-token';
    authServiceSpy.getToken.and.returnValue(mockToken);

    httpClient.get('/api/test').subscribe({
      next: () => fail('Should have failed'),
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  /**
   * **Feature: login-api-integration, Property 23: Consistent error handling**
   * For any HTTP request failing due to authentication, the system should handle errors consistently
   */
  it('should handle non-401 errors without triggering logout', () => {
    const mockToken = 'mock-jwt-token';
    authServiceSpy.getToken.and.returnValue(mockToken);

    httpClient.get('/api/test').subscribe({
      next: () => fail('Should have failed'),
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
  });

  it('should pass through successful responses unchanged', () => {
    const mockToken = 'mock-jwt-token';
    const mockResponse = { data: 'test data' };
    authServiceSpy.getToken.and.returnValue(mockToken);

    httpClient.get('/api/test').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    req.flush(mockResponse);
  });

  it('should handle multiple concurrent requests with token', () => {
    const mockToken = 'mock-jwt-token';
    authServiceSpy.getToken.and.returnValue(mockToken);

    // Make multiple concurrent requests
    httpClient.get('/api/test1').subscribe();
    httpClient.get('/api/test2').subscribe();
    httpClient.post('/api/test3', {}).subscribe();

    const req1 = httpMock.expectOne('/api/test1');
    const req2 = httpMock.expectOne('/api/test2');
    const req3 = httpMock.expectOne('/api/test3');

    expect(req1.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    expect(req3.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    req1.flush({});
    req2.flush({});
    req3.flush({});
  });

  it('should handle 401 error only once per request', () => {
    const mockToken = 'expired-token';
    authServiceSpy.getToken.and.returnValue(mockToken);

    httpClient.get('/api/test').subscribe({
      next: () => fail('Should have failed'),
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
      }
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).toHaveBeenCalledTimes(1);
  });

  it('should preserve original request method and body', () => {
    const mockToken = 'mock-jwt-token';
    const requestBody = { test: 'data' };
    authServiceSpy.getToken.and.returnValue(mockToken);

    httpClient.post('/api/test', requestBody).subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(requestBody);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    req.flush({});
  });
});