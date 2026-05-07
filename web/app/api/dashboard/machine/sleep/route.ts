/**
 * POST /api/dashboard/machine/sleep
 *
 * Pauses the running machine to save costs. Sleep preserves disk and
 * process state; the next wake brings everything back including the
 * cloudflared tunnel URL.
 *
 * Idempotent: if the machine is already in any non-running state we
 * return the current summary unchanged.
 */

import { auth } from "@clerk/nextjs/server";

import { sleepMachine } from "@/lib/dashboard/dedalus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	try {
		const summary = await sleepMachine();
		return Response.json(summary, {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "sleep failed";
		return Response.json(
			{ error: "sleep_failed", message },
			{ status: 502 },
		);
	}
}
