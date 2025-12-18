import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isCollapsedSubject = new BehaviorSubject<boolean>(false);
  public isCollapsed$ = this.isCollapsedSubject.asObservable();

  constructor() {
    // Check for saved sidebar state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.isCollapsedSubject.next(savedState === 'true');
    }
  }

  toggleSidebar(): void {
    const currentState = this.isCollapsedSubject.value;
    const newState = !currentState;
    this.isCollapsedSubject.next(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  }

  getState(): boolean {
    return this.isCollapsedSubject.value;
  }
}