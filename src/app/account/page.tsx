import { redirect } from "next/navigation";

import { AccountForm } from "@/components/account-form";
import { TopBar } from "@/components/top-bar";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

function formatDate(ms: number): string {
	return new Date(ms).toLocaleDateString("it-IT", { year: "numeric", month: "long" });
}

export default async function AccountPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/");

	return (
		<main className="min-h-screen bg-[#0B0E1A] text-[#E6EAF5] font-sans">
			<TopBar user={user} />
			<div className="max-w-lg mx-auto px-6 py-12 flex flex-col gap-10">
				<div className="flex items-center gap-5">
					{user.avatarUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={user.avatarUrl} alt={user.displayName} className="w-20 h-20 rounded-full" />
					) : (
						<span className="w-20 h-20 rounded-full bg-[#E64DA8] flex items-center justify-center text-2xl font-semibold">
							{user.displayName.slice(0, 2).toUpperCase()}
						</span>
					)}
					<div>
						<h1 className="text-2xl font-semibold">{user.displayName}</h1>
						{user.username && <p className="text-[#4DD8E6] text-sm mt-0.5">@{user.username}</p>}
						<p className="text-[#8A94B8] text-xs mt-1">
							{user.product === "premium" ? "Spotify Premium" : "Spotify Free"} · membro da{" "}
							{formatDate(user.createdAt)}
						</p>
					</div>
				</div>

				<div className="border-t border-[#232A45] pt-8">
					<h2 className="text-lg font-medium mb-5">Profilo pubblico</h2>
					<AccountForm currentUsername={user.username} />
				</div>
			</div>
		</main>
	);
}
