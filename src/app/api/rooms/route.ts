import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { randomSlug } from "@/lib/spotify";

export async function GET() {
	const { env } = getCloudflareContext();
	const { results } = await env.DB.prepare(
		`SELECT r.id, r.name, r.created_at, u.display_name AS host_name,
			(SELECT COUNT(*) FROM room_members m WHERE m.room_id = r.id) AS member_count
		 FROM rooms r JOIN users u ON u.id = r.created_by
		 ORDER BY r.created_at DESC
		 LIMIT 50`,
	).all();
	return NextResponse.json({ rooms: results });
}

export async function POST(request: NextRequest) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "non loggato" }, { status: 401 });

	const body = (await request.json().catch(() => null)) as { name?: string } | null;
	const name = body?.name?.trim();
	if (!name || name.length > 60) {
		return NextResponse.json({ error: "nome stanza mancante o troppo lungo" }, { status: 400 });
	}

	const { env } = getCloudflareContext();
	const id = randomSlug(10);
	const now = Date.now();
	await env.DB.batch([
		env.DB.prepare("INSERT INTO rooms (id, name, created_by, created_at) VALUES (?, ?, ?, ?)").bind(
			id,
			name,
			user.id,
			now,
		),
		env.DB.prepare("INSERT INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)").bind(
			id,
			user.id,
			now,
		),
	]);

	return NextResponse.json({ id });
}
