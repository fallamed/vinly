"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PlayerState = {
	isPremium: boolean;
	hasDevice: boolean;
	playing?: boolean;
	progressMs?: number;
	fetchedAt?: number;
	track?: {
		uri: string;
		name: string;
		artists: string;
		album: string;
		durationMs: number;
		coverUrl: string | null;
	} | null;
};

function fmt(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
	const [state, setState] = useState<PlayerState | null>(null);
	const [dragMs, setDragMs] = useState<number | null>(null);
	const [, setTick] = useState(0);
	const [hint, setHint] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await fetch("/api/player");
			if (!res.ok) {
				setState(null);
				return;
			}
			setState((await res.json()) as PlayerState);
		} catch {
			/* rete: lascia lo stato com'è */
		}
	}, []);

	useEffect(() => {
		load();
		const id = setInterval(load, 15000);
		return () => clearInterval(id);
	}, [load]);

	// Tick locale per far avanzare la barra del progresso senza ripollare.
	useEffect(() => {
		const id = setInterval(() => setTick((t) => t + 1), 1000);
		return () => clearInterval(id);
	}, []);

	const track = state?.track ?? null;

	const interpolated =
		state?.progressMs != null && state.fetchedAt != null
			? state.playing
				? state.progressMs + (Date.now() - state.fetchedAt)
				: state.progressMs
			: 0;
	const displayedMs = dragMs ?? Math.min(interpolated, track?.durationMs ?? interpolated);

	async function command(action: string, extra: Record<string, unknown> = {}) {
		const res = await fetch("/api/player", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action, ...extra }),
		});
		if (!res.ok) {
			const json = (await res.json().catch(() => null)) as { message?: string } | null;
			setHint(json?.message ?? "comando non riuscito");
			setTimeout(() => setHint(null), 4000);
			return false;
		}
		setHint(null);
		return true;
	}

	async function togglePlay() {
		if (!state) return;
		const wasPlaying = state.playing;
		setState({ ...state, playing: !wasPlaying, progressMs: displayedMs, fetchedAt: Date.now() });
		const ok = await command(wasPlaying ? "pause" : "play");
		if (!ok) setState((s) => (s ? { ...s, playing: wasPlaying } : s));
		else setTimeout(load, 500);
	}

	async function commitSeek(value: number) {
		setState((s) => (s ? { ...s, progressMs: value, fetchedAt: Date.now() } : s));
		setDragMs(null);
		const ok = await command("seek", { positionMs: Math.round(value) });
		if (ok) setTimeout(load, 500);
	}

	// La barra appare solo se sei Premium e c'è una traccia: niente ingombro a vuoto.
	if (!state?.isPremium || !track) return null;

	return (
		<>
			<div className="h-24" aria-hidden />
			<div className="fixed bottom-0 inset-x-0 z-50 border-t border-[#232A45] bg-[#0B0E1A]/95 backdrop-blur">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
					{track.coverUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={track.coverUrl} alt={track.album} className="w-12 h-12 rounded-md object-cover shrink-0" />
					) : (
						<div className="w-12 h-12 rounded-md bg-[#232A45] shrink-0" />
					)}

					<div className="min-w-0 hidden sm:block w-44 shrink-0">
						<p className="text-sm font-medium truncate">{track.name}</p>
						<p className="text-xs text-[#8A94B8] truncate">{track.artists}</p>
					</div>

					<div className="flex items-center gap-3 shrink-0">
						<button
							onClick={() => command("previous").then((ok) => ok && setTimeout(load, 500))}
							className="text-[#8A94B8] hover:text-[#E6EAF5] text-lg"
							aria-label="Precedente"
						>
							⏮
						</button>
						<button
							onClick={togglePlay}
							className="w-9 h-9 rounded-full bg-[#4DD8E6] text-[#04343C] flex items-center justify-center hover:opacity-90"
							aria-label={state.playing ? "Pausa" : "Play"}
						>
							{state.playing ? "⏸" : "▶"}
						</button>
						<button
							onClick={() => command("next").then((ok) => ok && setTimeout(load, 500))}
							className="text-[#8A94B8] hover:text-[#E6EAF5] text-lg"
							aria-label="Successiva"
						>
							⏭
						</button>
					</div>

					<div className="flex items-center gap-2 flex-1 min-w-0">
						<span className="text-[10px] text-[#8A94B8] tabular-nums w-9 text-right">{fmt(displayedMs)}</span>
						<input
							type="range"
							min={0}
							max={track.durationMs || 0}
							value={Math.min(displayedMs, track.durationMs || 0)}
							onChange={(e) => setDragMs(Number(e.target.value))}
							onPointerUp={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
							onKeyUp={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
							className="flex-1 accent-[#4DD8E6] cursor-pointer"
							aria-label="Posizione"
						/>
						<span className="text-[10px] text-[#8A94B8] tabular-nums w-9">{fmt(track.durationMs)}</span>
					</div>
				</div>
				{hint && <p className="text-center text-xs text-[#E64DA8] pb-2 px-4">{hint}</p>}
			</div>
		</>
	);
}
