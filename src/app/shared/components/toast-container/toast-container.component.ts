import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Toast } from '../toast/toast.component';

export interface ToastService {
  toasts$: any;
  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number): void;
  removeToast(id: string): void;
}

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-container">
      <app-toast 
        *ngFor="let toast of toasts" 
        [toast]="toast" 
        (closeToast)="removeToast($event)">
      </app-toast>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription?: Subscription;

  constructor() { }

  ngOnInit() {
    // In a real implementation, this would subscribe to a toast service
    // For now, we'll just manage toasts locally
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  // Method to add toasts programmatically (for testing)
  addToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 5000) {
    const toast: Toast = {
      id: Date.now().toString(),
      message,
      type,
      duration
    };
    this.toasts.push(toast);
  }
}