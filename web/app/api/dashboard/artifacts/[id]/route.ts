/**
 * DELETE /api/dashboard/artifacts/[id]
 *
 * Removes an artifact from Vercel Blob and from the user's index.
 */

import { auth } from "@clerk/nextjs/server";

import {
	BlobUnavailableError,
	deleteArtifact,
	isStorageConfigured,
} from "@/lib/storage/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
	const { userId } = await auth();
	if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
	if (!isStorageConfigured()) {
		return Response.json(
			{ error: "storage_not_configured" },
			{ status: 503 },
		);
	}
	const { id } = await ctx.params;
	try {
		await deleteArtifact(userId, id);
		return Response.json({ ok: true });
	} catch (err) {
		if (err instanceof BlobUnavailableError) {
			return Response.json(
				{ error: "storage_not_configured", message: err.message },
				{ status: 503 },
			);
		}
		const message = err instanceof Error ? err.message : "unknown_error";
		return Response.json({ error: "delete_failed", message }, { status: 502 });
	}
}
