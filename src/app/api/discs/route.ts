import { type NextRequest, NextResponse } from "next/server";

import { getDb } from "@/db";
import { savedDiscs } from "@/db/schema";
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

	const disc = {
		trackName: body.trackName,
		artists: body.artists ?? "",
		album: body.album ?? null,
		coverUrl: body.coverUrl ?? null,
		savedFromName: body.savedFromName ?? null,
		savedAt: Date.now(),
	};
	await getDb()
		.insert(savedDiscs)
		.values({ userId: user.id, trackUri: body.trackUri, ...disc })
		.onConflictDoUpdate({ target: [savedDiscs.userId, savedDiscs.trackUri], set: disc });

	return NextResponse.json({ saved: true });
}
