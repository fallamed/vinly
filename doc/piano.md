# Vinly — Piano e validazione dell'idea

> Community app per ascoltare musica insieme: login con Spotify, stanze d'ascolto condivise, presenza in tempo reale ("cosa sta ascoltando chi"). Vibe: **synthwave / Blade Runner** — lounge notturno digitale, neon su nero. *(Decisione presa il 2026-06-10 dopo confronto tra palette retro-analogica, synthwave e ibrida calda.)*

---

## 1. L'idea in una frase

*"Un lounge digitale dove entri, vedi cosa girano i tuoi amici sul piatto, e ti sintonizzi con loro."*

Il valore non è "ascoltare musica" (quello lo fa Spotify) — è **la presenza sociale attorno alla musica**. Spotify è un'esperienza solitaria con una patina social (le playlist condivise, l'attività amici nascosta nella sidebar desktop). Vinly può essere il contrario: il social prima, la musica come collante.

### Perché può funzionare
- **Nostalgia reale**: l'ascolto condiviso (il negozio di dischi, il salotto col giradischi, le radio pirata) è un rituale che lo streaming ha ucciso. C'è domanda emotiva.
- **Precedenti che validano il bisogno**: Turntable.fm (2011, esplosa e morta per licenze), JQBX, Stationhead, Spotify Jam stesso. Il bisogno esiste; nessuno l'ha vinto con un'identità forte.
- **L'angolo "vinile/lounge" è una differenziazione vera**: tutti i competitor sono utility ("sync your music"). Nessuno è un *posto*. La vibe è il prodotto.

### Rischi da validare (onestà prima di tutto)

| Rischio | Gravità | Note |
|---|---|---|
| **Dipendenza totale da Spotify API** | 🔴 Alta | Vedi §2. È il rischio esistenziale del progetto. |
| **Spotify Jam esiste già** | 🟡 Media | Jam è sync puro, senza community, senza stanze pubbliche, senza identità. Vinly deve vincere su ciò che Jam non fa: scoperta di persone, stanze persistenti, cultura. |
| **Cold start / massa critica** | 🔴 Alta | Una stanza vuota è deprimente. Serve una strategia: stanze tematiche curate, eventi a orario ("listening party del giovedì"), bot/radio di fallback. |
| **Solo utenti Premium** | 🟢 Accettato | Il controllo playback richiede Premium. **Decisione: l'app è Premium-only per il sync**; gli utenti Free possono comunque entrare, vedere, chattare e salvare dischi — solo non sincronizzarsi. |
| **Turntable.fm è morta per le licenze** | 🟢 Bassa per noi | Vinly non streamma audio proprio: ogni utente riproduce dal *proprio* account Spotify. Questo evita il problema licenze — ed è il motivo per cui l'architettura "sync, not stream" è obbligatoria. |

---

## 2. Realtà tecnica Spotify (da verificare SUBITO, prima di scrivere codice)

Questa è la parte che valida o uccide l'idea. Da prototipare nella settimana 1:

1. **OAuth**: Authorization Code Flow with PKCE. Scope chiave: `user-read-currently-playing`, `user-read-playback-state`, `user-modify-playback-state`, `streaming` (per il Web Playback SDK).
2. **"Cosa sto ascoltando"**: endpoint `currently-playing` — è **polling, non push**. Per la presenza in tempo reale servirà un polling lato server (~ogni 5s per utente attivo) + fan-out via WebSocket/Durable Object. Attenzione ai rate limit con molti utenti.
   > **Nota — perché non un cron**: i Cron Trigger di Cloudflare hanno granularità minima di **1 minuto** — troppo lenti per la presenza live, e pollerebbero anche a stanze vuote. L'architettura giusta: il **Durable Object della stanza** polla Spotify (timer/alarm ogni ~5s) **solo finché ci sono WebSocket connessi**, e si ferma quando la stanza si svuota. Costo proporzionale all'uso reale, zero spreco. Un cron può servire semmai per lavori lenti di contorno (refresh token, classifiche settimanali).
