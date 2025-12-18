import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isDarkTheme = false;
  isSidebarCollapsed = false;
  breadcrumbs: Array<{ label: string; url: string }> = [];

  private routeLabels: { [key: string]: string } = {
    'dashboard': 'Dashboard',
    'users': 'Users',
    'chat': 'Chat',
    'knowledge': 'Knowledge Base',
    'analytics': 'Analytics',
    'audit-logs': 'Audit Logs',
    'settings': 'Settings'
  };

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private sidebarService: SidebarService,
    private router: Router
  ) {}

  ngOnInit() {
    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkTheme = isDark;
    });

    this.sidebarService.isCollapsed$.subscribe(isCollapsed => {
      this.isSidebarCollapsed = isCollapsed;
    });

    // Update breadcrumbs on route change
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumbs();
      });

    // Initial breadcrumb
    this.updateBreadcrumbs();
  }

  updateBreadcrumbs() {
    const url = this.router.url;
    const segments = url.split('/').filter(segment => segment);
    
    this.breadcrumbs = [];
    
    // Add Home
    this.breadcrumbs.push({ label: 'Home', url: '/dashboard' });
    
    // Add other segments
    let currentUrl = '';
    segments.forEach(segment => {
      currentUrl += `/${segment}`;
      const label = this.routeLabels[segment] || this.capitalize(segment);
      this.breadcrumbs.push({ label, url: currentUrl });
    });
  }

  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.logout();
  }
}