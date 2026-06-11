import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";

type SaveDiscBody = {
	trackUri?: string;
	trackName?: string;
	artists?: string;
	album?: string;
	coverUrl?: string;
	savedFromName?: string;
};

export async function POST(request: NextRequest) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "non loggato" }, { status: 401 });

	const body = (await request.json().catch(() => null)) as SaveDiscBody | null;
	if (!body?.trackUri || !body.trackName) {
		return NextResponse.json({ error: "trackUri e trackName obbligatori" }, { status: 400 });
	}

	const { env } = getCloudflareContext();
	await env.DB.prepare(
		`INSERT OR REPLACE INTO saved_discs
			(user_id, track_uri, track_name, artists, album, cover_url, saved_from_name, saved_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
	)
		.bind(
			user.id,
			body.trackUri,
			body.trackName,
			body.artists ?? "",
			body.album ?? null,
			body.coverUrl ?? null,
			body.savedFromName ?? null,
			Date.now(),
		)
		.run();

	return NextResponse.json({ saved: true });
}
