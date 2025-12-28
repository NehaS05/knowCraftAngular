import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const requiredRoles = route.data['roles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role restriction
    }

    const userRole = this.authService.getUserRole();
    
    if (!userRole) {
      this.toastService.error('Access Denied', 'You are not authenticated');
      this.router.navigate(['/login']);
      return false;
    }

    if (requiredRoles.includes(userRole)) {
      return true; // User has required role
    }

    // User doesn't have required role
    this.toastService.error('Access Denied', 'You do not have permission to access this page');
    this.router.navigate(['/chat']); // Redirect to chat (available to all)
    return false;
  }
}