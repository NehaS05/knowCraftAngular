import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  profileForm: FormGroup;
  securityForm: FormGroup;
  emailNotifications = false;
  darkMode = false;

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Load user settings
    this.profileForm.patchValue({
      username: 'admin',
      email: 'admin@knowcraft.ai'
    });
  }

  saveProfileChanges() {
    if (this.profileForm.valid) {
      console.log('Profile updated:', this.profileForm.value);
      alert('Profile settings saved successfully!');
    }
  }

  updatePassword() {
    if (this.securityForm.valid) {
      console.log('Password update requested');
      alert('Password updated successfully!');
      this.securityForm.reset();
    }
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
