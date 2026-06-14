import { defineConfig } from "drizzle-kit";

// Solo per generare le migrazioni (drizzle-kit generate).
// L'applicazione avviene con wrangler: npx wrangler d1 migrations apply vinly-db --local|--remote
export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
});
