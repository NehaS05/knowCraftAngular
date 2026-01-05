import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService, AuthMethod } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

export interface LoginOption {
  method: AuthMethod;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  recommended?: boolean;
}

@Component({
  selector: 'app-login-options',
  templateUrl: './login-options.component.html',
  styleUrls: ['./login-options.component.css']
})
export class LoginOptionsComponent implements OnInit {
  @Output() authMethodSelected = new EventEmitter<AuthMethod>();
  
  loginOptions: LoginOption[] = [];
  preferredMethod: AuthMethod = null;
  isLoading = false;

  constructor(private authService: AuthService) {}

  async ngOnInit(): Promise<void> {
    await this.initializeLoginOptions();
    this.loadPreferredMethod();
  }

  private async initializeLoginOptions(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Get SSO configuration from backend
      const ssoConfig = await this.authService.getSSOConfig();
      
      this.loginOptions = [
        {
          method: 'custom',
          title: 'Sign in with Username',
          description: 'Use your username and password',
          icon: 'user',
          enabled: this.authService.isCustomAuthEnabled(),
          recommended: environment.authentication.defaultAuthMethod === 'custom'
        },
        {
          method: 'sso',
          title: 'Sign in with Microsoft',
          description: 'Use your organizational Microsoft account',
          icon: 'microsoft',
          enabled: ssoConfig.ssoEnabled && this.authService.isSSOEnabled(),
          recommended: environment.authentication.defaultAuthMethod === 'sso'
        }
      ];
    } catch (error) {
      console.error('Failed to initialize login options:', error);
      // Fallback to environment configuration
      this.loginOptions = [
        {
          method: 'custom',
          title: 'Sign in with Username',
          description: 'Use your username and password',
          icon: 'user',
          enabled: this.authService.isCustomAuthEnabled(),
          recommended: true
        },
        {
          method: 'sso',
          title: 'Sign in with Microsoft',
          description: 'Use your organizational Microsoft account',
          icon: 'microsoft',
          enabled: false // Disable if we can't verify SSO config
        }
      ];
    } finally {
      this.isLoading = false;
    }
  }

  private loadPreferredMethod(): void {
    this.preferredMethod = this.authService.getPreferredAuthMethod();
  }

  async selectAuthMethod(method: AuthMethod): Promise<void> {
    if (!method) return;
    
    const option = this.loginOptions.find(opt => opt.method === method);
    if (!option || !option.enabled) {
      console.warn(`Authentication method ${method} is not available`);
      return;
    }

    try {
      this.isLoading = true;
      
      // Save user preference
      this.authService.setPreferredAuthMethod(method);
      this.preferredMethod = method;
      
      if (method === 'sso') {
        // Initiate SSO login
        await this.authService.loginSSO();
      } else {
        // Emit event for custom login
        this.authMethodSelected.emit(method);
      }
    } catch (error) {
      console.error(`${method} authentication failed:`, error);
      this.handleAuthError(error, method);
    } finally {
      this.isLoading = false;
    }
  }

  private handleAuthError(error: any, method: AuthMethod): void {
    let errorMessage = 'Authentication failed';
    let canFallback = false;
    let fallbackMethod: AuthMethod = null;

    if (error && typeof error === 'object') {
      errorMessage = error.message || errorMessage;
      canFallback = error.canFallback || false;
      fallbackMethod = error.fallbackMethod || null;
    }

    // Show error message (you can replace this with a toast service)
    alert(errorMessage);

    // Handle fallback if available
    if (canFallback && fallbackMethod && fallbackMethod !== method) {
      const fallbackOption = this.loginOptions.find(opt => opt.method === fallbackMethod);
      if (fallbackOption && fallbackOption.enabled) {
        const shouldFallback = confirm(`Would you like to try ${fallbackOption.title} instead?`);
        if (shouldFallback) {
          this.selectAuthMethod(fallbackMethod);
        }
      }
    }
  }

  getEnabledOptions(): LoginOption[] {
    return this.loginOptions.filter(option => option.enabled);
  }

  hasMultipleOptions(): boolean {
    return this.getEnabledOptions().length > 1;
  }

  getRecommendedOption(): LoginOption | null {
    return this.loginOptions.find(option => option.enabled && option.recommended) || null;
  }

  isPreferred(method: AuthMethod): boolean {
    return this.preferredMethod === method;
  }
}