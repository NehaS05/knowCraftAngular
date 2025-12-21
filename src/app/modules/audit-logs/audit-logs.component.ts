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
  searchQuery: string = '';
  isLoading = false;
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
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredLogs = this.auditLogs.filter(log =>
      log.user.toLowerCase().includes(query) ||
      log.timestamp.includes(query) ||
      log.role.toLowerCase().includes(query)
    );
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
}
