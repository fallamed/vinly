import { desc, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { getDb } from "@/db";
import { roomMembers, rooms, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { randomSlug } from "@/lib/spotify";

export async function GET() {
	const db = getDb();
	const list = await db
		.select({
			id: rooms.id,
			name: rooms.name,
			createdAt: rooms.createdAt,
			hostName: users.displayName,
			memberCount: sql<number>`(SELECT COUNT(*) FROM ${roomMembers} WHERE ${roomMembers.roomId} = ${rooms.id})`,
		})
		.from(rooms)
		.innerJoin(users, eq(users.id, rooms.createdBy))
		.orderBy(desc(rooms.createdAt))
		.limit(50);
	return NextResponse.json({ rooms: list });
}

export async function POST(request: NextRequest) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "non loggato" }, { status: 401 });

	const body = (await request.json().catch(() => null)) as { name?: string } | null;
	const name = body?.name?.trim();
	if (!name || name.length > 60) {
		return NextResponse.json({ error: "nome stanza mancante o troppo lungo" }, { status: 400 });
	}

	const db = getDb();
	const id = randomSlug(10);
	const now = Date.now();
	await db.batch([
		db.insert(rooms).values({ id, name, inviteCode: randomSlug(12), createdBy: user.id, createdAt: now }),
		db.insert(roomMembers).values({ roomId: id, userId: user.id, joinedAt: now }),
	]);

	return NextResponse.json({ id });
}
