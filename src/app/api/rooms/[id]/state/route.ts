import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { roomMembers, rooms, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { getNowPlayingFor, type NowPlaying } from "@/lib/spotify";

type MemberNow = (NowPlaying & { lastKnown?: boolean }) | null;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const viewer = await getCurrentUser();
	if (!viewer) return NextResponse.json({ error: "non loggato" }, { status: 401 });

	const { id } = await params;
	const db = getDb();

	const room = await db.select().from(rooms).where(eq(rooms.id, id)).get();
	if (!room) return NextResponse.json({ error: "stanza inesistente" }, { status: 404 });

	const memberRows = await db
		.select({ user: users })
		.from(roomMembers)
		.innerJoin(users, eq(users.id, roomMembers.userId))
		.where(eq(roomMembers.roomId, id))
		.orderBy(asc(roomMembers.joinedAt))
		.limit(24);
	const members = memberRows.map((row) => row.user);

	const viewerIsMember = members.some((m) => m.id === viewer.id);

	const states = await Promise.all(
		members.map(async (member) => {
			const now = await getNowPlayingFor(member);

			// Ricorda l'ultimo disco visto sul piatto (solo quando cambia).
			if (now?.track && now.track.uri !== member.lastTrackUri) {
				await db
					.update(users)
					.set({
						lastTrackUri: now.track.uri,
						lastTrackName: now.track.name,
						lastArtists: now.track.artists,
						lastAlbum: now.track.album,
						lastCoverUrl: now.track.coverUrl,
					})
					.where(eq(users.id, member.id));
			}

			// Piatto silenzioso ma con storia: mostra l'ultimo disco, fermo.
			const fallback: MemberNow =
				member.lastTrackUri && member.lastTrackName
					? {
							playing: false,
							progressMs: 0,
							fetchedAt: Date.now(),
							lastKnown: true,
							track: {
								uri: member.lastTrackUri,
								name: member.lastTrackName,
								artists: member.lastArtists ?? "",
								album: member.lastAlbum ?? "",
								durationMs: 0,
								coverUrl: member.lastCoverUrl,
							},
						}
					: null;

			return {
				id: member.id,
				name: member.username ?? member.displayName,
				avatar: member.avatarUrl,
				isHost: member.id === room.createdBy,
				isMe: member.id === viewer.id,
				now: (now?.track ? now : fallback) as MemberNow,
			};
		}),
	);

	const inviteUrl =
		viewerIsMember && room.inviteCode
			? `${new URL(request.url).origin}/room/${room.id}?invite=${room.inviteCode}`
			: null;

	return NextResponse.json({
		room: { id: room.id, name: room.name },
		viewerIsMember,
		inviteUrl,
		members: states,
	});
}
