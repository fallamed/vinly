# Task 03 — Leggere il "now playing"

**Obiettivo**: vedere in pagina cosa sta ascoltando l'altro account, aggiornato ogni ~5 secondi, con copertina.
**Stima**: ~2 ore.

## Endpoint

`GET https://api.spotify.com/v1/me/player/currently-playing`

Campi che ci interessano:
- `item.name`, `item.artists[].name`, `item.album.name`
- **`item.album.images[]`** → la copertina per il centro del vinile (arrivano 3 taglie: 640, 300, 64 px — per il disco basta la 300)
- `progress_ms`, `item.duration_ms`, `is_playing`
- `item.uri` (serve al task 05 per il sync)

## Implementazione spike

1. Route `/api/now-playing` che inoltra la chiamata con il token del cookie.
2. Pagina `/debug` con `setInterval` 5000ms che mostra: traccia, artista, `progress_ms`, copertina, `is_playing`.
3. Aprire i due browser fianco a fianco: A mette play su Spotify, B deve vederlo entro ~5s.

## Casi limite da provare DAVVERO (non solo leggere i docs)

- [ ] **Niente in riproduzione** → risposta `204 No Content` (body vuoto): gestire senza crash.
- [ ] **Episodio di podcast** → `currently_playing_type: "episode"`, `item` può essere `null` senza scope extra.
- [ ] **Brano locale** (file importato) → `item.uri` è `spotify:local:...`, niente copertina.
- [ ] **Pausa** → `is_playing: false`: il disco dovrà fermarsi (task 04).
- [ ] **Rate limit**: con polling a 5s × 2 account per ~30 min, arriva mai un `429`? Annotare l'header `Retry-After` se sì.

## Da annotare

- [ ] Latenza reale tra "premo play su Spotify" e "lo vedo nel polling" (stimare la media su 5 prove).
- [ ] `progress_ms` è affidabile o salta?

## Fatto quando

B vede la traccia + copertina di A aggiornarsi da sola, e i 4 casi limite non rompono la pagina.
