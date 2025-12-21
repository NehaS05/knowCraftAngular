import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingService } from '../../core/services/loading.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  securityForm: FormGroup;
  emailNotifications = false;
  darkMode = false;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private toastService: ToastService,
    private loadingService: LoadingService
  ) {
    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }]
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.loadUserProfile();
    this.subscribeToLoading();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToLoading() {
    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.isLoading = loading);
  }

  private loadUserProfile() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.userService.getUserById(currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            this.profileForm.patchValue({
              username: user.username,
              email: user.email
            });
          },
          error: (error) => {
            this.toastService.error('Error', 'Failed to load user profile');
            console.error('Error loading user profile:', error);
          }
        });
    }
  }

  updatePassword() {
    if (this.securityForm.invalid) {
      this.toastService.warning('Validation Error', 'Please fill in all required fields');
      return;
    }

    const { currentPassword, newPassword } = this.securityForm.value;

    this.loadingService.show();
    this.authService.changePassword({ currentPassword, newPassword })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.hide())
      )
      .subscribe({
        next: () => {
          this.toastService.success('Success', 'Password updated successfully');
          this.securityForm.reset();
        },
        error: (error) => {
          this.toastService.error('Error', error.message || 'Failed to update password');
          console.error('Error updating password:', error);
        }
      });
  }

  toggleEmailNotifications() {
    this.emailNotifications = !this.emailNotifications;
    console.log('Email notifications:', this.emailNotifications);
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    console.log('Dark mode:', this.darkMode);
  }
}
