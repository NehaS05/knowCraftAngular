import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthMethod } from './auth.service';

export interface UserPreferences {
  preferredAuthMethod: AuthMethod;
  rememberAuthMethod: boolean;
  autoRedirectSSO: boolean;
  showAuthMethodSelection: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface AuthMethodPreference {
  method: AuthMethod;
  lastUsed: Date;
  successCount: number;
  failureCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private readonly PREFERENCES_KEY = 'userPreferences';
  private readonly AUTH_HISTORY_KEY = 'authMethodHistory';
  
  private preferencesSubject = new BehaviorSubject<UserPreferences>(this.getDefaultPreferences());
  public preferences$ = this.preferencesSubject.asObservable();

  constructor() {
    this.loadPreferences();
  }

  // Preference Management
  getPreferences(): UserPreferences {
    return this.preferencesSubject.value;
  }

  updatePreferences(preferences: Partial<UserPreferences>): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, ...preferences };
    
    this.preferencesSubject.next(updated);
    this.savePreferences(updated);
  }

  resetPreferences(): void {
    const defaults = this.getDefaultPreferences();
    this.preferencesSubject.next(defaults);
    this.savePreferences(defaults);
    localStorage.removeItem(this.AUTH_HISTORY_KEY);
  }

  // Authentication Method Preferences
  getPreferredAuthMethod(): AuthMethod {
    const preferences = this.getPreferences();
    
    if (!preferences.rememberAuthMethod) {
      return null;
    }
    
    return preferences.preferredAuthMethod;
  }

  setPreferredAuthMethod(method: AuthMethod): void {
    this.updatePreferences({ 
      preferredAuthMethod: method,
      rememberAuthMethod: true 
    });
    
    this.recordAuthMethodUsage(method, true);
  }

  shouldAutoRedirectSSO(): boolean {
    const preferences = this.getPreferences();
    return preferences.autoRedirectSSO && preferences.preferredAuthMethod === 'sso';
  }

  shouldShowAuthMethodSelection(): boolean {
    const preferences = this.getPreferences();
    return preferences.showAuthMethodSelection || !preferences.rememberAuthMethod;
  }

  // Authentication History Tracking
  recordAuthMethodUsage(method: AuthMethod, success: boolean): void {
    if (!method) return;
    
    const history = this.getAuthMethodHistory();
    const existing = history.find(h => h.method === method);
    
    if (existing) {
      existing.lastUsed = new Date();
      if (success) {
        existing.successCount++;
      } else {
        existing.failureCount++;
      }
    } else {
      history.push({
        method,
        lastUsed: new Date(),
        successCount: success ? 1 : 0,
        failureCount: success ? 0 : 1
      });
    }
    
    this.saveAuthMethodHistory(history);
  }

  getAuthMethodHistory(): AuthMethodPreference[] {
    try {
      const stored = localStorage.getItem(this.AUTH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((item: any) => ({
          ...item,
          lastUsed: new Date(item.lastUsed)
        }));
      }
    } catch (error) {
      console.error('Failed to load auth method history:', error);
    }
    
    return [];
  }

  getRecommendedAuthMethod(): AuthMethod {
    const history = this.getAuthMethodHistory();
    const preferences = this.getPreferences();
    
    // If user has a preferred method, use it
    if (preferences.preferredAuthMethod && preferences.rememberAuthMethod) {
      return preferences.preferredAuthMethod;
    }
    
    // Find the method with the highest success rate and recent usage
    const scored = history.map(h => {
      const totalAttempts = h.successCount + h.failureCount;
      const successRate = totalAttempts > 0 ? h.successCount / totalAttempts : 0;
      const daysSinceLastUse = (Date.now() - h.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - (daysSinceLastUse / 30)); // Decay over 30 days
      
      return {
        method: h.method,
        score: successRate * 0.7 + recencyScore * 0.3
      };
    });
    
    scored.sort((a, b) => b.score - a.score);
    
    return scored.length > 0 ? scored[0].method : null;
  }

  // Theme and UI Preferences
  getTheme(): 'light' | 'dark' | 'auto' {
    return this.getPreferences().theme;
  }

  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.updatePreferences({ theme });
  }

  getLanguage(): string {
    return this.getPreferences().language;
  }

  setLanguage(language: string): void {
    this.updatePreferences({ language });
  }

  // Analytics and Insights
  getAuthMethodStats(): { method: AuthMethod; successRate: number; totalAttempts: number; lastUsed: Date }[] {
    const history = this.getAuthMethodHistory();
    
    return history.map(h => ({
      method: h.method,
      successRate: h.successCount + h.failureCount > 0 ? h.successCount / (h.successCount + h.failureCount) : 0,
      totalAttempts: h.successCount + h.failureCount,
      lastUsed: h.lastUsed
    }));
  }

  // Private Methods
  private getDefaultPreferences(): UserPreferences {
    return {
      preferredAuthMethod: null,
      rememberAuthMethod: false,
      autoRedirectSSO: false,
      showAuthMethodSelection: true,
      theme: 'auto',
      language: 'en'
    };
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(this.PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...this.getDefaultPreferences(), ...parsed };
        this.preferencesSubject.next(merged);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  }

  private savePreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  private saveAuthMethodHistory(history: AuthMethodPreference[]): void {
    try {
      // Keep only the last 50 entries to prevent unlimited growth
      const trimmed = history.slice(-50);
      localStorage.setItem(this.AUTH_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save auth method history:', error);
    }
  }

  // Migration and Cleanup
  migrateOldPreferences(): void {
    // Migrate from old preference keys if they exist
    const oldPreferredMethod = localStorage.getItem('preferredAuthMethod') as AuthMethod;
    if (oldPreferredMethod) {
      this.updatePreferences({ 
        preferredAuthMethod: oldPreferredMethod,
        rememberAuthMethod: true 
      });
      localStorage.removeItem('preferredAuthMethod');
    }
  }

  clearAllData(): void {
    localStorage.removeItem(this.PREFERENCES_KEY);
    localStorage.removeItem(this.AUTH_HISTORY_KEY);
    this.preferencesSubject.next(this.getDefaultPreferences());
  }
}