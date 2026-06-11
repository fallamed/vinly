import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";
import { randomSlug } from "@/lib/spotify";

type TokenResponse = {
	access_token: string;
	refresh_token: string;
	expires_in: number;
};

type SpotifyMe = {
	id: string;
	display_name: string;
	product: string;
	images?: { url: string }[];
};

export async function GET(request: NextRequest) {
	const { env } = getCloudflareContext();

	const code = request.nextUrl.searchParams.get("code");
	const state = request.nextUrl.searchParams.get("state");
	const error = request.nextUrl.searchParams.get("error");
	const verifier = request.cookies.get("pkce_verifier")?.value;
	const expectedState = request.cookies.get("oauth_state")?.value;

	if (error) {
		return NextResponse.json({ error: `Spotify ha rifiutato il login: ${error}` }, { status: 400 });
	}
	if (!code || !verifier || !state || state !== expectedState) {
		const mancano = [
			!code && "code (da Spotify)",
			!verifier && "cookie pkce_verifier",
			!expectedState && "cookie oauth_state",
		].filter(Boolean);
		return NextResponse.json(
			{
				error: "login non completato",
				mancano,
				stateMismatch: Boolean(state && expectedState && state !== expectedState),
				host: request.nextUrl.host,
				hint: "riparti da http://127.0.0.1:3000/debug nello stesso browser, senza tab di login parallele",
			},
			{ status: 400 },
		);
	}

	const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: env.SPOTIFY_REDIRECT_URI,
			client_id: env.SPOTIFY_CLIENT_ID,
			code_verifier: verifier,
		}),
	});

	if (!tokenRes.ok) {
		return NextResponse.json({ error: "scambio token fallito", detail: await tokenRes.text() }, { status: 502 });
	}

	const tokens = (await tokenRes.json()) as TokenResponse;

	const meRes = await fetch("https://api.spotify.com/v1/me", {
		headers: { Authorization: `Bearer ${tokens.access_token}` },
	});
	if (!meRes.ok) {
		return NextResponse.json({ error: "lettura profilo fallita", detail: await meRes.text() }, { status: 502 });
	}
	const me = (await meRes.json()) as SpotifyMe;

	const sessionToken = randomSlug(32);
	await env.DB.prepare(
		`INSERT INTO users (id, display_name, avatar_url, product, access_token, refresh_token, token_expires_at, session_token, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
			display_name = excluded.display_name,
			avatar_url = excluded.avatar_url,
			product = excluded.product,
			access_token = excluded.access_token,
			refresh_token = excluded.refresh_token,
			token_expires_at = excluded.token_expires_at,
			session_token = excluded.session_token`,
	)
		.bind(
			me.id,
			me.display_name,
			me.images?.[0]?.url ?? null,
			me.product,
			tokens.access_token,
			tokens.refresh_token,
			Date.now() + tokens.expires_in * 1000,
			sessionToken,
			Date.now(),
		)
		.run();

	const res = NextResponse.redirect(new URL("/", request.url));
	res.cookies.set(SESSION_COOKIE, sessionToken, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 90,
	});
	res.cookies.set("spotify_access_token", tokens.access_token, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: tokens.expires_in,
	});
	res.cookies.set("spotify_refresh_token", tokens.refresh_token, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30,
	});
	res.cookies.delete("pkce_verifier");
	res.cookies.delete("oauth_state");
	return res;
}
