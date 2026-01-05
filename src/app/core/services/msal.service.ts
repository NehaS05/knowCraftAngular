import { Injectable } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { AuthenticationResult, AccountInfo, RedirectRequest, PopupRequest, EndSessionRequest } from '@azure/msal-browser';
import { Observable, filter, takeUntil, Subject } from 'rxjs';
import { EventMessage, EventType, InteractionStatus } from '@azure/msal-browser';
import { environment } from '../../../environments/environment';

export interface MSALServiceInterface {
  initializeMSAL(): Promise<void>;
  loginWithRedirect(): Promise<void>;
  loginWithPopup(): Promise<AuthenticationResult>;
  handleRedirectPromise(): Promise<AuthenticationResult | null>;
  logout(): Promise<void>;
  getActiveAccount(): AccountInfo | null;
  getAllAccounts(): AccountInfo[];
  acquireTokenSilent(scopes: string[]): Promise<AuthenticationResult>;
  isLoggedIn(): boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MSALWrapperService implements MSALServiceInterface {
  private readonly _destroying$ = new Subject<void>();
  private isInitialized = false;

  constructor(
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService
  ) {
    this.initializeMSAL();
  }

  async initializeMSAL(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      console.log('Initializing MSAL...');
      
      // Wait for MSAL to be initialized
      await this.msalService.instance.initialize();
      
      // Handle redirect promise on app startup
      await this.handleRedirectPromise();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('MSAL initialized successfully');
    } catch (error) {
      console.error('MSAL initialization failed:', error);
      throw error;
    }
  }

  async loginWithRedirect(): Promise<void> {
    try {
      console.log('Starting MSAL redirect login...');
      
      const loginRequest: RedirectRequest = {
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        redirectUri: environment.azureAd.redirectUri,
        prompt: 'select_account'
      };

      this.msalService.loginRedirect(loginRequest);
    } catch (error) {
      console.error('MSAL redirect login failed:', error);
      throw error;
    }
  }

  async loginWithPopup(): Promise<AuthenticationResult> {
    try {
      console.log('Starting MSAL popup login...');
      
      const loginRequest: PopupRequest = {
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account'
      };

      return new Promise<AuthenticationResult>((resolve, reject) => {
        this.msalService.loginPopup(loginRequest).subscribe({
          next: (result) => {
            console.log('MSAL popup login successful');
            resolve(result);
          },
          error: (error) => reject(error)
        });
      });
    } catch (error) {
      console.error('MSAL popup login failed:', error);
      throw error;
    }
  }

  async handleRedirectPromise(): Promise<AuthenticationResult | null> {
    try {
      const result = await new Promise<AuthenticationResult | null>((resolve, reject) => {
        this.msalService.handleRedirectObservable().subscribe({
          next: (result) => resolve(result),
          error: (error) => reject(error)
        });
      });
      
      if (result) {
        console.log('MSAL redirect handled successfully:', result);
        // Set the active account
        this.msalService.instance.setActiveAccount(result.account);
      }
      
      return result;
    } catch (error) {
      console.error('MSAL redirect handling failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('Starting MSAL logout...');
      
      const logoutRequest: EndSessionRequest = {
        postLogoutRedirectUri: environment.azureAd.postLogoutRedirectUri,
        account: this.getActiveAccount()
      };

      this.msalService.logoutRedirect(logoutRequest);
    } catch (error) {
      console.error('MSAL logout failed:', error);
      throw error;
    }
  }

  getActiveAccount(): AccountInfo | null {
    return this.msalService.instance.getActiveAccount();
  }

  getAllAccounts(): AccountInfo[] {
    return this.msalService.instance.getAllAccounts();
  }

  async acquireTokenSilent(scopes: string[]): Promise<AuthenticationResult> {
    try {
      const account = this.getActiveAccount();
      if (!account) {
        throw new Error('No active account found');
      }

      const silentRequest = {
        scopes: scopes,
        account: account
      };

      return new Promise<AuthenticationResult>((resolve, reject) => {
        this.msalService.acquireTokenSilent(silentRequest).subscribe({
          next: (result) => resolve(result),
          error: (error) => reject(error)
        });
      });
    } catch (error) {
      console.error('Silent token acquisition failed:', error);
      throw error;
    }
  }

  isLoggedIn(): boolean {
    const account = this.getActiveAccount();
    return account !== null;
  }

  getInteractionStatus(): Observable<InteractionStatus> {
    return this.msalBroadcastService.inProgress$;
  }

  getMsalSubject(): Observable<EventMessage> {
    return this.msalBroadcastService.msalSubject$;
  }

  private setupEventListeners(): void {
    // Listen for successful login events
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        console.log('MSAL Login Success Event:', result);
        const payload = result.payload as AuthenticationResult;
        this.msalService.instance.setActiveAccount(payload.account);
      });

    // Listen for login failure events
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_FAILURE),
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        console.error('MSAL Login Failure Event:', result);
      });

    // Listen for logout success events
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGOUT_SUCCESS),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        console.log('MSAL Logout Success Event');
      });

    // Listen for token acquisition events
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS),
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        console.log('MSAL Token Acquisition Success:', result);
      });

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.ACQUIRE_TOKEN_FAILURE),
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        console.error('MSAL Token Acquisition Failure:', result);
      });
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}