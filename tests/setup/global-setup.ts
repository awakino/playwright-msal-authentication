import { chromium, FullConfig } from '@playwright/test';
import authSettings from "./auth-config";

// Something to do with the way Playwright loads ES modules means that we have to have the .ts
// on the end of these imports, and that makes Typescript sad
//@ts-ignore
import { getTokens } from './request-tokens.ts';
//@ts-ignore
import { injectTokens, buildAccessTokenEntity, environment } from './process-tokens.ts';
//@ts-ignore
import { getClientSecret, getPassword } from './get-secrets.ts';

const {
  clientId,
  apiScopes,
} = authSettings;

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // get the values of the client secret and account password, either from a key vault or
  // from environment variables (which makes this easier to use in a CD pipeline)
  authSettings.clientSecret = process.env.E2E_TEST_CLIENT_SECRET || await getClientSecret();
  authSettings.password = process.env.E2E_TEST_PASSWORD || await getPassword();
  
  // make a request to AAD to get a token, and then transform it into the 
  // expected local storage values
  let response = await getTokens(authSettings, ["profile", "openid", "offline_access", "User.Read"]);

  // process the response into a set of token entities as expected by MSAL
  const tokens = injectTokens(response);

  // create a session object in the structure expected by playwright using the constructed entities
  const session = {
    cookies: [],
    origins: [
      {
        origin: process.env.TEST_ENVIRONMENT_URL || "http://localhost:5174",
        localStorage: [
          {name: tokens.accountKey, value: tokens.accountEntity},
          {name: tokens.refreshTokenKey, value: tokens.refreshTokenEntity},
          {name: tokens.idTokenKey, value: tokens.idTokenEntity},
          {name: tokens.accessTokenKey, value: tokens.accessTokenEntity}
        ]
      }
    ]
  };

  // if there are any additional scopes e.g. for a backend API, a second request for an access token
  // needs to be made. This will only return an access token (no id or refresh tokens) and we create
  // and store the same type of entity as above
  if (authSettings.apiScopes.length > 0) {
    // request an access token for the API
    response = await getTokens(authSettings, apiScopes);

    // find the tenant and account from the already acquired id token
    const realm = session.origins[0].localStorage[0].value.realm;
    const homeAccountId = session.origins[0].localStorage[0].value.homeAccountId;

    // generate the MSAL objects
    const apiAccessTokenKey = `${homeAccountId}-${environment}-accesstoken-${clientId}-${realm}-${apiScopes}`;
    const apiAccessTokenEntity = buildAccessTokenEntity(
      homeAccountId,
      response.access_token,
      response.expires_in,
      response.ext_expires_in,
      realm, 
      apiScopes.join(" ")
    );

    // add to the session object
    session.origins[0].localStorage.push({name: apiAccessTokenKey, value: apiAccessTokenEntity});
  }

  // update the page context with that session (although technically it goes into local storage
  // not session storage - playwright doesn't support session storage for this)
  for (const { origin, localStorage } of session.origins) {
    // 1.1 Navigate to the origin
    await page.goto(origin);

    // 1.2 Loop through the items in localStorage and assign them
    for (const { name, value } of localStorage) {
      await page.evaluate(([name, value]) => {
        window.localStorage.setItem(name, JSON.stringify(value));
      }, [name, value]);
    }
  }

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: 'auth-storage-state.json' });
  await browser.close();
}

export default globalSetup;