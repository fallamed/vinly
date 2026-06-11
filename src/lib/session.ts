import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";

export type DbUser = {
	id: string;
	display_name: string;
	avatar_url: string | null;
	product: string | null;
	access_token: string;
	refresh_token: string;
	token_expires_at: number;
	session_token: string;
	created_at: number;
};

export const SESSION_COOKIE = "vinly_session";

export async function getCurrentUser(): Promise<DbUser | null> {
	const token = (await cookies()).get(SESSION_COOKIE)?.value;
	if (!token) return null;
	const { env } = getCloudflareContext();
	return await env.DB.prepare("SELECT * FROM users WHERE session_token = ?")
		.bind(token)
		.first<DbUser>();
}
