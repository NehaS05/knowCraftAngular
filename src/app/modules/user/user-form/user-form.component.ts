import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit, OnChanges {
  @Input() user: User | null = null;
  @Output() userSaved = new EventEmitter<User>();
  @Output() cancelled = new EventEmitter<void>();

  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.updateForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && !changes['user'].firstChange) {
      this.updateForm();
    }
  }

  updateForm() {
    if (this.user) {
      this.userForm.patchValue(this.user);
    } else {
      this.userForm.reset();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const userData: User = {
        ...formValue,
        id: this.user?.id
      };
      this.userSaved.emit(userData);
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
}
