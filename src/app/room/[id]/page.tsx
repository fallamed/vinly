import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notFound, redirect } from "next/navigation";

import { RoomView } from "@/components/room-view";
import { TopBar } from "@/components/top-bar";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const user = await getCurrentUser();
	if (!user) redirect("/");

	const { env } = getCloudflareContext();
	const room = await env.DB.prepare("SELECT id, name FROM rooms WHERE id = ?")
		.bind(id)
		.first<{ id: string; name: string }>();
	if (!room) notFound();

	// Visitare la stanza = entrarci: il link è l'invito.
	await env.DB.prepare(
		"INSERT OR IGNORE INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)",
	)
		.bind(id, user.id, Date.now())
		.run();

	return (
		<main className="min-h-screen bg-[#0B0E1A] text-[#E6EAF5] font-sans">
			<TopBar user={user} />
			<RoomView roomId={room.id} roomName={room.name} />
		</main>
	);
}
