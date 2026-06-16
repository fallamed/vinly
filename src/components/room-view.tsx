"use client";

import { useEffect, useState } from "react";

import { VinylDisc } from "@/components/vinyl-disc";
import type { NowPlaying } from "@/lib/spotify";

type Member = {
	id: string;
	name: string;
	avatar: string | null;
	isHost: boolean;
	isMe: boolean;
	now: (NowPlaying & { lastKnown?: boolean }) | null;
};

type RoomState = {
	room: { id: string; name: string };
	viewerIsMember: boolean;
	inviteUrl: string | null;
	members: Member[];
};

export function RoomView({
	roomId,
	roomName,
	isMember,
}: {
	roomId: string;
	roomName: string;
	isMember: boolean;
}) {
	const [state, setState] = useState<RoomState | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [savedUri, setSavedUri] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		let stopped = false;

		async function poll() {
			try {
				const res = await fetch(`/api/rooms/${roomId}/state`);
				const json = (await res.json()) as RoomState & { error?: string };
				if (stopped) return;
				if (res.ok) {
					setState(json);
					setError(null);
				} else {
					setError(json.error ?? `errore ${res.status}`);
				}
			} catch {
				if (!stopped) setError("errore di rete");
			}
		}

		poll();
		const id = setInterval(poll, 25000);
		return () => {
			stopped = true;
			clearInterval(id);
		};
	}, [roomId]);

	const isHost = state?.members.find((m) => m.isMe)?.isHost ?? false;

	async function saveDisc(member: Member) {
		const track = member.now?.track;
		if (!track) return;
		const res = await fetch("/api/discs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				trackUri: track.uri,
				trackName: track.name,
				artists: track.artists,
				album: track.album,
				coverUrl: track.coverUrl,
				savedFromName: member.isMe ? null : member.name,
			}),
		});
		if (res.ok) {
			setSavedUri(track.uri);
			setTimeout(() => setSavedUri(null), 2000);
		}
	}

	async function copyInvite() {
		if (!state?.inviteUrl) return;
		await navigator.clipboard.writeText(state.inviteUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	async function leaveRoom() {
		const res = await fetch(`/api/rooms/${roomId}/members/me`, { method: "DELETE" });
		if (res.ok) window.location.href = "/";
	}

	async function deleteRoom() {
		const res = await fetch(`/api/rooms/${roomId}`, { method: "DELETE" });
		if (res.ok) window.location.href = "/";
	}

	return (
		<div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
			<div className="flex items-start justify-between flex-wrap gap-4">
				<div>
					<h1 className="text-3xl font-semibold">{roomName}</h1>
					<p className="text-sm text-[#8A94B8]">
						{state ? `${state.members.length} sul piatto` : "carico la stanza..."}
						{!isMember && <span className="text-[#E64DA8]"> · sei spettatore</span>}
					</p>
				</div>

				{isMember && (
					<div className="flex items-center gap-3 flex-wrap">
						<button
							onClick={copyInvite}
							className="rounded-full border border-[#4DD8E6] text-[#4DD8E6] text-sm px-5 py-2 hover:bg-[#4DD8E6]/10"
						>
							{copied ? "Link copiato ✓" : "Copia link d'invito"}
						</button>

						{isHost ? (
							confirmDelete ? (
								<div className="flex items-center gap-2">
									<button
										onClick={deleteRoom}
										className="rounded-full bg-red-500/10 border border-red-500 text-red-400 text-sm px-4 py-2 hover:bg-red-500/20"
									>
										Sì, elimina
									</button>
									<button
										onClick={() => setConfirmDelete(false)}
										className="rounded-full border border-[#232A45] text-[#8A94B8] text-sm px-4 py-2 hover:border-[#4DD8E6]"
									>
										Annulla
									</button>
								</div>
							) : (
								<button
									onClick={() => setConfirmDelete(true)}
									className="rounded-full border border-[#3A2A2A] text-[#8A5050] text-sm px-5 py-2 hover:border-red-500 hover:text-red-400"
								>
									Elimina stanza
								</button>
							)
						) : (
							<button
								onClick={leaveRoom}
								className="rounded-full border border-[#3A2A2A] text-[#8A5050] text-sm px-5 py-2 hover:border-red-500 hover:text-red-400"
							>
								Lascia la stanza
							</button>
						)}
					</div>
				)}

				{!isMember && (
					<p className="text-xs text-[#8A94B8] max-w-60 text-right">
						Stai solo guardando: per mettere il tuo disco sul piatto serve un link d&apos;invito.
					</p>
				)}
			</div>

			{error && <p className="text-red-400 text-sm">{error}</p>}

			<div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
				{state?.members.map((member) => {
					const track = member.now?.track ?? null;
					return (
						<div
							key={member.id}
							className={`flex flex-col items-center gap-3 rounded-2xl bg-[#11152A] border p-6 ${
								member.isMe ? "border-[#E64DA8]" : "border-[#232A45]"
							}`}
						>
							<p className="text-sm text-[#8A94B8]">
								{member.isHost && <span className="text-[#E64DA8] mr-1">★</span>}
								{member.isMe ? "Tu" : member.name}
								{member.now && (
									<span className={member.now.playing ? "text-[#4DD8E6]" : "text-[#8A94B8]"}>
										{member.now.playing
											? " · in ascolto"
											: member.now.lastKnown
												? " · ultimo ascolto"
												: " · in pausa"}
									</span>
								)}
							</p>

							{member.now && track ? (
								<>
									<VinylDisc
										progressMs={member.now.progressMs}
										fetchedAt={member.now.fetchedAt}
										playing={member.now.playing}
										coverUrl={track.coverUrl}
										size={170}
									/>
									<div className="text-center">
										<p className="font-medium leading-tight">{track.name}</p>
										<p className="text-xs text-[#8A94B8] mt-1">{track.artists}</p>
									</div>
									<button
										onClick={() => saveDisc(member)}
										className="rounded-full border border-[#E64DA8] text-[#E64DA8] text-xs px-4 py-1.5 hover:bg-[#E64DA8]/10"
									>
										{savedUri === track.uri ? "Nello scaffale ✓" : "💿 Salva il disco"}
									</button>
								</>
							) : (
								<>
									<div className="w-[170px] h-[170px] rounded-full border border-dashed border-[#232A45] flex items-center justify-center">
										<span className="text-xs text-[#5E6B96]">piatto fermo</span>
									</div>
									<p className="text-xs text-[#5E6B96]">nessun disco sul piatto</p>
								</>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
