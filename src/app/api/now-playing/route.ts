import { type NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
	const token = request.cookies.get("spotify_access_token")?.value;
	if (!token) {
		return NextResponse.json({ error: "non loggato — vai su /api/auth/login" }, { status: 401 });
	}

	const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
		headers: { Authorization: `Bearer ${token}` },
		cache: "no-store",
	});

	if (res.status === 204) {
		return NextResponse.json({ playing: false, reason: "nothing-playing", fetchedAt: Date.now(), track: null });
	}
	if (res.status === 429) {
		return NextResponse.json(
			{ error: "rate-limited", retryAfter: res.headers.get("Retry-After") },
			{ status: 429 },
		);
	}
	if (!res.ok) {
		return NextResponse.json({ error: `spotify ${res.status}`, detail: await res.text() }, { status: res.status });
	}

	const data = (await res.json()) as SpotifyCurrentlyPlaying;
	const item = data.item;

	return NextResponse.json({
		playing: data.is_playing,
		type: data.currently_playing_type,
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
