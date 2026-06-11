import { cookies } from "next/headers";

import { NowPlayingPanel } from "./now-playing-panel";

type SpotifyMe = {
	display_name: string;
	email: string;
	product: string;
	images: { url: string }[];
};

export default async function DebugPage() {
	const token = (await cookies()).get("spotify_access_token")?.value;

	if (!token) {
		return (
			<main className="min-h-screen flex flex-col items-center justify-center gap-4 font-sans">
				<h1 className="text-2xl">Vinly — spike debug</h1>
				<a
					href="/api/auth/login"
					className="rounded-full bg-green-600 text-white px-6 py-3 hover:bg-green-500"
				>
					Login con Spotify
				</a>
				<NowPlayingPanel />
			</main>
		);
	}

	const meRes = await fetch("https://api.spotify.com/v1/me", {
		headers: { Authorization: `Bearer ${token}` },
		cache: "no-store",
	});

	if (!meRes.ok) {
		return (
			<main className="min-h-screen flex flex-col items-center justify-center gap-4 font-sans">
				<p>
					Errore da /v1/me: {meRes.status} — {await meRes.text()}
				</p>
				<a href="/api/auth/login" className="underline">
					Riprova il login
				</a>
			</main>
		);
	}

	const me = (await meRes.json()) as SpotifyMe;

	return (
		<main className="min-h-screen flex flex-col items-center justify-center gap-4 font-sans">
			<h1 className="text-2xl">Vinly — spike debug</h1>
			{me.images?.[0] && (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={me.images[0].url} alt="" className="w-20 h-20 rounded-full" />
			)}
			<p className="text-lg">
				Loggato come <strong>{me.display_name}</strong> ({me.product})
			</p>
			<p className="text-sm opacity-60">{me.email}</p>
			<NowPlayingPanel />
		</main>
	);
}
