# Spike Spotify — piano operativo

> **Obiettivo**: dimostrare in 1–2 giorni che il cuore di Vinly è tecnicamente fattibile con l'API di Spotify. Codice usa-e-getta: niente DB, niente stanze, niente design — solo la catena `login → leggo cosa ascolti → mi sincronizzo`.

## Regole del gioco

- **È uno spike, non l'MVP.** Hardcodare tutto il possibile (2 account, token in cookie, zero error handling elegante). Il codice si butta a fine spike; sopravvivono solo le *conoscenze* (annotate nei singoli task).
- Servono **2 account Spotify reali**, di cui **almeno 1 Premium** (per il task 05 meglio 2 Premium).
- Si lavora su `npm run dev` (Node runtime) — la portabilità su Workers NON è oggetto dello spike.

## Task (in ordine, ognuno sblocca il successivo)

| # | Task | Esito che sblocca il prossimo |
|---|------|-------------------------------|
| 01 | [Creare l'app su Spotify Dashboard](./01-app-spotify.md) | Client ID + redirect URI funzionante, 2 account in allowlist |
| 02 | [Login OAuth PKCE](./02-login-pkce.md) | Access token valido per entrambi gli account |
| 03 | [Leggere il "now playing"](./03-now-playing.md) | Vedo traccia + copertina + posizione dell'altro account, aggiornati ogni ~5s |
| 04 | [Vinile con copertina che gira in fase](./04-vinile-copertina.md) | Disco con copertina vera al centro, angolo derivato da `progress_ms` |
| 05 | [Sync del playback](./05-sync.md) | Premo "sync" e i due account suonano la stessa traccia con drift misurato |

## Verdetto finale (da compilare a fine spike)

Lo spike è **promosso** se:
- [ ] Il login PKCE funziona per entrambi gli account senza intoppi
- [ ] Il polling del now-playing regge a 5s di intervallo senza rate limit (2 utenti)
- [ ] La copertina si recupera in modo affidabile per tracce normali (e si è capito cosa succede con podcast/brani locali)
- [ ] Il sync ha un **drift ≤ 2 secondi** percepito
- [ ] Nessun blocco di policy emerso leggendo la Developer Policy rispetto a ciò che abbiamo costruito

Se anche uno di questi fallisce in modo non aggirabile → fermarsi e ripensare l'idea **prima** di scrivere l'MVP.

**Note/scoperte:**

- *(2026-06-10, task 01–02)* Login PKCE funziona al primo colpo. Trappola confermata: flusso partito da `localhost` → cookie su host sbagliato → state mismatch. Aggiunto redirect automatico `localhost → 127.0.0.1` nella route di login.
- *(2026-06-11, task 03)* ⚠️ **Diagnosi completa del "poll #0"**: su questa macchina QUALCOSA a livello di sistema blocca i WebSocket *dei browser* (Safari E Chrome) verso i server locali — `curl` fa l'handshake 101 perfettamente, il Chromium sandbox pure. In dev il client HMR di Next, non riuscendo a connettersi, **ricarica la pagina in loop** e React non si idrata mai (per questo il polling non partiva). **In build di produzione (niente HMR) tutto funziona ovunque.** Workflow spike: testare su `npm run build && npm run start`. Candidati del blocco da indagare con calma: filtro contenuti macOS (Screen Time), firewall applicativo. Nota: Laravel Herd è installato (non in esecuzione) — verificare anche lui.
- *(2026-06-11, task 03 ✓)* API now-playing validata coi cookie reali: traccia, artisti, copertina 300px, progress, uri — tutto presente e affidabile.
- *(2026-06-11, task 04)* Il vinile deriva l'angolo da `progress_ms` → in tab nascoste `requestAnimationFrame` si sospende, ma al ritorno il disco **si rimette in fase da solo** senza drift: proprietà desiderabile, gratis col design deterministico.
