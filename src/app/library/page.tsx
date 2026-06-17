import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { TopBar } from "@/components/top-bar";
import { getDb } from "@/db";
import { savedDiscs } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

function spotifyUrl(uri: string): string | null {
	const match = uri.match(/^spotify:track:(\w+)$/);
	return match ? `https://open.spotify.com/track/${match[1]}` : null;
}

export default async function LibraryPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/");

	const discs = await getDb()
		.select()
		.from(savedDiscs)
		.where(eq(savedDiscs.userId, user.id))
		.orderBy(desc(savedDiscs.savedAt))
		.limit(200);

	return (
		<main className="min-h-screen bg-[#101838] text-[#E6EAF5] font-sans">
			<TopBar user={user} />
			<div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
				<div>
					<h1 className="text-3xl font-semibold mb-1">Lo scaffale</h1>
					<p className="text-[#8A94B8] text-sm">
						{discs.length === 0
							? "Vuoto — salva un disco dal piatto di qualcuno in una stanza."
							: `${discs.length} ${discs.length === 1 ? "disco" : "dischi"} nella collezione.`}
					</p>
				</div>

				<div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5">
					{discs.map((disc) => {
						const url = spotifyUrl(disc.trackUri);
						const cover = (
							<div className="relative">
								{disc.coverUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={disc.coverUrl}
										alt={disc.trackName}
										className="w-full aspect-square rounded-xl object-cover"
									/>
								) : (
									<div className="w-full aspect-square rounded-xl bg-[#E64DA8]" />
								)}
								<div className="absolute -right-2 -top-2 w-10 h-10 rounded-full bg-[#0d1020] border border-[#2A3354]" />
							</div>
						);
						return (
							<div key={disc.trackUri} className="flex flex-col gap-2">
								{url ? (
									<a href={url} target="_blank" rel="noreferrer" className="hover:opacity-90">
										{cover}
									</a>
								) : (
									cover
								)}
								<p className="font-medium text-sm leading-tight">{disc.trackName}</p>
								<p className="text-xs text-[#8A94B8] leading-tight">{disc.artists}</p>
								{disc.savedFromName && (
									<p className="text-xs text-[#4DD8E6]">
										dallo scaffale di {disc.savedFromName}
									</p>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</main>
	);
}
