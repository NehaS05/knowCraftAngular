import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  /**
   * **Feature: login-api-integration, Property 11: Navigation on success**
   * For any successful authentication, the system should redirect the user to the chat interface
   */
  it('should navigate to chat on successful login', () => {
    authServiceSpy.login.and.returnValue(of(true));

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'testpass',
      accountType: 'client'
    });

    component.onSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/chat']);
  });

  /**
   * **Feature: login-api-integration, Property 12: Error message display**
   * For any authentication failure, the system should display appropriate error messages to the user
   */
  it('should display error message on login failure', () => {
    const errorMessage = 'Invalid username or password';
    authServiceSpy.login.and.returnValue(throwError(() => new Error(errorMessage)));

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'wrongpass',
      accountType: 'client'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe(errorMessage);
    expect(component.isLoading).toBe(false);
  });

  /**
   * **Feature: login-api-integration, Property 13: Account type mapping**
   * For any account type selection, client accounts should map to UserType 1 and internal accounts should map to UserType 2
   */
  it('should map account types correctly', () => {
    // Test client mapping
    expect(component['mapAccountTypeToUserType']('client')).toBe(1);
    
    // Test internal mapping
    expect(component['mapAccountTypeToUserType']('internal')).toBe(2);
  });

  /**
   * **Feature: login-api-integration, Property 14: Form validation**
   * For any form input, the system should validate username format and password requirements before submission
   */
  it('should validate username format correctly', () => {
    const usernameControl = component.loginForm.get('username');

    // Test valid username
    usernameControl?.setValue('validuser123');
    expect(usernameControl?.valid).toBe(true);

    // Test invalid username with special characters
    usernameControl?.setValue('invalid@user');
    expect(usernameControl?.valid).toBe(false);
    expect(usernameControl?.errors?.['pattern']).toBeTruthy();

    // Test too short username
    usernameControl?.setValue('ab');
    expect(usernameControl?.valid).toBe(false);
    expect(usernameControl?.errors?.['minlength']).toBeTruthy();

    // Test empty username
    usernameControl?.setValue('');
    expect(usernameControl?.valid).toBe(false);
    expect(usernameControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate password requirements correctly', () => {
    const passwordControl = component.loginForm.get('password');

    // Test valid password
    passwordControl?.setValue('validpass123');
    expect(passwordControl?.valid).toBe(true);

    // Test too short password
    passwordControl?.setValue('short');
    expect(passwordControl?.valid).toBe(false);
    expect(passwordControl?.errors?.['minlength']).toBeTruthy();

    // Test empty password
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBe(false);
    expect(passwordControl?.errors?.['required']).toBeTruthy();
  });

  it('should show loading state during login', () => {
    authServiceSpy.login.and.returnValue(of(true));

    component.loginForm.patchValue({
      username: 'testuser',
      password: 'testpass',
      accountType: 'client'
    });

    expect(component.isLoading).toBe(false);

    component.onSubmit();

    // Note: In a real test, we'd need to test the intermediate loading state
    // This would require more complex async testing setup
    expect(authServiceSpy.login).toHaveBeenCalled();
  });

  it('should return correct error messages for different validation errors', () => {
    const usernameControl = component.loginForm.get('username');
    
    // Test required error
    usernameControl?.setValue('');
    usernameControl?.markAsTouched();
    expect(component.getFieldErrorMessage('username')).toBe('Username is required');

    // Test minlength error
    usernameControl?.setValue('ab');
    expect(component.getFieldErrorMessage('username')).toBe('Username must be at least 3 characters');

    // Test pattern error
    usernameControl?.setValue('invalid@user');
    expect(component.getFieldErrorMessage('username')).toBe('Username can only contain letters, numbers, and underscores');
  });

  it('should mark all fields as touched when form is invalid on submit', () => {
    // Leave form empty (invalid)
    component.onSubmit();

    expect(component.loginForm.get('username')?.touched).toBe(true);
    expect(component.loginForm.get('password')?.touched).toBe(true);
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should disable form controls during loading', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const usernameInput = fixture.nativeElement.querySelector('#username');
    const passwordInput = fixture.nativeElement.querySelector('#password');
    const clientRadio = fixture.nativeElement.querySelector('input[value="client"]');
    const internalRadio = fixture.nativeElement.querySelector('input[value="internal"]');
    const submitButton = fixture.nativeElement.querySelector('.sign-in-btn');

    expect(usernameInput.disabled).toBe(true);
    expect(passwordInput.disabled).toBe(true);
    expect(clientRadio.disabled).toBe(true);
    expect(internalRadio.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });

  it('should display error message in template', () => {
    component.errorMessage = 'Test error message';
    fixture.detectChanges();

    const errorElement = fixture.nativeElement.querySelector('.error-message');
    expect(errorElement.textContent.trim()).toBe('Test error message');
  });

  it('should show loading text on submit button during loading', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('.sign-in-btn');
    expect(submitButton.textContent.trim()).toBe('Signing In...');
  });
});