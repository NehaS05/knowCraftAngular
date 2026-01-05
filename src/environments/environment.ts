export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  azureAd: {
    clientId: 'YOUR_CLIENT_ID', // Replace with your actual client ID
    tenantId: 'YOUR_TENANT_ID', // Replace with your actual tenant ID
    redirectUri: 'http://localhost:4200/auth/callback',
    postLogoutRedirectUri: 'http://localhost:4200',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID' // Replace YOUR_TENANT_ID
  },
  authentication: {
    enableSSO: true,
    enableCustomAuth: true,
    defaultAuthMethod: 'custom'
  }
};