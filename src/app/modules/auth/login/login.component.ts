import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, AuthMethod } from '../../../core/services/auth.service';
import { AuthErrorService, AuthError, LoadingState } from '../../../core/services/auth-error.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  currentView: 'options' | 'custom' | 'sso-callback' = 'options';
  selectedAuthMethod: AuthMethod = null;
  currentError: AuthError | null = null;
  loadingState: LoadingState = { isLoading: false, operation: '' };
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public authErrorService: AuthErrorService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_]+$/) // Allow alphanumeric and underscore
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      accountType: ['client', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    // Subscribe to error and loading states
    this.authErrorService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.currentError = error;
        this.errorMessage = error?.message || '';
      });

    this.authErrorService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loadingState = loading;
        this.isLoading = loading.isLoading;
      });

    // Check if this is an SSO callback
    const isCallback = this.route.snapshot.url.some(segment => segment.path === 'callback');
    
    if (isCallback) {
      this.currentView = 'sso-callback';
      await this.handleSSOCallback();
      return;
    }

    // Check if user is already authenticated
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/chat']);
      return;
    }

    // Determine initial view based on available auth methods
    await this.determineInitialView();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.authErrorService.clearError();
    this.authErrorService.clearLoading();
  }

  private async determineInitialView(): Promise<void> {
    try {
      this.authErrorService.setLoading('initialization', 'Checking available authentication methods...');
      
      const ssoConfig = await this.authService.getSSOConfig();
      const customEnabled = this.authService.isCustomAuthEnabled();
      const ssoEnabled = ssoConfig.ssoEnabled && this.authService.isSSOEnabled();

      if (!customEnabled && !ssoEnabled) {
        const error = this.authErrorService.createGeneralError(
          'CONFIGURATION_ERROR',
          'No authentication methods are available. Please contact your administrator.',
          'none'
        );
        this.authErrorService.setError(error);
        return;
      }

      if (customEnabled && ssoEnabled) {
        // Multiple options available, show options screen
        this.currentView = 'options';
      } else if (customEnabled) {
        // Only custom auth available
        this.currentView = 'custom';
        this.selectedAuthMethod = 'custom';
      } else if (ssoEnabled) {
        // Only SSO available, redirect immediately
        this.selectedAuthMethod = 'sso';
        await this.authService.loginSSO();
      }
    } catch (error) {
      console.error('Failed to determine auth methods:', error);
      const authError = this.authErrorService.handleHttpError(error, 'initialization');
      this.authErrorService.setError(authError);
      
      // Fallback to custom auth
      this.currentView = 'custom';
      this.selectedAuthMethod = 'custom';
    } finally {
      this.authErrorService.clearLoading();
    }
  }

  onAuthMethodSelected(method: AuthMethod): void {
    this.selectedAuthMethod = method;
    this.authErrorService.clearError();
    
    if (method === 'custom') {
      this.currentView = 'custom';
    }
    // SSO is handled directly in LoginOptionsComponent
  }

  showLoginOptions(): void {
    this.currentView = 'options';
    this.selectedAuthMethod = null;
    this.authErrorService.clearError();
  }

  clearError(): void {
    this.authErrorService.clearError();
  }

  retryOperation(): void {
    this.authErrorService.clearError();
    
    if (this.currentError?.authMethod === 'sso') {
      this.authService.loginSSO().catch(error => {
        const authError = this.authErrorService.handleHttpError(error, 'sso');
        this.authErrorService.setError(authError);
      });
    } else {
      // For custom auth, user needs to resubmit the form
      this.currentView = 'custom';
    }
  }

  fallbackToCustomAuth(): void {
    this.authErrorService.clearError();
    this.currentView = 'custom';
    this.selectedAuthMethod = 'custom';
  }

  private async handleSSOCallback(): Promise<void> {
    try {
      this.authErrorService.setLoading('sso-callback', 'Completing Microsoft sign-in...');
      
      const success = await this.authService.handleSSOCallback();
      
      if (success) {
        this.router.navigate(['/chat']);
      } else {
        const error = this.authErrorService.createSSOError(
          'SSO_CALLBACK_FAILED',
          'Microsoft authentication failed. Please try again.'
        );
        this.authErrorService.setError(error);
        this.currentView = 'options';
      }
    } catch (error) {
      console.error('SSO callback failed:', error);
      const authError = this.authErrorService.handleHttpError(error, 'sso');
      this.authErrorService.setError(authError);
      this.currentView = 'options';
    } finally {
      this.authErrorService.clearLoading();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return 'Username can only contain letters, numbers, and underscores';
      }
    }
    return '';
  }

  private mapAccountTypeToUserType(accountType: string): number {
    // Map client/internal to integer values as expected by backend
    return accountType === 'client' ? 1 : 2;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authErrorService.setLoading('custom-login', 'Signing in...');
      this.authErrorService.clearError();

      this.authService.login(this.loginForm.value).subscribe({
        next: (success) => {
          this.authErrorService.clearLoading();
          if (success) {
            this.router.navigate(['/chat']);
          }
        },
        error: (error) => {
          this.authErrorService.clearLoading();
          const authError = this.authErrorService.handleHttpError(error, 'custom');
          this.authErrorService.setError(authError);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
