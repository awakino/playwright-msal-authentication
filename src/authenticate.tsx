import * as React from "react";
import { useMsal, useIsAuthenticated, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import AuthConfig from "../config/auth-config";
import { CacheLookupPolicy, InteractionRequiredAuthError } from "@azure/msal-browser";

export const AuthenticationPage: React.FC = () => {
    const {instance, accounts} = useMsal();
    const authenticated = useIsAuthenticated()
    const [token, setToken] = React.useState<string | undefined>("");

    const login = async () => {
        const r = {
            scopes: AuthConfig.scopes
        };

        try {
            await instance.ssoSilent(r);
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                await instance.loginPopup(r).catch(err => {
                    // handle error in popup flow
                    console.log(err);
                });
            } else {
                // handle unexpected error
                console.log(error);
            }
        }
    };

    const getToken = async () => {
        
        const token = await instance.acquireTokenSilent({
            scopes: AuthConfig.scopes,
            account: accounts[0],
            cacheLookupPolicy: CacheLookupPolicy.Default
        });
        
        setToken(token?.accessToken);
    };

    return (
            <div>
                <UnauthenticatedTemplate>
                    <button onClick={login}>Sign In</button>
                    <p data-testid="no-auth-text">No user has been signed in yet</p>
                </UnauthenticatedTemplate>
                <AuthenticatedTemplate>
                    <button onClick={() => instance.logout({
                            authority: AuthConfig.authority
                        })}>Sign Out</button>
                        <br />
                    <h3>Signed In Account</h3>
                    <p>{accounts[0]?.username}</p>
                    <br />
                    <h3>Access Token</h3>
                    {token ?
                        <p>{token}</p>
                    : 
                        <button onClick={getToken}>Acquire Token</button>
                    }
                </AuthenticatedTemplate>
            </div>
    )
}