import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Reads AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET and
// APP_BASE_URL from the environment (see .env.example).
export const auth0 = new Auth0Client({
  // Don't mount /auth/access-token: tokens stay server-side (use getAccessToken()),
  // so an XSS on the web origin can't read a bearer token for the API.
  enableAccessTokenEndpoint: false,
  authorizationParameters: {
    // Request an access token for the classFlow API, not just an ID token.
    audience: process.env.AUTH0_AUDIENCE,
    scope: "openid profile email offline_access",
  },
});
