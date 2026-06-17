import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type NextRequest, NextResponse } from "next/server";

import { AUTH_NEXT_COOKIE, safeNextPath } from "@/lib/auth-next";

const SCOPES = [
	"user-read-private",
	"user-read-email",
	"user-read-currently-playing",
	"user-read-playback-state",
	"user-modify-playback-state",
	"streaming",
].join(" ");

function base64url(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64url");
}

export async function GET(request: NextRequest) {
	// Spotify redirige sempre su 127.0.0.1: se il flusso parte da localhost
	// i cookie finirebbero su un host diverso e lo scambio fallirebbe.
	// Si usa l'header Host perché nextUrl.hostname non riflette l'URL reale in dev.
	const host = request.headers.get("host") ?? "";
	if (host.startsWith("localhost")) {
		return NextResponse.redirect(`http://${host.replace("localhost", "127.0.0.1")}${request.nextUrl.pathname}`);
	}

	const { env } = getCloudflareContext();

	const verifier = base64url(crypto.getRandomValues(new Uint8Array(48)));
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
	const challenge = base64url(new Uint8Array(digest));
	const state = base64url(crypto.getRandomValues(new Uint8Array(16)));

	const params = new URLSearchParams({
		response_type: "code",
		client_id: env.SPOTIFY_CLIENT_ID,
		scope: SCOPES,
		redirect_uri: env.SPOTIFY_REDIRECT_URI,
		code_challenge_method: "S256",
		code_challenge: challenge,
		state,
	});

	const res = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
	const cookieOpts = { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 } as const;
	res.cookies.set("pkce_verifier", verifier, cookieOpts);
	res.cookies.set("oauth_state", state, cookieOpts);

	// Conserva l'eventuale destinazione (es. invito a una stanza) per tutto il flusso di login.
	const next = safeNextPath(request.nextUrl.searchParams.get("next"));
	if (next) res.cookies.set(AUTH_NEXT_COOKIE, next, cookieOpts);
	return res;
}
