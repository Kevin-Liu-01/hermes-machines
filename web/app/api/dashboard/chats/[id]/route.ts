/**
 * GET / DELETE /api/dashboard/chats/[id]
 *
 * GET    -- load full chat (messages + summary).
 * DELETE -- remove chat from Blob and from the user's index.
 */

import { auth } from "@clerk/nextjs/server";

import {
	BlobUnavailableError,
	deleteChat,
	isStorageConfigured,
	loadChat,
} from "@/lib/storage/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx): Promise<Response> {
	const { userId } = await auth();
	if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
	if (!isStorageConfigured()) {
		return Response.json(
			{
				error: "storage_not_configured",
				message: "Vercel Blob is not configured.",
			},
			{ status: 503 },
		);
	}
	const { id } = await ctx.params;
	try {
		const chat = await loadChat(userId, id);
		if (!chat) return Response.json({ error: "not_found" }, { status: 404 });
		return Response.json({ ok: true, chat });
	} catch (err) {
		if (err instanceof BlobUnavailableError) {
			return Response.json(
				{ error: "storage_not_configured", message: err.message },
				{ status: 503 },
			);
		}
		const message = err instanceof Error ? err.message : "unknown_error";
		return Response.json({ error: "load_failed", message }, { status: 502 });
	}
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
	const { userId } = await auth();
	if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
	if (!isStorageConfigured()) {
		return Response.json(
			{
				error: "storage_not_configured",
				message: "Vercel Blob is not configured.",
			},
			{ status: 503 },
		);
	}
	const { id } = await ctx.params;
	try {
		await deleteChat(userId, id);
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
