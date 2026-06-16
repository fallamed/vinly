import { redirect } from "next/navigation";

import { SetupForm } from "@/components/setup-form";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/");
	if (user.username) redirect("/");

	return (
		<main className="min-h-screen bg-[#0B0E1A] text-[#E6EAF5] font-sans flex items-center justify-center px-6">
			<div className="w-full max-w-sm flex flex-col gap-8">
				<div>
					<p className="text-[#E64DA8] text-2xl mb-3">◉ Vinly</p>
					<h1 className="text-2xl font-semibold mb-1">Benvenuto, {user.displayName}</h1>
					<p className="text-[#8A94B8] text-sm">Prima di entrare, scegli come vuoi apparire nelle stanze.</p>
				</div>
				<SetupForm />
			</div>
		</main>
	);
}
