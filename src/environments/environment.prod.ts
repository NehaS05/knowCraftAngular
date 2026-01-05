export const environment = {
  production: true,
  apiUrl: 'https://knowcraft-api.azurewebsites.net/api',
  azureAd: {
    clientId: 'YOUR_CLIENT_ID', // Replace with your actual client ID
    tenantId: 'YOUR_TENANT_ID', // Replace with your actual tenant ID
    redirectUri: 'https://your-domain.com/auth/callback', // Replace with your production domain
    postLogoutRedirectUri: 'https://your-domain.com', // Replace with your production domain
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID' // Replace YOUR_TENANT_ID
  },
  authentication: {
    enableSSO: true,
    enableCustomAuth: true,
    defaultAuthMethod: 'custom'
  }
};