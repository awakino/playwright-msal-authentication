import * as React from "react";
import { MsalProvider } from "@azure/msal-react";
import { BrowserCacheLocation, PublicClientApplication } from "@azure/msal-browser";
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

export const AuthenticationPage: React.FC = () => {
    return (
        <MsalProvider instance={msal}>
            <div>
                <button>Sign In</button>
                <p>Show login here and buttons to acquire tokens</p>
            </div>
        </MsalProvider>
    )
}