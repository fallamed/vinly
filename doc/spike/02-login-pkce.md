# Task 02 — Login OAuth con PKCE

**Obiettivo**: due route Next.js (`/api/auth/login`, `/api/auth/callback`) che portano a un access token valido, per entrambi gli account.
**Stima**: ~2–3 ore.

## Flusso

1. `/api/auth/login`:
   - genera `code_verifier` random (43–128 char) e `code_challenge = base64url(sha256(verifier))`;
   - salva il verifier in un cookie `httpOnly`;
   - redirect a `https://accounts.spotify.com/authorize` con `response_type=code`, `client_id`, `redirect_uri`, `scope` (vedi task 01), `code_challenge_method=S256`, `code_challenge`.
2. `/api/auth/callback`:
   - riceve `?code=`, lo scambia con `POST https://accounts.spotify.com/api/token` (`grant_type=authorization_code` + `code_verifier`);
   - riceve `access_token` (scade in 3600s) + `refresh_token`.
3. **Storage da spike**: token in cookie `httpOnly` (niente DB). Per simulare 2 utenti contemporaneamente: un account in Chrome, l'altro in una finestra in incognito (o altro browser).
4. Refresh (`grant_type=refresh_token`): implementarlo solo se lo spike dura abbastanza da far scadere i token — altrimenti annotare e basta.

## Trappole note

- Browser su `127.0.0.1`, non `localhost` (cookie + redirect URI devono combaciare).
- Il refresh token con PKCE **ruota**: ogni refresh ne restituisce uno nuovo da risalvare (rilevante per l'MVP, annotarlo).

## Da annotare

- [ ] Lo scambio token funziona al primo colpo? Errori strani?
- [ ] Quali dati utili arrivano da `GET /v1/me` (display name, avatar, country, `product` free/premium)?
  → `product` ci serve nell'MVP per la logica "Premium-only sync".

## Fatto quando

Una pagina `/debug` mostra "Loggato come {display_name} ({product})" per entrambi gli account in due browser.
