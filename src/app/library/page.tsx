import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";

import { TopBar } from "@/components/top-bar";
import { getCurrentUser } from "@/lib/session";

type DiscRow = {
	track_uri: string;
	track_name: string;
	artists: string;
	album: string | null;
	cover_url: string | null;
	saved_from_name: string | null;
	saved_at: number;
};

export const dynamic = "force-dynamic";

function spotifyUrl(uri: string): string | null {
	const match = uri.match(/^spotify:track:(\w+)$/);
	return match ? `https://open.spotify.com/track/${match[1]}` : null;
}

export default async function LibraryPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/");

	const { env } = getCloudflareContext();
	const { results: discs } = await env.DB.prepare(
		"SELECT * FROM saved_discs WHERE user_id = ? ORDER BY saved_at DESC LIMIT 200",
	)
		.bind(user.id)
		.all<DiscRow>();

	return (
		<main className="min-h-screen bg-[#0B0E1A] text-[#E6EAF5] font-sans">
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
						const url = spotifyUrl(disc.track_uri);
						const cover = (
							<div className="relative">
								{disc.cover_url ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={disc.cover_url}
										alt={disc.track_name}
										className="w-full aspect-square rounded-xl object-cover"
									/>
								) : (
									<div className="w-full aspect-square rounded-xl bg-[#E64DA8]" />
								)}
								<div className="absolute -right-2 -top-2 w-10 h-10 rounded-full bg-[#0d1020] border border-[#2A3354]" />
							</div>
						);
						return (
							<div key={disc.track_uri} className="flex flex-col gap-2">
								{url ? (
									<a href={url} target="_blank" rel="noreferrer" className="hover:opacity-90">
										{cover}
									</a>
								) : (
									cover
								)}
								<p className="font-medium text-sm leading-tight">{disc.track_name}</p>
								<p className="text-xs text-[#8A94B8] leading-tight">{disc.artists}</p>
								{disc.saved_from_name && (
									<p className="text-xs text-[#4DD8E6]">
										dallo scaffale di {disc.saved_from_name}
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
