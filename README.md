# Vinly

Vinly è un'app di ascolto musicale **social** e in tempo (quasi) reale. Accedi con Spotify, crei o entri in una "stanza", e vedi cosa stanno ascoltando in quel momento gli altri membri — ogni traccia gira su un disco in vinile animato. I brani che ti piacciono si salvano in una libreria personale (lo "scaffale").

Costruita con **Next.js 16** (App Router, React 19) e distribuita su **Cloudflare Workers** tramite [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare), con database **D1** + **Drizzle ORM**.

## Funzionalità

- **Login con Spotify** (OAuth 2.0 con PKCE)
- **Stanze**: ogni stanza ha un URL pubblico e un codice d'invito segreto. Con l'invito entri come *membro* (il tuo disco va sul piatto); senza, sei *spettatore* (sola lettura).
- **Now playing in tempo reale**: griglia dei membri con il vinile animato sincronizzato sul progresso del brano. Aggiornata via polling ogni 25s, con fallback all'ultimo brano ascoltato.
- **Contatore live**: ogni poll funge da heartbeat, così vedi quanti membri sono online (visti negli ultimi 60s).
- **Username**: al primo login scegli un username pubblico; modificabile dalla pagina account.
- **Scaffale**: salva un brano dal piatto di chiunque nella tua libreria, con la provenienza ("da chi l'ho preso").
- **Gestione stanza**: lascia una stanza (membri) o eliminala (creatore).

## Setup locale

1. Installa le dipendenze:

   ```bash
   npm install
   ```

2. Crea un'app su [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) e aggiungi `http://127.0.0.1:3000/api/auth/callback` come Redirect URI.

   > Spotify accetta solo `127.0.0.1` (non `localhost`) per lo sviluppo locale. La route di login riscrive automaticamente `localhost` → `127.0.0.1`.

3. Copia `.dev.vars.example` in `.dev.vars` e inserisci le credenziali:

   ```
   NEXTJS_ENV=development
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback
   ```

4. Applica le migration al D1 locale:

   ```bash
   npx wrangler d1 migrations apply vinly-db --local
   ```

5. Avvia il dev server:

   ```bash
   npm run dev
   ```

   Apri [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Comandi

```bash
npm run dev        # dev server Next.js su localhost:3000 (runtime Node, non Workers)
npm run lint       # ESLint
npm run build      # next build
npm run preview    # build OpenNext + esecuzione sul runtime Cloudflare Workers in locale
npm run deploy     # build OpenNext + deploy su Cloudflare
npm run cf-typegen # rigenera cloudflare-env.d.ts dai binding di wrangler.jsonc
```

### Migration del database

Lo schema vive in `src/db/schema.ts` ed è l'unica fonte di verità. Dopo averlo modificato:

```bash
npx drizzle-kit generate                          # genera la migration in drizzle/
npx wrangler d1 migrations apply vinly-db --local  # applica al D1 locale
npx wrangler d1 migrations apply vinly-db --remote # applica al D1 di produzione
```

## Deploy

Da locale: `npm run deploy`, poi applica le eventuali migration al DB remoto.

Su **Cloudflare Workers Builds** (deploy automatico da Git) usa questa configurazione:

- **Build command:** `npx opennextjs-cloudflare build`
- **Deploy command:** `npx wrangler d1 migrations apply vinly-db --remote && npx wrangler deploy`

Il deploy command applica le migration prima di pubblicare il nuovo codice, così lo schema è sempre allineato. In CI `wrangler` è già autenticato e risponde "yes" automaticamente alle conferme.

## Architettura

Per i dettagli su runtime, binding, layer dati, flusso di autenticazione e modello delle stanze, vedi [`CLAUDE.md`](./CLAUDE.md).

## Due runtime, una codebase

`npm run dev` gira su Node ed è il ciclo di sviluppo veloce. L'app però **viene distribuita** sul runtime Cloudflare Workers, che si comporta diversamente (API edge, nessun built-in Node se non coperto da `nodejs_compat`). Verifica tutto ciò che è sensibile al runtime con `npm run preview` prima di assumere che funzioni in produzione.
