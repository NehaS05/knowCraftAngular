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

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'chat', component: ChatComponent },
      {
        path: 'users',
        loadChildren: () => import('./modules/user/user.module').then(m => m.UserModule)
      },
      { path: 'knowledge', component: KnowledgeComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'audit-logs', component: AuditLogsComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }