import { Component, OnInit } from '@angular/core';
import { User, CreateUserRequest, UpdateUserRequest } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  isModalOpen = false;
  modalTitle = '';
  selectedUser: User | null = null;

  constructor(
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  openAddModal() {
    this.selectedUser = null;
    this.modalTitle = 'Add New User';
    this.isModalOpen = true;
  }

  editUser(user: User) {
    this.selectedUser = { ...user };
    this.modalTitle = 'Edit User';
    this.isModalOpen = true;
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.toastService.success('Success', 'User deleted successfully');
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  activateUser(id: number) {
    this.userService.activateUser(id).subscribe({
      next: () => {
        this.toastService.success('Success', 'User activated successfully');
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error activating user:', error);
      }
    });
  }

  deactivateUser(id: number) {
    if (confirm('Are you sure you want to deactivate this user?')) {
      this.userService.deactivateUser(id).subscribe({
        next: () => {
          this.toastService.success('Success', 'User deactivated successfully');
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deactivating user:', error);
        }
      });
    }
  }

  onUserSaved(userData: CreateUserRequest | UpdateUserRequest) {
    if (this.selectedUser?.id) {
      // Update existing user
      this.userService.updateUser(this.selectedUser.id, userData as UpdateUserRequest).subscribe({
        next: () => {
          this.toastService.success('Success', 'User updated successfully');
          this.loadUsers();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating user:', error);
        }
      });
    } else {
      // Create new user
      this.userService.createUser(userData as CreateUserRequest).subscribe({
        next: () => {
          this.toastService.success('Success', 'User created successfully');
          this.loadUsers();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating user:', error);
        }
      });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedUser = null;
  }
}
