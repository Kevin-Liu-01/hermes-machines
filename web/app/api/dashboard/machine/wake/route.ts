/**
 * POST /api/dashboard/machine/wake
 *
 * Auth-gated mutation that wakes the configured Dedalus machine.
 *
 * The route is idempotent on every layer of the stack:
 *   - the dashboard fires it on first dashboard mount when the machine
 *     is sleeping; multiple users opening the dashboard simultaneously
 *     don't race because Dedalus rejects duplicate wakes via If-Match.
 *   - the route itself returns the current summary immediately if the
 *     machine is already running or mid-wake.
 *   - the response always carries the machine's current phase so the
 *     caller can drop straight into status polling on /api/dashboard/machine.
 */

import { auth } from "@clerk/nextjs/server";

import { wakeMachine } from "@/lib/dashboard/dedalus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	try {
		const summary = await wakeMachine();
		return Response.json(summary, {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "wake failed";
		return Response.json(
			{ error: "wake_failed", message },
			{ status: 502 },
		);
	}
}
