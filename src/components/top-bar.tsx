import Link from "next/link";

import type { DbUser } from "@/lib/session";

export function TopBar({ user }: { user: DbUser }) {
	return (
		<header className="flex items-center justify-between px-6 py-4 border-b border-[#232A45]">
			<Link href="/" className="text-xl font-semibold tracking-wide">
				<span className="text-[#E64DA8]">◉</span> Vinly
			</Link>
			<nav className="flex items-center gap-5 text-sm">
				<Link href="/" className="opacity-80 hover:opacity-100 hover:text-[#4DD8E6]">
					Lounge
				</Link>
				<Link href="/library" className="opacity-80 hover:opacity-100 hover:text-[#4DD8E6]">
					Libreria
				</Link>
				{user.avatar_url ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={user.avatar_url} alt={user.display_name} className="w-8 h-8 rounded-full" />
				) : (
					<span className="w-8 h-8 rounded-full bg-[#E64DA8] flex items-center justify-center text-xs">
						{user.display_name.slice(0, 2).toUpperCase()}
					</span>
				)}
			</nav>
		</header>
	);
}
