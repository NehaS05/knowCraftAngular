import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
    <app-toast-container></app-toast-container>
    <app-loading></app-loading>
  `,
  styles: []
})
export class AppComponent {
  title = 'user-management-app';
}