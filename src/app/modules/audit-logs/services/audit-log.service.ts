import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuditLogDto, AuditLogSummaryDto } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private apiUrl = `${environment.apiUrl}/auditlog`;

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private toastService: ToastService
  ) {}

  getAuditLogs(): Observable<AuditLogSummaryDto[]> {
    this.loadingService.show();
    return this.http.get<AuditLogSummaryDto[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError.bind(this)),
        finalize(() => this.loadingService.hide())
      );
  }

  downloadExcel(): Observable<Blob> {
    this.loadingService.show();
    return this.http.get(`${this.apiUrl}/download-excel`, { responseType: 'blob' })
      .pipe(
        catchError(this.handleError.bind(this)),
        finalize(() => this.loadingService.hide())
      );
  }

  private handleError(error: any): Observable<never> {
    this.toastService.error('Error', 'An error occurred while processing your request');
    return throwError(() => error);
  }
}