import { decode, JwtPayload } from "jsonwebtoken";
import authSettings from "./auth-config";

export const environment = "login.windows.net";

const {
    clientId,
  } = authSettings;

const buildAccountEntity = (
  homeAccountId,
  realm,
  localAccountId,
  username,
  name
) => {
  return {
    authorityType: "MSSTS",
    // This value does not seem to get used, so we can leave it out.
    clientInfo: "",
    homeAccountId: homeAccountId,
    environment: environment,
    realm: realm,
    localAccountId: localAccountId,
    username: username,
    name: name,
  };
};

const buildIdTokenEntity = (
  homeAccountId, 
  idToken, 
  realm
) => {
  return {
    credentialType: "IdToken",
    homeAccountId: homeAccountId,
    environment: environment,
    clientId: clientId,
    secret: idToken,
    realm: realm,
  };
};

export const buildAccessTokenEntity = (
  homeAccountId,
  accessToken,
  expiresIn,
  extExpiresIn,
  realm,
  scopes: string
) => {
  const now = Math.floor(Date.now() / 1000);
  return {
    homeAccountId: homeAccountId,
    credentialType: "AccessToken",
    secret: accessToken,
    cachedAt: now.toString(),
    expiresOn: (now + expiresIn).toString(),
    extendedExpiresOn: (now + extExpiresIn).toString(),
    environment: environment,
    clientId: clientId,
    realm: realm,
    target: scopes.toLowerCase(),
    // Scopes _must_ be lowercase or the token won't be found
  };
};

const buildRefreshTokenEntity = (
  clientId,
  environment,
  homeAccountId,
  refreshToken
) => {
  return {
    clientId: clientId,
    credentialType: "RefreshToken",
    environment: environment,
    homeAccountId: homeAccountId,
    secret: refreshToken
  };
}

export const injectTokens = (tokenResponse) => {
  const idToken = decode(tokenResponse.id_token) as JwtPayload;
  const localAccountId = idToken.oid || idToken.sid;
  const realm = idToken.tid;
  const homeAccountId = `${localAccountId}.${realm}`;
  const username = idToken.preferred_username;
  const name = idToken.name;
  const response: any = {};
  const scopes = tokenResponse.scope;

  response.accountKey = `${homeAccountId}-${environment}-${realm}`;
  response.accountEntity = buildAccountEntity(
    homeAccountId,
    realm,
    localAccountId,
    username,
    name
  );

  if (tokenResponse.id_token) {
    response.idTokenKey = `${homeAccountId}-${environment}-idtoken-${clientId}-${realm}-`;
    response.idTokenEntity = buildIdTokenEntity(
      homeAccountId,
      tokenResponse.id_token,
      realm
    );
  }

  response.accessTokenKey = `${homeAccountId}-${environment}-accesstoken-${clientId}-${realm}-${scopes}`;
  response.accessTokenEntity = buildAccessTokenEntity(
    homeAccountId,
    tokenResponse.access_token,
    tokenResponse.expires_in,
    tokenResponse.ext_expires_in,
    realm,
    scopes
  );
  
  if (tokenResponse.refresh_token) {
    response.refreshTokenKey = `${homeAccountId}-${environment}-refreshtoken-${clientId}--`;
    response.refreshTokenEntity = buildRefreshTokenEntity(
      clientId,
      environment,
      homeAccountId,
      tokenResponse.refresh_token
    );
  }

  return response;
};