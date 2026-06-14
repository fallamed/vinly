import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { getDb } from "@/db";
import { users } from "@/db/schema";

export type DbUser = typeof users.$inferSelect;

export const SESSION_COOKIE = "vinly_session";

export async function getCurrentUser(): Promise<DbUser | null> {
	const token = (await cookies()).get(SESSION_COOKIE)?.value;
	if (!token) return null;
	const user = await getDb().select().from(users).where(eq(users.sessionToken, token)).get();
	return user ?? null;
}
