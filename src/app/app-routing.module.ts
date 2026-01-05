import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { ChatComponent } from './modules/chat/chat.component';
import { KnowledgeComponent } from './modules/knowledge/knowledge.component';
import { AnalyticsComponent } from './modules/analytics/analytics.component';
import { AuditLogsComponent } from './modules/audit-logs/audit-logs.component';
import { SettingsComponent } from './modules/settings/settings.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: '/chat', pathMatch: 'full' }, // Redirect to chat instead of dashboard
      { 
        path: 'dashboard', 
        component: DashboardComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Admin', 'InternalTeam'] }
      },
      { 
        path: 'chat', 
        component: ChatComponent 
        // No role restriction - all authenticated users can access
      },
      {
        path: 'users',
        loadChildren: () => import('./modules/user/user.module').then(m => m.UserModule),
        canActivate: [RoleGuard],
        data: { roles: ['Admin', 'InternalTeam'] }
      },
      { 
        path: 'knowledge', 
        component: KnowledgeComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Admin', 'InternalTeam'] }
      },
      { 
        path: 'analytics', 
        component: AnalyticsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Admin', 'InternalTeam'] }
      },
      { 
        path: 'audit-logs', 
        component: AuditLogsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Admin', 'InternalTeam'] }
      },
      { 
        path: 'settings', 
        component: SettingsComponent 
        // No role restriction - all authenticated users can access
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }