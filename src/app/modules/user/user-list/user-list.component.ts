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
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  isModalOpen = false;
  modalTitle = '';
  selectedUser: User | null = null;
  searchQuery: string = '';
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  minPages = 5; // Minimum pages to show
  
  // Expose Math for template
  Math = Math;

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
        
        this.filteredUsers = [...this.users];
        this.updatePagination();
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

  // Search functionality
  searchUsers() {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.roleName.toLowerCase().includes(query)
      );
    }
    this.currentPage = 1; // Reset to first page when searching
    this.updatePagination();
  }

  // Pagination methods
  updatePagination() {
    this.totalItems = this.filteredUsers.length;
    this.totalPages = Math.max(this.minPages, Math.ceil(this.totalItems / this.itemsPerPage));
    
    // Ensure current page is within bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, Math.min(this.totalPages, this.minPages));
    }
    
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedUsers();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedUsers();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedUsers();
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const actualPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const displayPages = Math.max(this.minPages, actualPages);
    
    // Always show at least minPages (5) pages
    for (let i = 1; i <= displayPages; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Helper methods for pagination display
  getStartIndex(): number {
    return Math.min((this.currentPage - 1) * this.itemsPerPage + 1, this.totalItems);
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  hasData(): boolean {
    return this.totalItems > 0;
  }

  isPageDisabled(page: number): boolean {
    const actualPages = Math.ceil(this.totalItems / this.itemsPerPage);
    return page > actualPages && this.totalItems > 0;
  }
}
