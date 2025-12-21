import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { LoadingService } from './loading.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private toastService: ToastService
  ) {}

  getUsers(): Observable<User[]> {
    this.loadingService.show();
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingService.hide())
    );
  }

  getUserById(id: number): Observable<User> {
    this.loadingService.show();
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingService.hide())
    );
  }

  createUser(user: CreateUserRequest): Observable<User> {
    this.loadingService.show();
    return this.http.post<User>(this.apiUrl, user).pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingService.hide())
    );
  }

  updateUser(id: number, user: UpdateUserRequest): Observable<User> {
    this.loadingService.show();
    return this.http.put<User>(`${this.apiUrl}/${id}`, user).pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingService.hide())
    );
  }

  deleteUser(id: number): Observable<void> {
    this.loadingService.show();
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingService.hide())
    );
  }

  activateUser(id: number): Observable<any> {
    this.loadingService.show();
    return this.http.post(`${this.apiUrl}/${id}/activate`, {}).pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingService.hide())
    );
  }

  deactivateUser(id: number): Observable<any> {
    this.loadingService.show();
    return this.http.post(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
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