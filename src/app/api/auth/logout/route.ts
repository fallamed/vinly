import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";

export async function GET(request: Request) {
	(await cookies()).delete(SESSION_COOKIE);
	const origin = new URL(request.url).origin;
	return NextResponse.redirect(`${origin}/`, { status: 302 });
}
