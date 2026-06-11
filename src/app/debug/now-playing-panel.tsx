"use client";

import { useEffect, useRef, useState } from "react";

import { VinylDisc } from "@/components/vinyl-disc";

type NowPlaying = {
	playing: boolean;
	type?: string;
	progressMs?: number;
	fetchedAt: number;
	reason?: string;
	track: {
		uri: string;
		name: string;
		artists: string;
		album: string;
		durationMs: number;
		coverUrl: string | null;
	} | null;
};

function fmt(ms?: number): string {
	if (ms == null) return "–";
	const s = Math.floor(ms / 1000);
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function NowPlayingPanel() {
	const [data, setData] = useState<NowPlaying | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [polls, setPolls] = useState(0);
	const demoStart = useRef(Date.now()).current;

	useEffect(() => {
		let stopped = false;

		async function poll() {
			try {
				const res = await fetch("/api/now-playing");
				const json = (await res.json()) as NowPlaying & { error?: string };
				if (stopped) return;
				setPolls((n) => n + 1);
				if (res.ok) {
					setData(json);
					setError(null);
				} else {
					setError(`${res.status}: ${json.error ?? "errore"}`);
				}
			} catch (e) {
				if (!stopped) setError(String(e));
			}
		}

		poll();
		const id = setInterval(poll, 5000);
		return () => {
			stopped = true;
			clearInterval(id);
		};
	}, []);

	return (
		<section className="flex flex-col items-center gap-3 border border-white/15 rounded-2xl p-6 min-w-80">
			<h2 className="text-sm uppercase tracking-widest opacity-60">Now playing (poll #{polls})</h2>

			{error && <p className="text-red-400 text-sm">{error}</p>}

			{data?.reason === "nothing-playing" && <p className="opacity-60">Niente in riproduzione</p>}

			{data?.type && data.type !== "track" && (
				<p className="text-amber-400 text-sm">Tipo non-track: {data.type}</p>
			)}

			{(error || data?.reason === "nothing-playing") && (
				<div className="flex flex-col items-center gap-2">
					<VinylDisc progressMs={0} fetchedAt={demoStart} playing coverUrl={null} size={160} />
					<p className="text-xs opacity-40">disco demo — in attesa di musica</p>
				</div>
			)}

			{data?.track && (
				<>
					<VinylDisc
						progressMs={data.progressMs ?? 0}
						fetchedAt={data.fetchedAt}
						playing={data.playing}
						coverUrl={data.track.coverUrl}
					/>
					<p className="text-lg font-medium text-center">{data.track.name}</p>
					<p className="opacity-70 text-center">
						{data.track.artists} — {data.track.album}
					</p>
					<p className="font-mono text-sm">
						{fmt(data.progressMs)} / {fmt(data.track.durationMs)}{" "}
						<span className={data.playing ? "text-green-400" : "text-amber-400"}>
							{data.playing ? "▶ play" : "⏸ pausa"}
						</span>
					</p>
				</>
			)}
		</section>
	);
}
