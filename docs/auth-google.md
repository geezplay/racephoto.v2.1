# Google Authentication

The API implements the OAuth 2.0 Authorization Code flow server-side using
[`google-auth-library`](https://github.com/googleapis/google-auth-library-nodejs). The browser is
only ever redirected to the API — no Google client secret or token handling happens in the SPA.

## 1. Create OAuth credentials

In the Google Cloud Console create an **OAuth 2.0 Client ID** (type: *Web application*) with the
authorized redirect URI pointing at the API callback:

```
http://localhost:5000/api/auth/google/callback      # development
https://api.geezplay.site/api/auth/google/callback  # production
```

## 2. Configure environment

Set the following in `apps/api/.env` (never commit real values):

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

## 3. Flow

1. User clicks **Continue with Google** on `/login` or `/register`. The button links to
   `GET /api/auth/google`.
2. The API redirects to Google with a signed, short-lived `state` value (CSRF protection).
3. Google redirects back to `GET /api/auth/google/callback?code=...&state=...`.
4. The API verifies `state`, exchanges the code, and verifies the `id_token` audience/issuer.
5. The verified Google identity (`sub`, `email`, `name`) is used to find or create a user:
   - new accounts get `role: buyer` and `auth_provider: google`;
   - an existing local account with the same email is **not** auto-linked (returns
     `error=email_conflict`) to avoid account takeover.
6. The API issues the normal JWT and redirects to
   `${FRONTEND_URL}/auth/callback?token=...`, where the SPA stores it and loads the profile.

## Security properties

- The client secret and token verification stay on the server.
- The Google `id_token` is verified server-side; profile data is never trusted from the client.
- `state` prevents forged callbacks.
- Admin roles can never be granted through registration or Google sign-in.

## Limitations

End-to-end verification requires real Google credentials. Without them the flow returns
`error=google_not_configured` and the button is non-functional by design (no simulation is used).
