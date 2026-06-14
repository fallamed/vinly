import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";

import type { DbUser } from "./session";

export type NowPlaying = {
	playing: boolean;
	progressMs: number;
	fetchedAt: number;
	track: {
		uri: string;
		name: string;
		artists: string;
		album: string;
		durationMs: number;
		coverUrl: string | null;
	} | null;
};

type TokenResponse = {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
};

type SpotifyCurrentlyPlaying = {
	currently_playing_type: string;
	is_playing: boolean;
	progress_ms: number;
	item: {
		uri: string;
		name: string;
		duration_ms: number;
		artists?: { name: string }[];
		album?: { name: string; images: { url: string; width: number }[] };
	} | null;
};

/** Restituisce un access token valido, rinfrescandolo (e persistendolo) se in scadenza. */
export async function getValidAccessToken(user: DbUser): Promise<string | null> {
	if (user.tokenExpiresAt - Date.now() > 60_000) return user.accessToken;

	const { env } = getCloudflareContext();
	const res = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: user.refreshToken,
			client_id: env.SPOTIFY_CLIENT_ID,
		}),
	});
	if (!res.ok) return null;

	const tokens = (await res.json()) as TokenResponse;
	const expiresAt = Date.now() + tokens.expires_in * 1000;
	// Il refresh token con PKCE ruota: salvare sempre quello nuovo se presente.
	const newRefresh = tokens.refresh_token ?? user.refreshToken;
	await getDb()
		.update(users)
		.set({ accessToken: tokens.access_token, refreshToken: newRefresh, tokenExpiresAt: expiresAt })
		.where(eq(users.id, user.id));

	user.accessToken = tokens.access_token;
	user.tokenExpiresAt = expiresAt;
	return tokens.access_token;
}

/** Now-playing di un utente del DB. null = niente in riproduzione o token non più valido. */
export async function getNowPlayingFor(user: DbUser): Promise<NowPlaying | null> {
	const token = await getValidAccessToken(user);
	if (!token) return null;

	const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
		headers: { Authorization: `Bearer ${token}` },
		cache: "no-store",
	});
	if (res.status === 204 || !res.ok) return null;

	const data = (await res.json()) as SpotifyCurrentlyPlaying;
	const item = data.item;
	return {
		playing: data.is_playing,
		progressMs: data.progress_ms,
		fetchedAt: Date.now(),
		track: item
			? {
					uri: item.uri,
					name: item.name,
					artists: item.artists?.map((a) => a.name).join(", ") ?? "",
					album: item.album?.name ?? "",
					durationMs: item.duration_ms,
					coverUrl:
						item.album?.images?.find((img) => img.width === 300)?.url ??
						item.album?.images?.[0]?.url ??
						null,
				}
			: null,
	};
}

export function randomSlug(length = 10): string {
	const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
