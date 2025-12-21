import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, CreateUserRequest, UpdateUserRequest } from '../../../core/models/user.model';
import { Role, RoleService } from '../../../core/services/role.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit, OnChanges {
  @Input() user: User | null = null;
  @Output() userSaved = new EventEmitter<CreateUserRequest | UpdateUserRequest>();
  @Output() cancelled = new EventEmitter<void>();

  userForm: FormGroup;
  roles: Role[] = [];
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService
  ) {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      password: ['', Validators.required],
      roleId: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadRoles();
    this.updateForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && !changes['user'].firstChange) {
      this.updateForm();
    }
  }

  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  updateForm() {
    this.isEditMode = !!this.user;
    
    if (this.user) {
      // Edit mode - populate form and make password optional
      this.userForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        username: this.user.username,
        phoneNumber: this.user.phoneNumber,
        roleId: this.user.roleId,
        isActive: this.user.isActive
      });
      
      // Make password optional for edit mode
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    } else {
      // Create mode - reset form and make password required
      this.userForm.reset({
        isActive: true
      });
      
      // Make password required for create mode
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      
      if (this.isEditMode) {
        // Update user - exclude password if empty
        const updateData: UpdateUserRequest = {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          email: formValue.email,
          username: formValue.username,
          phoneNumber: formValue.phoneNumber,
          roleId: formValue.roleId,
          isActive: formValue.isActive
        };
        this.userSaved.emit(updateData);
      } else {
        // Create user - include all fields
        const createData: CreateUserRequest = {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          email: formValue.email,
          username: formValue.username,
          phoneNumber: formValue.phoneNumber,
          password: formValue.password,
          roleId: formValue.roleId
        };
        this.userSaved.emit(createData);
      }
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
}
