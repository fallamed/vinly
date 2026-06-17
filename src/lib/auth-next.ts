/** Path interno sicuro per redirect post-login. Solo /room/<slug>?invite=<codice>. */
export function safeNextPath(raw: string | null | undefined): string | null {
	if (!raw || typeof raw !== "string" || raw.length > 200) return null;
	if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
	// Limitato per ora all'unico caso che serve: invito alla stanza.
	return /^\/room\/[a-z0-9]+(\?invite=[a-z0-9]+)?$/.test(raw) ? raw : null;
}

export const AUTH_NEXT_COOKIE = "auth_next";
