import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// MSAL imports
import { MsalModule, MsalService, MsalGuard, MsalInterceptor, MsalBroadcastService, MsalRedirectComponent } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType, BrowserCacheLocation } from '@azure/msal-browser';

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
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { SharedModule } from './shared/shared.module';
import { environment } from '../environments/environment';

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: environment.azureAd.clientId,
    authority: environment.azureAd.authority,
    redirectUri: environment.azureAd.redirectUri,
    postLogoutRedirectUri: environment.azureAd.postLogoutRedirectUri
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
    storeAuthStateInCookie: false
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

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
    AppRoutingModule,
    SharedModule,
    MsalModule.forRoot(msalInstance, {
      interactionType: InteractionType.Redirect,
      authRequest: {
        scopes: ['openid', 'profile', 'email', 'User.Read']
      }
    }, {
      interactionType: InteractionType.Redirect,
      protectedResourceMap: new Map([
        [environment.apiUrl, ['User.Read']]
      ])
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ],
  bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }