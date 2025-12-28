import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Analytics } from '../models/analytics.model';
import { environment } from '../../../environments/environment';
import { LoadingService } from './loading.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private toastService: ToastService
  ) {}

  getAnalytics(): Observable<Analytics> {
    this.loadingService.show();
    return this.http.get<Analytics>(this.apiUrl).pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingService.hide())
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server';
    } else if (error.status >= 400 && error.status < 500) {
      errorMessage = 'Invalid request';
    } else if (error.status >= 500) {
      errorMessage = 'Server error occurred';
    }

    this.toastService.error('Error', errorMessage);
    return throwError(() => error);
  }
}