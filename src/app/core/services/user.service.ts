import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  
  // Sample data for demonstration
  private users: User[] = [
    { id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', mobileNumber: '+1234567890' },
    { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', mobileNumber: '+1234567891' }
  ];

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    // For demo purposes, return sample data
    // In production: return this.http.get<User[]>(this.apiUrl);
    return of(this.users);
  }

  getUserById(id: number): Observable<User> {
    // For demo purposes
    // In production: return this.http.get<User>(`${this.apiUrl}/${id}`);
    const user = this.users.find(u => u.id === id);
    return of(user!);
  }

  createUser(user: User): Observable<User> {
    // For demo purposes
    // In production: return this.http.post<User>(this.apiUrl, user);
    const newUser = { ...user, id: Math.max(...this.users.map(u => u.id || 0)) + 1 };
    this.users.push(newUser);
    return of(newUser);
  }

  updateUser(id: number, user: User): Observable<User> {
    // For demo purposes
    // In production: return this.http.put<User>(`${this.apiUrl}/${id}`, user);
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...user, id };
    }
    return of(this.users[index]);
  }

  deleteUser(id: number): Observable<void> {
    // For demo purposes
    // In production: return this.http.delete<void>(`${this.apiUrl}/${id}`);
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
    return of();
  }
}