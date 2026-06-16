import { and, eq } from "drizzle-orm";
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
	if (room.createdBy === user.id) return NextResponse.json({ error: "sei il creatore: usa elimina stanza" }, { status: 400 });

	await db.delete(roomMembers).where(and(eq(roomMembers.roomId, id), eq(roomMembers.userId, user.id)));

	return NextResponse.json({ ok: true });
}
