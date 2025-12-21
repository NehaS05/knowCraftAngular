import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { SettingsComponent } from './settings.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingService } from '../../core/services/loading.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '1234567890',
    roleName: 'Admin',
    roleId: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'changePassword']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUserById']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['show', 'hide'], {
      loading$: of(false)
    });

    await TestBed.configureTestingModule({
      declarations: [SettingsComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockLoadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with disabled profile form fields', () => {
    expect(component.profileForm.get('username')?.disabled).toBeTruthy();
    expect(component.profileForm.get('email')?.disabled).toBeTruthy();
  });

  it('should load user profile on init', () => {
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockUserService.getUserById.and.returnValue(of(mockUser));

    component.ngOnInit();

    expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
    expect(component.profileForm.get('username')?.value).toBe('testuser');
    expect(component.profileForm.get('email')?.value).toBe('test@example.com');
  });

  it('should handle successful password change', () => {
    component.securityForm.patchValue({
      currentPassword: 'oldpass',
      newPassword: 'newpass123'
    });
    mockAuthService.changePassword.and.returnValue(of({}));

    component.updatePassword();

    expect(mockAuthService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'oldpass',
      newPassword: 'newpass123'
    });
    expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Password updated successfully');
    expect(component.securityForm.pristine).toBeTruthy();
  });

  it('should handle password change error', () => {
    component.securityForm.patchValue({
      currentPassword: 'oldpass',
      newPassword: 'newpass123'
    });
    mockAuthService.changePassword.and.returnValue(throwError(() => new Error('Invalid password')));

    component.updatePassword();

    expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Invalid password');
  });

  it('should validate form before password change', () => {
    component.securityForm.patchValue({
      currentPassword: '',
      newPassword: 'short'
    });

    component.updatePassword();

    expect(mockToastService.warning).toHaveBeenCalledWith('Validation Error', 'Please fill in all required fields');
    expect(mockAuthService.changePassword).not.toHaveBeenCalled();
  });
});