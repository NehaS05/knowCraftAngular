import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { ChatComponent } from './modules/chat/chat.component';
import { KnowledgeComponent } from './modules/knowledge/knowledge.component';
import { AnalyticsComponent } from './modules/analytics/analytics.component';
import { AuditLogsComponent } from './modules/audit-logs/audit-logs.component';
import { SettingsComponent } from './modules/settings/settings.component';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    SidebarComponent,
    HeaderComponent,
    DashboardComponent,
    ChatComponent,
    KnowledgeComponent,
    AnalyticsComponent,
    AuditLogsComponent,
    SettingsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }