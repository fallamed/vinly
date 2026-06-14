import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { RoomView } from "@/components/room-view";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/db";
import { roomMembers, rooms } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RoomPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ invite?: string }>;
}) {
	const { id } = await params;
	const { invite } = await searchParams;
	const user = await getCurrentUser();
	if (!user) redirect("/");

	const db = getDb();
	const room = await db.select().from(rooms).where(eq(rooms.id, id)).get();
	if (!room) notFound();

	// Dalla home si entra da spettatori; membro diventa solo chi arriva
	// col codice d'invito (o chi lo era già).
	let isMember = Boolean(
		await db
			.select({ userId: roomMembers.userId })
			.from(roomMembers)
			.where(and(eq(roomMembers.roomId, id), eq(roomMembers.userId, user.id)))
			.get(),
	);
	if (!isMember && invite && room.inviteCode && invite === room.inviteCode) {
		await db
			.insert(roomMembers)
			.values({ roomId: id, userId: user.id, joinedAt: Date.now() })
			.onConflictDoNothing();
		isMember = true;
	}

	return (
		<main className="min-h-screen bg-[#0B0E1A] text-[#E6EAF5] font-sans">
			<TopBar user={user} />
			<RoomView roomId={room.id} roomName={room.name} isMember={isMember} />
		</main>
	);
}
