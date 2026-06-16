"use client";

import { useState } from "react";

export function SetupForm() {
	const [value, setValue] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		const res = await fetch("/api/account", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: value }),
		});
		const json = (await res.json()) as { ok?: boolean; error?: string };
		setLoading(false);
		if (res.ok) {
			window.location.href = "/";
		} else {
			setError(json.error ?? "errore sconosciuto");
		}
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				<label className="text-sm text-[#8A94B8]">Scegli un username</label>
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
			</div>
			{error && <p className="text-red-400 text-sm">{error}</p>}
			<button
				type="submit"
				disabled={loading}
				className="rounded-full bg-[#E64DA8] text-white text-sm font-medium px-6 py-3 hover:bg-[#E64DA8]/90 disabled:opacity-50"
			>
				{loading ? "Salvo..." : "Entra in Vinly"}
			</button>
		</form>
	);
}
