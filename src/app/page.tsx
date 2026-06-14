import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";

import { CreateRoomForm } from "@/components/create-room-form";
import { TopBar } from "@/components/top-bar";
import { getDb } from "@/db";
import { roomMembers, rooms, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
	const user = await getCurrentUser();

	if (!user) {
		return (
			<main className="min-h-screen bg-[#0B0E1A] text-[#E6EAF5] flex flex-col items-center justify-center gap-6 font-sans px-6">
				<h1 className="text-4xl font-semibold">
					<span className="text-[#E64DA8]">◉</span> Vinly
				</h1>
				<p className="text-[#8A94B8] text-center max-w-md">
					Il lounge dove vedi cosa gira sui piatti dei tuoi amici — e ti sintonizzi con un click.
				</p>
				<a
					href="/api/auth/login"
					className="rounded-full bg-[#4DD8E6] text-[#04343C] font-medium px-7 py-3 hover:opacity-90"
				>
					Entra con Spotify
				</a>
			</main>
		);
	}

	const roomList = await getDb()
		.select({
			id: rooms.id,
			name: rooms.name,
			hostName: users.displayName,
			memberCount: sql<number>`(SELECT COUNT(*) FROM ${roomMembers} WHERE ${roomMembers.roomId} = ${rooms.id})`,
		})
		.from(rooms)
		.innerJoin(users, eq(users.id, rooms.createdBy))
		.orderBy(desc(rooms.createdAt))
		.limit(50);

	return (
		<main className="min-h-screen bg-[#0B0E1A] text-[#E6EAF5] font-sans">
			<TopBar user={user} />
			<div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
				<div>
					<h1 className="text-3xl font-semibold mb-1">Il lounge</h1>
					<p className="text-[#8A94B8] text-sm">
						{roomList.length === 0
							? "Nessuna stanza ancora — metti su il primo disco."
							: "Entra in una stanza o creane una."}
					</p>
				</div>

				<CreateRoomForm />

				<ul className="flex flex-col gap-3">
					{roomList.map((room) => (
						<li key={room.id}>
							<Link
								href={`/room/${room.id}`}
								className="flex items-center justify-between rounded-2xl bg-[#11152A] border border-[#232A45] px-5 py-4 hover:border-[#4DD8E6]"
							>
								<div>
									<p className="font-medium">{room.name}</p>
									<p className="text-xs text-[#8A94B8]">di {room.hostName}</p>
								</div>
								<span className="text-xs text-[#4DD8E6]">
									{room.memberCount} {room.memberCount === 1 ? "ascoltatore" : "ascoltatori"}
								</span>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</main>
	);
}
