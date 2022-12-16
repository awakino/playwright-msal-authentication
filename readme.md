# Playwright Authentication with AAD and MSAL.js

## Background
Out of the box, Playwright struggles to work with single page applications that authenticate to Azure Active Directory using the MSAL.JS library. Best practice recommends against interacting with the AAD login flow UI directly as this is not under your control and can lead to increased test fragility. This sample application demonstrates an alternative approach.  
Rather than interacting with the login UI itself, this approach uses a global setup script that makes an ROPC request directly to the AAD OAuth token endpoint with the credentials of a test user. It then constructs the same JSON objects that MSAL uses and stores them in the browser context's local storage (just as MSAL does). Finally it saves that local storage state to a file. When each test runs, Playwright creates the test context using that snapshot of the local storage which in turn means that MSAL believes the user to be already authenticated with cached tokens available in local storage. Subsequent requests for API access tokens will use the cached token, or request a new one using the cached credentials.  
The storage state file could be committed to source control, but would need to be regenerated periodically as the tokens expire. It is easier to generate the tokens at the beginning of each test run so that the tokens being used in that run are always fresh.

## Setup
### AAD Configuration

1. Azure Active Directory Setup  
- A Registered App needs to be created in Azure Active Directory (AAD) for the application to authenticate against. The instructions to do so can be found [here](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app). It should be a *single tenant* application with a platform type of *SPA*. The Redirect URI may vary depending on the port Vite decides to use but it will be something like *http://localhost:5174*. Note down the Client ID and the Tenant ID of the new app registration.
- A test user should be created in AAD. While an existing user could be used it is sensible to create a specific one whose permissions can be tightly controlled. Make sure that MFA is disabled for the account as this approach will not work with MFA.

2. Create a Client Secret  
Generate a client secret for the new registered app. Instructions are on the same page linked above.

3. Azure Key Vault Setup  
If a key vault is not already available, create one in Azure. Then create two secrets:
- The client secret generated for the registered app
- The password for the test user account

### App Configuration
There are two config objects in the sample that need to be configured; one is for the application itself and the other is used by the Playwright tests.

#### Application Configuration
The application configuration is in the file *config/auth-config.ts*.  
```
export default {
    clientId: "<client id of registered app in AAD>",
    authority: "https://login.microsoft.com/<tenant id>",
    scopes: ["User.Read"]
}
```

The clientId value should be replaced with the Client ID of the registered app created above. The '\<tenant id\>' segment of the authority should be replaced with the AAD tenant id of the registered app.

#### Test Configuration
The test authentication configuration is in the file *tests/setup/auth-config.ts*.  
```
export default {
	authority: "https://login.microsoftonline.com/<tenant id>",
	clientId: "<client id of registered app in AAD>",
	apiScopes: [],
	username: "<test username in name@domain.com format>",
	keyVault: "<key vault name>",
	password: "<name of secret in key vault>",
	clientSecret: "<name of secret in key vault>"
}
```
The tenant and client ids should be replaced with the same ones used in the application configuration. The username value is the username of the test user account in *user@domain.com* format.  
Update the name of the key vault that the secrets where stored in, and the values of the password and clientSecret fields should be the names of the corresponding secrets.

## Run the Sample
Once the configuration is updated  

- Install the dependencies -  
`yarn`
- Run the tests  
`yarn test` 

## CI/CD
- GitHub Actions  
This sample also works in a GitHub Actions workflow by using the *Azure/get-keyvault-secrets* action to obtain the secrets and then setting the values as environment variables on the test runner step. An example set of steps would be:
```
steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - uses: Azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - uses: Azure/get-keyvault-secrets@v1
        with: 
          keyvault: "<key vault name>"
          secrets: 'registeredappsecret, testuserpassword'
        id: testsecrets
      - name: Install dependencies
        run: yarn
      - name: Install Playwright Browsers
        run: yarn playwright install --with-deps
      - name: Run Playwright tests
        run: yarn playwright test
        env:
          E2E_TEST_CLIENT_SECRET: ${{ steps.testsecrets.outputs.registeredappsecret }}
          E2E_TEST_PASSWORD: ${{ steps.testsecrets.outputs.testuserpassword }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

- Azure DevOps

## Credits
This approach was derived from the following post illustrating how to do the same thing using Cypress instead of Playwright - [medium.com](https://medium.com/version-1/using-cypress-to-test-azure-active-directory-protected-spas-47d04f5add9)