3. **Sync playback**: si fa con `PUT /me/player/play` passando `position_ms`. La sincronizzazione sarà *approssimativa* (±1–2s per latenza). Accettabile per un lounge, non per un "DJ set al millisecondo". Meglio abbracciarlo che combatterlo.
4. **Developer Mode**: una nuova app Spotify parte limitata a **25 utenti in allowlist** finché non viene approvata l'estensione di quota. La review di Spotify è diventata severa — pianificare la richiesta presto e leggere la Developer Policy (in particolare le clausole su contenuti sociali e dati di altri utenti).
5. **Web Playback SDK**: permette di fare del browser un device Spotify (solo Premium). È la via per riprodurre *dentro* l'app invece di controllare un client esterno — esperienza molto migliore.

> ⚠️ **Deliverable di validazione**: uno spike usa-e-getta che fa login, legge il currently-playing di 2 account e sincronizza il play su entrambi. Se questo funziona in modo accettabile, l'idea sta in piedi.

---

## 3. Feature — proposta a cerchi concentrici

### MVP — "Il Salotto" (validare il cuore)
- **Login Spotify** (PKCE).
- **Stanze**: crea/entra con link d'invito. Una stanza = un host + ascoltatori.
- **Now Spinning**: nella stanza vedi ogni persona col suo "disco che gira" (come nel mockup — è la metafora giusta).
  - **Al centro del disco c'è la copertina vera della traccia**, recuperata da Spotify (`item.album.images` dal currently-playing), ritagliata a cerchio come l'etichetta di un vinile. Il disco diventa riconoscibile a colpo d'occhio: vedi *cosa* gira prima ancora di leggere il titolo.
- **Sync & Listen**: un click e ti agganci a quello che sta ascoltando qualcuno.
  - **Dischi in fase**: quando il sync parte, i due vinili devono girare *insieme*, allo stesso angolo. Implementazione: l'angolo di rotazione non è un'animazione CSS partita a caso, ma è **derivato da `position_ms`** (`angolo = (position_ms % periodo_giro) / periodo_giro × 360°`). Così due utenti sincronizzati vedono *matematicamente* lo stesso disco nello stesso punto — il sync si *vede*, non si dichiara.
- **Salva il disco** 💿: un click sul vinile di un amico e lo salvi nel tuo scaffale (e opzionalmente in una playlist Spotify "Vinly Crate" via API). Ogni disco salvato ricorda la **provenienza**: *"preso dallo scaffale di @VibeCurator"*. È il crate digging sociale: la collezione diventa una mappa di chi ti ha fatto scoprire cosa.
- **Chat di stanza** minimale.
- *(Stack: Durable Objects per lo stato stanza + WebSocket — siamo già su Cloudflare Workers, è il fit perfetto.)*

### Cerchio 2 — "Il rituale" (retention)
- **Coda condivisa / passaggio del disco**: a turno si "mette su un disco" (modello Turntable: il turno del DJ è il momento sociale).
- **Reazioni analogiche**: niente like — *"alza il volume" 🔊, "questo è un classico" 💿*. Reazioni a tema, non emoji generiche.
- **Stanze persistenti a tema**: "Lo-fi basement", "Soul Kitchen", "Italo Disco". Le stanze sono *luoghi*, hanno un arredamento (skin), regolari, habitué.
- **Eventi a orario**: listening party programmate (risolve il cold start: la gente arriva *insieme*).

### Cerchio 3 — "La collezione" (identità)
- **Scaffale dei dischi**: il profilo è una collezione di vinili (gli album più ascoltati / preferiti), non una lista. Si "sfoglia".
- **Crate digging insieme**: scoperta sociale — "i 5 dischi che girano di più in questa stanza questa settimana".
- **Dedica un disco**: mandi un brano a una persona con una nota scritta a mano (font handwritten). Molto lounge, molto retro.

### Anti-feature (cose da NON fare)
- ❌ Feed algoritmico / infinite scroll — è l'opposto della vibe.
- ❌ Follower count in evidenza — il lounge è intimo, non performativo.
- ❌ Supporto multi-piattaforma (Apple Music ecc.) nell'MVP — raddoppia la complessità per validare la stessa ipotesi.

---

## 4. Validazione del design (mockup "VinylShare / The Studio")

