"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateRoomForm() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function create(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || busy) return;
		setBusy(true);
		setError(null);
		try {
			const res = await fetch("/api/rooms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim() }),
			});
			const json = (await res.json()) as { id?: string; error?: string };
			if (!res.ok || !json.id) {
				setError(json.error ?? "errore nella creazione");
				return;
			}
			router.push(`/room/${json.id}`);
		} catch {
			setError("errore di rete");
		} finally {
			setBusy(false);
		}
	}

	return (
		<form onSubmit={create} className="flex gap-3">
			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Nome della stanza (es. Italo Disco Basement)"
				maxLength={60}
				className="flex-1 rounded-full bg-[#11152A] border border-[#232A45] px-5 py-3 text-sm placeholder-[#5E6B96] focus:border-[#4DD8E6] focus:outline-none"
			/>
			<button
				type="submit"
				disabled={busy || !name.trim()}
				className="rounded-full bg-[#E64DA8] text-[#4B1528] font-medium px-6 py-3 text-sm disabled:opacity-40 hover:opacity-90"
			>
				{busy ? "..." : "Crea stanza"}
			</button>
			{error && <p className="text-red-400 text-sm self-center">{error}</p>}
		</form>
	);
}
