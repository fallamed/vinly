"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountForm({ currentUsername }: { currentUsername: string | null }) {
	const router = useRouter();
	const [value, setValue] = useState(currentUsername ?? "");
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const [loading, setLoading] = useState(false);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSaved(false);
		setLoading(true);
		const res = await fetch("/api/account", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: value }),
		});
		const json = (await res.json()) as { ok?: boolean; error?: string };
		setLoading(false);
		if (res.ok) {
			setSaved(true);
			router.refresh();
		} else {
			setError(json.error ?? "errore sconosciuto");
		}
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-3">
			<label className="text-sm text-[#8A94B8]">Username</label>
			<div className="flex items-center gap-0 rounded-xl border border-[#232A45] bg-[#11152A] overflow-hidden focus-within:border-[#4DD8E6]">
				<span className="px-3 text-[#5E6B96] select-none">@</span>
				<input
					type="text"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder="il_tuo_nome"
					maxLength={20}
					pattern="[a-zA-Z0-9_]{3,20}"
					required
					className="flex-1 bg-transparent py-3 pr-4 text-[#E6EAF5] outline-none placeholder:text-[#3A4466]"
				/>
			</div>
			<p className="text-xs text-[#5E6B96]">3-20 caratteri: lettere, numeri, trattino basso</p>
			{error && <p className="text-red-400 text-sm">{error}</p>}
			{saved && <p className="text-[#4DD8E6] text-sm">Salvato ✓</p>}
			<button
				type="submit"
				disabled={loading}
				className="self-start rounded-full border border-[#4DD8E6] text-[#4DD8E6] text-sm px-5 py-2 hover:bg-[#4DD8E6]/10 disabled:opacity-50"
			>
				{loading ? "Salvo..." : "Aggiorna"}
			</button>
		</form>
	);
}
