# watch by zuup

## Zuup Auth Integration Guide

This app uses Zuup Auth with OAuth 2.1 + PKCE. The flow is designed so that your frontend only starts the login, while the server handles the token exchange and any profile linking.

### What Zuup Auth gives you

- A hosted login at `https://auth.zuup.dev`
- OAuth 2.1 authorization code flow with mandatory PKCE
- Optional OIDC profile data through the `openid`, `profile`, and `email` scopes
- First-party behavior for `zuup.dev` apps, which skips the consent screen

If your site is not on a `zuup.dev` domain, users will see the consent screen before returning to your app.

## Quick Setup

1. Register your app in Zuup Auth.
2. Set the callback URL in Zuup to your app’s callback route.
3. Add the client-side and server-side environment variables.
4. Send the user to Zuup with PKCE parameters.
5. Handle the callback and exchange the code on your server.
6. Store the returned session and load the profile.

## Step 1: Register the app

Go to `https://auth.zuup.dev/signup`, then open your profile and register a new app.

Use the exact callback URL your app will receive after login. In this project the callback route is:

- `/auth/zuup/callback`
- `/callback` is also supported as a fallback route

Add every production and preview domain you plan to use. If the app is hosted on a `zuup.dev` domain, Zuup treats it as first-party.

## Step 2: Set environment variables

Split the values by where they are used.

### Client-side variables

These are read by the browser code and must use the `VITE_` prefix.

- `VITE_ZUUP_CLIENT_ID`
- `VITE_ZUUP_REDIRECT_URI`
- `VITE_ZUUP_AUTH_URL` or `VITE_ZUUP_AUTHORIZE_URL`
- `VITE_ZUUP_TOKEN_URL` if you need to override the token endpoint
- `VITE_ZUUP_TOKEN_EXCHANGE_URL` if you use a custom backend exchange route
- `VITE_ZUUP_SCOPE`

Recommended defaults:

- `VITE_ZUUP_AUTH_URL=https://auth.zuup.dev`
- `VITE_ZUUP_SCOPE=openid profile email offline_access`
- `VITE_ZUUP_REDIRECT_URI=https://your-domain.com/auth/zuup/callback`

### Server-side variables

These stay private and must never be exposed to the browser.

- `ZUUP_CLIENT_ID`
- `ZUUP_CLIENT_SECRET`
- `ZUUP_REDIRECT_URI`
- `ZUUP_TOKEN_URL` or `ZUUP_OAUTH_TOKEN_URL`
- `ZUUP_USERINFO_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

If you are deploying to Vercel, put the client secret only in server env vars, not in any `VITE_` variable.

## Step 3: Start login from the frontend

The frontend should generate a PKCE verifier/challenge, store the verifier in `sessionStorage`, and redirect the browser to Zuup.

In this repo, the helper lives in [`src/lib/zuupAuth.ts`](src/lib/zuupAuth.ts).

Example:

```ts
import { loginWithZuup } from "@/lib/zuupAuth";

export function LoginButton() {
	return <button onClick={() => void loginWithZuup()}>Login with Zuup</button>;
}
```

What happens under the hood:

- A random `state` is generated for CSRF protection
- A PKCE verifier is generated in the browser
- The SHA-256 code challenge is sent to Zuup
- The user is redirected to `https://auth.zuup.dev/authorize`

Required query parameters include:

- `client_id`
- `redirect_uri`
- `response_type=code`
- `scope`
- `state`
- `code_challenge`
- `code_challenge_method=S256`

## Step 4: Handle the callback

Zuup redirects the user back to your callback page with an authorization code.

This project supports both:

- `https://your-domain.com/auth/zuup/callback`
- `https://your-domain.com/callback`

The callback page must do three checks before it accepts the login:

1. Confirm the returned `state` matches the saved `sessionStorage` state
2. Confirm the browser still has the PKCE verifier
3. Exchange the authorization code for tokens

See [`src/pages/ZuupCallback.tsx`](src/pages/ZuupCallback.tsx) for the exact flow.

## Step 5: Exchange the code on the server

Do not put the Zuup client secret in the browser.

The callback page posts the code and verifier to the server exchange endpoint in [`api/zuup/token-exchange.js`](api/zuup/token-exchange.js). That endpoint:

- Sends the authorization code to Zuup’s token endpoint
- Uses the server-side `ZUUP_CLIENT_SECRET`
- Fetches `userinfo` from Zuup
- Optionally links the Zuup user to a Supabase profile

The upstream token endpoint used by this project is:

- `https://auth.zuup.dev/api/oauth/token`

The userinfo endpoint used by this project is:

- `https://auth.zuup.dev/api/oauth/userinfo`

## Step 6: Persist the session

After a successful exchange, the callback page stores the returned session in local storage and emits an update event so the app can react immediately.

In this repo, the callback route lives in [`src/pages/ZuupCallback.tsx`](src/pages/ZuupCallback.tsx), and the route is registered in [`src/App.tsx`](src/App.tsx).

The auth provider then reads that session and maps it into the app’s profile shape in [`src/hooks/useAuth.tsx`](src/hooks/useAuth.tsx).

## Recommended scope set

For most apps, start with:

- `openid`
- `profile`
- `email`
- `offline_access` if you need refresh tokens

Only request `zuup:read`, `zuup:write`, or `zuup:admin` if your app truly needs them.

## Common mistakes

- Using a `/api/` URL as the redirect URI instead of a real callback page
- Putting `ZUUP_CLIENT_SECRET` in browser-visible env vars
- Forgetting to save the PKCE verifier before redirecting
- Mismatching the callback URL between Zuup and your app
- Requesting scopes that were not registered for the app

## Example end-to-end flow

1. User clicks `Login with Zuup`
2. Frontend generates PKCE and redirects to Zuup
3. User signs in at `auth.zuup.dev`
4. Zuup redirects back to `/auth/zuup/callback?code=...&state=...`
5. Callback validates `state`
6. Callback posts the code and verifier to `/api/zuup/token-exchange`
7. Server exchanges the code and fetches `userinfo`
8. App stores the session and routes the user into the app

## If you are integrating Zuup into another site

Use the same pattern this project uses:

- Frontend: generate PKCE and redirect to Zuup
- Callback page: validate state, then send the code to your backend
- Backend: exchange the code with `client_secret`
- App state: store the session and hydrate the user profile

If you want, I can also turn this into a shorter developer-facing setup page or a copy-ready docs page for external site admins.
