import { Component, ViewChild } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  template: `
    <div class="layout-container">
      <app-sidebar #sidebar></app-sidebar>
      <div class="main-content" [class.collapsed]="sidebar.isCollapsed">
        <app-header></app-header>
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      margin-left: 250px;
      background: var(--main-bg);
      min-height: 100vh;
      transition: margin-left 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .main-content.collapsed {
      margin-left: 70px;
    }

    .content-area {
      flex: 1;
      background: var(--main-bg);
    }
  `]
})
export class LayoutComponent {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
}