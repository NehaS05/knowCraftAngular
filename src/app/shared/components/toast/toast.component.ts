import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast" [ngClass]="'toast-' + toast.type" *ngIf="visible">
      <div class="toast-content">
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="close()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      margin-bottom: 8px;
      padding: 12px 16px;
      position: relative;
      border-left: 4px solid;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-success {
      border-left-color: #28a745;
      background-color: #d4edda;
    }

    .toast-error {
      border-left-color: #dc3545;
      background-color: #f8d7da;
    }

    .toast-warning {
      border-left-color: #ffc107;
      background-color: #fff3cd;
    }

    .toast-info {
      border-left-color: #17a2b8;
      background-color: #d1ecf1;
    }

    .toast-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .toast-message {
      flex: 1;
      margin-right: 8px;
      font-size: 14px;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      color: #666;
    }

    .toast-close:hover {
      color: #333;
    }
  `]
})
export class ToastComponent {
  @Input() toast!: Toast;
  @Output() closeToast = new EventEmitter<string>();

  visible = true;

  ngOnInit() {
    if (this.toast.duration && this.toast.duration > 0) {
      setTimeout(() => {
        this.close();
      }, this.toast.duration);
    }
  }

  close() {
    this.visible = false;
    setTimeout(() => {
      this.closeToast.emit(this.toast.id);
    }, 300); // Wait for animation to complete
  }
}