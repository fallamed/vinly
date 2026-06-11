# Task 05 — Sync del playback

**Obiettivo**: il click che giustifica l'app. B preme "Sync & Listen" e il suo Spotify parte sulla traccia di A, alla stessa posizione. Misurare il drift.
**Stima**: ~3–4 ore. Richiede che **B sia Premium**.

## Implementazione

1. Bottone "Sync" nella pagina `/debug` di B che:
   - legge il now-playing di A (`item.uri` + `progress_ms` + `fetchedAt`);
   - compensa la latenza: `position_ms = progress_ms + (Date.now() - fetchedAt)`;
   - chiama `PUT https://api.spotify.com/v1/me/player/play` con body `{ "uris": ["spotify:track:..."], "position_ms": ... }`.
2. **Serve un device attivo** su B, altrimenti `404 NO_ACTIVE_DEVICE`. Due strade da provare entrambe:
   - **(a) Client Spotify aperto** (desktop/mobile): la via facile per lo spike. Se il 404 arriva comunque, recuperare l'id da `GET /v1/me/player/devices` e passare `?device_id=`.
   - **(b) Web Playback SDK nel browser**: `<script src="https://sdk.scdn.co/spotify-player.js">`, creare il player, ottenere il `device_id`, trasferire la riproduzione. È la strada dell'MVP (l'audio esce *dall'app*) — provarla anche solo a livello "funziona/non funziona".
3. **Misurare il drift**: dopo il sync, pollare il now-playing di entrambi e calcolare `|progress_A - progress_B|`. Stampare il valore in pagina. Ripetere 5 volte e annotare media e peggior caso.

## Casi da provare

- [ ] Sync mentre A è in pausa → cosa ha senso fare? (Proposta: partire in pausa alla stessa posizione, o disabilitare il bottone.)
- [ ] A cambia traccia dopo il sync → B resta sulla vecchia (per lo spike va bene: il "follow continuo" è logica da MVP — qui basta annotare che serve).
- [ ] B è Free → la PUT risponde `403 PREMIUM_REQUIRED`: verificare che l'errore sia riconoscibile (ci serve per l'UX Premium-only).

## Da annotare (i numeri che decidono il verdetto)

- [ ] **Drift medio e massimo** su 5 sync (obiettivo: ≤ 2s percepiti).
- [ ] Latenza della PUT (da click a musica che parte).
- [ ] Il Web Playback SDK (strada b) si inizializza senza drammi in dev?

## Fatto quando

Video/registrazione dei due account che suonano la stessa traccia dopo un click, con il drift stampato in pagina. → Compilare il **verdetto** nel [README](./README.md).
