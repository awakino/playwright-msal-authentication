import { PublicClientApplication, BrowserCacheLocation } from '@azure/msal-browser';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthenticationPage } from './authenticate';
import { MsalProvider } from "@azure/msal-react";
import AuthConfig from "../config/auth-config";

// configure and create the MSAL instance
const msal = new PublicClientApplication({
  auth: {
      clientId: AuthConfig.clientId,
      authority: AuthConfig.authority,
      redirectUri: window.origin
  },
  cache: {
      // Playwright can't write to session storage (the MSAL default) 
      // so we must use local storage instead
      cacheLocation: BrowserCacheLocation.LocalStorage
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MsalProvider instance={msal}>
      <AuthenticationPage />
    </MsalProvider>
  </React.StrictMode>
)