### Cosa funziona ✅
- **Il vinile che gira come avatar del "now playing"** è l'idea visiva più forte del mockup. È identità + funzione (fermo = pausa, gira = play). Tenerla e amplificarla.
- **Layout a card per persona**: giusto — il prodotto è "le persone", non "le tracce".
- **Player persistente in basso** e **chat nella griglia**: gerarchia corretta, pattern familiari.
- **CTA "Sync & Listen"**: il verbo giusto, l'azione core è a un click. Ottimo.

### Decisione di palette ✅ — Synthwave / Blade Runner (opzione B)

Confrontate tre direzioni: **A** retro lounge analogico (crema/terracotta, diurno), **B** synthwave del mockup (blu-nero + neon ciano/magenta), **C** ibrida "Tokyo listening bar" (nero caldo + ambra/salmone). **Scelta: B.** Il mockup attuale è quindi la direzione giusta — si rifinisce, non si ridisegna.

**Token di design da formalizzare (dal mockup):**
- Sfondo base: blu-nero profondo (`#0B0E1A` circa), superfici card leggermente più chiare (`#11152A`).
- Accenti neon: **ciano** (`#4DD8E6`) = azione primaria / "live"; **magenta** (`#E64DA8`) = identità / highlight. Due neon bastano: ogni colore in più diluisce la vibe.
- Il neon è per *accenti e stati attivi*, non per il testo lungo: titoli e metadati restano su scala di grigi-blu chiari.
- Glow con parsimonia: solo sugli elementi *vivi* (il disco che gira, il pulsante live). Glow ovunque = glow da nessuna parte.
- Come tenere il lato "retro" dentro il synthwave: il vinile, la puntina, il crackle, gli scanline/CRT leggeri, tipografia con un tocco anni '80. Il retro qui è *retrofuturismo*, e va bene così.

### Critiche da risolvere ⚠️ (valide a maggior ragione con la palette scura)

1. **Contrasto e leggibilità insufficienti.** I metadati (artista, sottotitoli, chat) sono grigio scuro su nero — sotto le soglie WCAG quasi ovunque nel mockup. Con la scelta synthwave questo diventa il punto critico n°1: alzare i grigi dei testi secondari (almeno `#8A94B8` su `#0B0E1A`) e verificare ogni coppia testo/sfondo con un contrast checker.

2. **Gerarchia tra le card piatta.** Tutte le card hanno lo stesso peso: chi è l'host? Qual è la stanza "principale"? Cosa sto ascoltando *io*? Serve una gerarchia: la mia card / quella dell'host più grande o ancorata.

3. **"Master Sync" vs "Sync & Listen"**: due etichette per azioni simili confondono. Un solo verbo per l'azione core.

4. **La chat dentro la griglia delle card** funziona a 5 utenti, collassa a 12. Meglio pannello laterale ancorato (desktop) / drawer (mobile).

5. **Manca lo stato vuoto.** La card "+ invita" c'è, ma la stanza con 1 persona sola è lo scenario più frequente all'inizio: va disegnata per essere accogliente, non desolata (es. "la radio del lounge" che suona finché non arriva qualcuno).

### Direzione 🎯
Tenere: vinile rotante, card-per-persona, player bottom, one-click sync, palette neon del mockup.
Sistemare: contrasto testi secondari, una sola CTA di sync, chat fuori dalla griglia, gerarchia host/io, stato vuoto curato.
Aggiungere: micro-dettagli retrofuturisti — crackle visivo, puntina che si appoggia quando parte il sync, glow che "respira" sul disco live (*questo* è il dettaglio che la gente screenshotta).

---

## 5. Prossimi passi proposti

1. **Spike Spotify** — 1–2 giorni, decide tutto. Piano operativo diviso in task: [`doc/spike/`](./spike/README.md).
2. ~~Moodboard A/B~~ ✅ **Palette decisa: synthwave/Blade Runner** — formalizzare i token di design (§4) in `globals.css` / theme Tailwind.
3. **MVP "Il Salotto"** su questa codebase (Next.js + Durable Objects per le stanze).
4. **Richiesta quota extension a Spotify** appena l'MVP è dimostrabile.
