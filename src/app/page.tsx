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
			<main className="min-h-screen bg-[#101838] text-[#E6EAF5] flex flex-col items-center justify-center gap-6 font-sans px-6">
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
			createdBy: rooms.createdBy,
			hostName: users.displayName,
			hostUsername: users.username,
			memberCount: sql<number>`(SELECT COUNT(*) FROM ${roomMembers} WHERE ${roomMembers.roomId} = ${rooms.id})`,
			isMember: sql<number>`CASE WHEN EXISTS(SELECT 1 FROM ${roomMembers} WHERE ${roomMembers.roomId} = ${rooms.id} AND ${roomMembers.userId} = ${user.id}) THEN 1 ELSE 0 END`,
		})
		.from(rooms)
		.innerJoin(users, eq(users.id, rooms.createdBy))
		.orderBy(desc(rooms.createdAt))
		.limit(50);

	const myRooms = roomList.filter((r) => r.isMember === 1);
	const otherRooms = roomList.filter((r) => r.isMember === 0);

	function hostLabel(room: (typeof roomList)[number]) {
		return room.hostUsername ? `@${room.hostUsername}` : room.hostName;
	}

	function memberLabel(count: number) {
		return `${count} ${count === 1 ? "ascoltatore" : "ascoltatori"}`;
	}

	return (
		<main className="min-h-screen bg-[#101838] text-[#E6EAF5] font-sans">
			<TopBar user={user} />
			<div className="vinly-dots max-w-3xl mx-auto px-6 py-10 flex flex-col gap-10">
				<div className="flex flex-col gap-4">
					<div>
						<h1 className="text-3xl font-semibold mb-1 vinly-title-glow">Il lounge</h1>
						<p className="text-[#8A94B8] text-sm">Crea una stanza o entra in una esistente.</p>
					</div>
					<CreateRoomForm />
				</div>

				{myRooms.length > 0 && (
					<section className="flex flex-col gap-3">
						<h2 className="text-xs font-semibold tracking-widest text-[#E64DA8] uppercase">Le mie stanze</h2>
						<ul className="flex flex-col gap-3">
							{myRooms.map((room) => (
								<li key={room.id}>
									<Link
										href={`/room/${room.id}`}
										className="flex items-center justify-between rounded-2xl bg-[#11152A] border border-[#E64DA8]/40 px-5 py-4 hover:border-[#E64DA8]"
									>
										<div className="flex flex-col gap-0.5">
											<p className="font-medium">
												{room.createdBy === user.id && (
													<span className="text-[#E64DA8] mr-1.5">★</span>
												)}
												{room.name}
											</p>
											<p className="text-xs text-[#8A94B8]">
												di {hostLabel(room)}
												{room.createdBy === user.id && (
													<span className="text-[#E64DA8]"> · tua stanza</span>
												)}
											</p>
										</div>
										<span className="text-xs text-[#E64DA8] shrink-0">{memberLabel(room.memberCount)}</span>
									</Link>
								</li>
							))}
						</ul>
					</section>
				)}

				{otherRooms.length > 0 && (
					<section className="flex flex-col gap-3">
						<h2 className="text-xs font-semibold tracking-widest text-[#5E6B96] uppercase">
							{myRooms.length > 0 ? "Altre stanze" : "Stanze aperte"}
						</h2>
						<ul className="flex flex-col gap-3">
							{otherRooms.map((room) => (
								<li key={room.id}>
									<Link
										href={`/room/${room.id}`}
										className="flex items-center justify-between rounded-2xl bg-[#11152A] border border-[#232A45] px-5 py-4 hover:border-[#4DD8E6]"
									>
										<div className="flex flex-col gap-0.5">
											<p className="font-medium">{room.name}</p>
											<p className="text-xs text-[#8A94B8]">
												di {hostLabel(room)}
												<span className="text-[#5E6B96]"> · entri come spettatore</span>
											</p>
										</div>
										<span className="text-xs text-[#4DD8E6] shrink-0">{memberLabel(room.memberCount)}</span>
									</Link>
								</li>
							))}
						</ul>
					</section>
				)}

				{roomList.length === 0 && (
					<p className="text-[#5E6B96] text-sm">Nessuna stanza ancora — metti su il primo disco.</p>
				)}
			</div>
		</main>
	);
}
