import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  active?: boolean;
  safeIcon?: SafeHtml;
  roles?: string[]; // Add roles property to restrict menu items
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  showLogoutMenu = false;
  
  // All available menu items with role restrictions
  allMenuItems: MenuItem[] = [
    {
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      label: 'Chat',
      route: '/chat',
      active: true,
      roles: ['Admin', 'InternalTeam', 'ClientAccount'] // All roles can access chat
    },
    {
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
      label: 'Knowledge Base',
      route: '/knowledge',
      active: false,
      roles: ['Admin', 'InternalTeam'] // Only admin and internal team
    },
    {
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
      label: 'Analytics',
      route: '/analytics',
      active: false,
      roles: ['Admin', 'InternalTeam'] // Only admin and internal team
    },
    {
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
      label: 'Audit Logs',
      route: '/audit-logs',
      active: false,
      roles: ['Admin', 'InternalTeam'] // Only admin and internal team
    },
    {
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      label: 'Users',
      route: '/users',
      active: false,
      roles: ['Admin', 'InternalTeam'] // Only admin and internal team
    },
    {
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
      label: 'Settings',
      route: '/settings',
      active: false,
      roles: ['Admin', 'InternalTeam', 'ClientAccount'] // All roles can access settings
    }
  ];

  // Filtered menu items based on user role
  menuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private sidebarService: SidebarService,
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {
    this.filterMenuItemsByRole();
    
    // Sanitize SVG icons for filtered menu items
    this.menuItems.forEach(item => {
      item.safeIcon = this.sanitizer.bypassSecurityTrustHtml(item.icon);
    });
  }

  ngOnInit() {
    this.sidebarService.isCollapsed$.subscribe(isCollapsed => {
      this.isCollapsed = isCollapsed;
    });
  }

  private filterMenuItemsByRole(): void {
    const userRole = this.authService.getUserRole();
    
    if (!userRole) {
      // If no role found, show only basic items
      this.menuItems = this.allMenuItems.filter(item => 
        item.route === '/chat' || item.route === '/settings'
      );
      return;
    }

    // Filter menu items based on user role
    this.menuItems = this.allMenuItems.filter(item => 
      !item.roles || item.roles.includes(userRole)
    );
  }

  navigateTo(route: string) {
    // Update active state
    this.menuItems.forEach(item => item.active = false);
    const selectedItem = this.menuItems.find(item => item.route === route);
    if (selectedItem) {
      selectedItem.active = true;
    }
    
    this.router.navigate([route]);
  }

  toggleLogoutMenu() {
    this.showLogoutMenu = !this.showLogoutMenu;
  }

  logout() {
    // if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    // }
  }

  getUserInitials(): string {
    const user = this.authService.getCurrentUser();
    if (user && user.firstName && user.lastName) {
      return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'U';
  }

  getUserDisplayName(): string {
    const user = this.authService.getCurrentUser();
    if (user && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || 'User';
  }

  getUserRoleDisplay(): string {
    const role = this.authService.getUserRole();
    switch (role) {
      case 'Admin':
        return 'ADMIN';
      case 'InternalTeam':
        return 'INTERNAL TEAM';
      case 'ClientAccount':
        return 'CLIENT';
      default:
        return 'USER';
    }
  }
}