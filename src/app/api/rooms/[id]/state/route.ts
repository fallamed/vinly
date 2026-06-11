import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { type DbUser, getCurrentUser } from "@/lib/session";
import { getNowPlayingFor } from "@/lib/spotify";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	const viewer = await getCurrentUser();
	if (!viewer) return NextResponse.json({ error: "non loggato" }, { status: 401 });

	const { id } = await params;
	const { env } = getCloudflareContext();

	const room = await env.DB.prepare("SELECT id, name, created_by FROM rooms WHERE id = ?")
		.bind(id)
		.first<{ id: string; name: string; created_by: string }>();
	if (!room) return NextResponse.json({ error: "stanza inesistente" }, { status: 404 });

	const { results: members } = await env.DB.prepare(
		`SELECT u.* FROM room_members m JOIN users u ON u.id = m.user_id
		 WHERE m.room_id = ? ORDER BY m.joined_at ASC LIMIT 24`,
	)
		.bind(id)
		.all<DbUser>();

	const states = await Promise.all(
		members.map(async (member) => ({
			id: member.id,
			name: member.display_name,
			avatar: member.avatar_url,
			isHost: member.id === room.created_by,
			isMe: member.id === viewer.id,
			now: await getNowPlayingFor(member),
		})),
	);

	return NextResponse.json({ room: { id: room.id, name: room.name }, members: states });
}
