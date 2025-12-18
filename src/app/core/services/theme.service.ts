import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkThemeSubject = new BehaviorSubject<boolean>(false);
  public isDarkTheme$ = this.isDarkThemeSubject.asObservable();

  constructor() {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    this.isDarkThemeSubject.next(isDark);
    this.applyTheme(isDark);
  }

  toggleTheme(): void {
    const currentTheme = this.isDarkThemeSubject.value;
    const newTheme = !currentTheme;
    this.isDarkThemeSubject.next(newTheme);
    this.applyTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  getCurrentTheme(): boolean {
    return this.isDarkThemeSubject.value;
  }
}