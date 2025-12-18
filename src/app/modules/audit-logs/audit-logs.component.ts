import { Component, OnInit } from '@angular/core';

interface AuditLog {
  timestamp: string;
  user: string;
  role: 'INTERNAL TEAM' | 'CLIENT';
  queries: number;
}

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  auditLogs: AuditLog[] = [
    {
      timestamp: '2024-11-03 14:32:15',
      user: 'john.doe@nocraft.com',
      role: 'INTERNAL TEAM',
      queries: 45
    },
    {
      timestamp: '2024-11-03 14:28:42',
      user: 'client_acme_corp',
      role: 'CLIENT',
      queries: 23
    },
    {
      timestamp: '2024-11-03 14:15:33',
      user: 'sarah.johnson@nocraft.com',
      role: 'INTERNAL TEAM',
      queries: 67
    },
    {
      timestamp: '2024-11-03 13:45:20',
      user: 'client_techstart_inc',
      role: 'CLIENT',
      queries: 12
    }
  ];

  filteredLogs: AuditLog[] = [];
  searchQuery: string = '';

  ngOnInit() {
    this.filteredLogs = [...this.auditLogs];
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
    console.log('Exporting audit logs...');
    alert('Export functionality will be implemented');
  }
}
