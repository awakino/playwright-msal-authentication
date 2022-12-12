import { chromium, FullConfig } from '@playwright/test';
import authSettings from "./auth-constants";

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

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  authSettings.clientSecret = process.env.E2E_TEST_CLIENT_SECRET || await getClientSecret();
  authSettings.password = process.env.E2E_TEST_PASSWORD || await getPassword();

  // make a request to AAD to get a token, and then transform it into the 
  // expected local storage values
  let response = await getTokens(authSettings, ["profile", "openid", "offline_access", "User.Read"]);
  const tokens = injectTokens(response);

  // push the values to the local storage of the page
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

  if (authSettings.apiScopes.length > 0) {
    // request an access token for the API
    response = await getTokens(authSettings, apiScopes);
    const realm = session.origins[0].localStorage[0].value.realm;
    const homeAccountId = session.origins[0].localStorage[0].value.homeAccountId;
    const apiAccessTokenKey = `${homeAccountId}-${environment}-accesstoken-${clientId}-${realm}-${apiScopes}`;
    const apiAccessTokenEntity = buildAccessTokenEntity(
      homeAccountId,
      response.access_token,
      response.expires_in,
      response.ext_expires_in,
      realm, 
      apiScopes.join(" ")
    );

    session.origins[0].localStorage.push({name: apiAccessTokenKey, value: apiAccessTokenEntity});
  }

  for (const { origin, localStorage } of session.origins) {
    // 1.1 Navigate to the origin
    await page.goto(origin);

    // 1.2 Loop through the items in localStorage and assign them
    for (const { name, value } of localStorage) {
      await page.evaluate(([name, value]) => {
        //const [name, value] = args.split(',');
        window.localStorage.setItem(name, JSON.stringify(value));
        // console.log(JSON.stringify(window.localStorage));
      }, [name, value]);
    }
  }

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: 'auth-storage-state.json' });
  await browser.close();
}

export default globalSetup;