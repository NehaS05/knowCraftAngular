import { Component, OnInit } from '@angular/core';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

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

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
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
      this.userService.deleteUser(id).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  onUserSaved(user: User) {
    if (user.id) {
      this.userService.updateUser(user.id, user).subscribe(() => {
        this.loadUsers();
        this.closeModal();
      });
    } else {
      this.userService.createUser(user).subscribe(() => {
        this.loadUsers();
        this.closeModal();
      });
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedUser = null;
  }
}
