import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(request: Request) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "non loggato" }, { status: 401 });

	const body = (await request.json()) as { username?: unknown };
	const raw = body?.username;

	if (typeof raw !== "string" || !/^[a-zA-Z0-9_]{3,20}$/.test(raw)) {
		return NextResponse.json(
			{ error: "username non valido: 3-20 caratteri, solo lettere, numeri e _" },
			{ status: 400 },
		);
	}

	try {
		await getDb().update(users).set({ username: raw }).where(eq(users.id, user.id));
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "username già in uso" }, { status: 409 });
	}
}
