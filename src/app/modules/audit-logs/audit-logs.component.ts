import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuditLog } from './models/audit-log.model';
import { AuditLogService } from './services/audit-log.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  paginatedLogs: AuditLog[] = [];
  searchQuery: string = '';
  isLoading = false;
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  minPages = 5; // Minimum pages to show
  
  // Expose Math for template
  Math = Math;
  
  private destroy$ = new Subject<void>();

  constructor(
    private auditLogService: AuditLogService,
    private loadingService: LoadingService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadAuditLogs();
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

  loadAuditLogs() {
    this.auditLogService.getAuditLogs().subscribe({
      next: (logs) => {
        // Transform backend grouped data to match UI format
        this.auditLogs = logs.map(log => ({
          timestamp: new Date(log.date).toLocaleDateString(),
          user: log.userEmail,
          role: this.mapRoleToDisplayName(log.userRole),
          queries: log.requestCount
        }));
        
        this.filteredLogs = [...this.auditLogs];
        this.updatePagination();
      },
      error: () => {
        this.toastService.error('Error', 'Failed to load audit logs');
      }
    });
  }

  private mapRoleToDisplayName(role: string): 'INTERNAL TEAM' | 'CLIENT' {
    switch (role) {
      case 'Admin':
      case 'InternalTeam':
        return 'INTERNAL TEAM';
      case 'ClientAccount':
      default:
        return 'CLIENT';
    }
  }

  searchLogs() {
    if (!this.searchQuery.trim()) {
      this.filteredLogs = [...this.auditLogs];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredLogs = this.auditLogs.filter(log =>
        log.user.toLowerCase().includes(query) ||
        log.timestamp.includes(query) ||
        log.role.toLowerCase().includes(query)
      );
    }
    this.currentPage = 1; // Reset to first page when searching
    this.updatePagination();
  }

  exportLogs() {
    this.auditLogService.downloadExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Success', 'Audit logs exported successfully');
      },
      error: () => {
        this.toastService.error('Error', 'Failed to export audit logs');
      }
    });
  }

  // Pagination methods
  updatePagination() {
    this.totalItems = this.filteredLogs.length;
    this.totalPages = Math.max(this.minPages, Math.ceil(this.totalItems / this.itemsPerPage));
    
    // Ensure current page is within bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, Math.min(this.totalPages, this.minPages));
    }
    
    this.updatePaginatedLogs();
    this.adjustTableHeight();
  }

  updatePaginatedLogs() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedLogs = this.filteredLogs.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedLogs();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedLogs();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedLogs();
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePagination();
    this.adjustTableHeight();
  }

  adjustTableHeight() {
    // The height is now controlled by CSS classes, but we can add additional logic here if needed
    // This method is kept for future enhancements
  }

  getTableWrapperClass(): string {
    return `items-${this.itemsPerPage}`;
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
