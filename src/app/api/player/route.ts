import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { controlPlayback, getValidAccessToken, type PlaybackAction } from "@/lib/spotify";

type SpotifyPlayerState = {
	is_playing: boolean;
	progress_ms: number;
	device?: { id: string; name: string; is_active: boolean } | null;
	item: {
		uri: string;
		name: string;
		duration_ms: number;
		artists?: { name: string }[];
		album?: { name: string; images: { url: string; width: number }[] };
	} | null;
};

const CONTROL_ACTIONS: PlaybackAction[] = ["play", "pause", "next", "previous", "seek"];

/** Stato del player dell'utente: serve alla barra in basso per sapere cosa mostrare. */
export async function GET() {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "non loggato" }, { status: 401 });

	const isPremium = user.product === "premium";
	const token = await getValidAccessToken(user);
	if (!token) return NextResponse.json({ isPremium, hasDevice: false, track: null });

	// /v1/me/player dà lo stato completo, incluso il dispositivo attivo (204 = nessuno).
	const res = await fetch("https://api.spotify.com/v1/me/player", {
		headers: { Authorization: `Bearer ${token}` },
		cache: "no-store",
	});

	if (res.status === 204 || !res.ok) {
		return NextResponse.json({ isPremium, hasDevice: false, track: null });
	}

	const data = (await res.json()) as SpotifyPlayerState;
	const item = data.item;
	return NextResponse.json({
		isPremium,
		hasDevice: Boolean(data.device?.is_active ?? data.device),
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
	});
}

/** Comandi di riproduzione (play/pause/seek/next/previous) + sync puntuale su una traccia. */
export async function PUT(request: Request) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "non loggato" }, { status: 401 });
	if (user.product !== "premium") {
		return NextResponse.json({ error: "premium-required" }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as {
		action?: PlaybackAction;
		uri?: string;
		positionMs?: number;
	} | null;

	const action = body?.action;
	if (!action || !CONTROL_ACTIONS.includes(action)) {
		return NextResponse.json({ error: "azione non valida" }, { status: 400 });
	}

	const result = await controlPlayback(user, action, { uri: body?.uri, positionMs: body?.positionMs });
	if (result.ok) return NextResponse.json({ ok: true });

	const message =
		result.reason === "no-device"
			? "nessun dispositivo Spotify attivo: apri Spotify su un dispositivo e riprova"
			: result.reason === "premium-required"
				? "serve Spotify Premium"
				: "comando non riuscito";
	return NextResponse.json({ error: result.reason, message }, { status: result.status });
}
