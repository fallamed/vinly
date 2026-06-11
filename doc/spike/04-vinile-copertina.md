# Task 04 — Vinile con copertina che gira in fase

**Obiettivo**: il componente-firma di Vinly, in versione grezza: un disco che gira con **la copertina vera al centro**, il cui angolo è derivato da `progress_ms` (così due utenti sulla stessa traccia vedono lo stesso angolo).
**Stima**: ~2–3 ore.

## Specifica

1. **Struttura**: cerchio nero (il disco, con i solchi: bastano 3–4 ring concentrici) + al centro la **copertina dell'album ritagliata a cerchio** (`border-radius: 50%`, ~35% del diametro — come l'etichetta di un vero LP) + foro centrale.
2. **Rotazione in fase, non animazione libera**:
   - il poll restituisce `progress_ms` a `fetchedAt`;
   - tra un poll e l'altro si estrapola: `posStimata = progress_ms + (Date.now() - fetchedAt)` (solo se `is_playing`);
   - `angolo = (posStimata % PERIODO) / PERIODO * 360` con `PERIODO = 1800ms` (33⅓ giri/min come un vero LP);
   - applicato con `requestAnimationFrame` su `transform: rotate(...)`. **Niente animazione CSS infinita**: l'angolo deve essere deterministico.
3. **Pausa** (`is_playing: false`): il disco si ferma all'angolo corrente (niente reset).
4. La copertina ruota **insieme** al disco (è incollata, come una vera etichetta).

## Test di accettazione (il momento della verità)

- [ ] Due browser fianco a fianco sulla **stessa traccia**: i due dischi girano visibilmente **allo stesso angolo** (foto allo schermo per verificare).
- [ ] Pausa su Spotify → il disco si ferma entro un ciclo di poll.
- [ ] Seek (salto avanti nella traccia) → l'angolo "scatta" coerentemente al nuovo `progress_ms`.
- [ ] Traccia senza copertina (brano locale, task 03) → fallback decente (etichetta a tinta unita, magenta `#E64DA8`).

## Da annotare

- [ ] La rotazione è fluida o serve `will-change: transform`?
- [ ] L'estrapolazione tra poll produce "salti" visibili quando arriva il poll successivo? (Se sì: nell'MVP servirà uno smoothing/lerp — annotare l'entità del salto.)

## Fatto quando

Screenshot dei due browser con i dischi in fase, copertina vera al centro.
