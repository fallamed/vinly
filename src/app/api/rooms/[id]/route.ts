import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { roomMembers, rooms } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "non loggato" }, { status: 401 });

	const { id } = await params;
	const db = getDb();

	const room = await db.select({ createdBy: rooms.createdBy }).from(rooms).where(eq(rooms.id, id)).get();
	if (!room) return NextResponse.json({ error: "stanza inesistente" }, { status: 404 });
	if (room.createdBy !== user.id) return NextResponse.json({ error: "solo il creatore può eliminare la stanza" }, { status: 403 });

	await db.batch([
		db.delete(roomMembers).where(eq(roomMembers.roomId, id)),
		db.delete(rooms).where(eq(rooms.id, id)),
	]);

	return NextResponse.json({ ok: true });
}
