# Task 01 — Creare l'app su Spotify Dashboard

**Obiettivo**: avere un Client ID utilizzabile e i 2 account di test autorizzati.
**Stima**: ~30 min (più eventuale attesa di verifica email).

## Passi

1. Andare su https://developer.spotify.com/dashboard e creare un'app (nome: `vinly-spike`).
2. **Redirect URI**: `http://127.0.0.1:3000/api/auth/callback`
   ⚠️ Spotify per le app nuove **non accetta più `localhost`**: serve l'IP di loopback `127.0.0.1` (o HTTPS). Aprire anche il browser su `127.0.0.1:3000`, non su `localhost:3000`, altrimenti i cookie non tornano.
3. Tipo API: selezionare **Web API** e **Web Playback SDK**.
4. In **User Management** aggiungere nome + email di **entrambi** gli account di test (l'app nasce in Development Mode: max 25 utenti in allowlist, chiunque altro riceve 403).
5. Salvare il **Client ID** in `.dev.vars` (`SPOTIFY_CLIENT_ID=...`). Con PKCE il client secret non serve.

## Scope da richiedere (servono dopo, decisi ora)

```
user-read-private user-read-email
user-read-currently-playing user-read-playback-state
user-modify-playback-state streaming
```

## Da annotare

- [ ] Il dashboard ha chiesto vincoli o review inattese?
- [ ] Leggere in diagonale la [Developer Policy](https://developer.spotify.com/policy): c'è qualcosa che vieta di mostrare il now-playing di un utente ad altri utenti? (Punto critico per tutta l'app — verificare la sezione su consenso e dati di terzi.)

## Fatto quando

Entrambi gli account sono in allowlist e il Client ID è in `.dev.vars`.
