/**
 * GET / POST /api/dashboard/chats
 *
 * GET  -- returns the user's chat list (summaries; no message bodies).
 * POST -- creates or updates a chat; saves messages + summary back to Vercel Blob.
 *
 * The chat UI auto-saves on every message exchange. The streaming chat
 * endpoint stays in /api/chat (no change there); the client is the one
 * that calls POST /api/dashboard/chats once a stream finishes to
 * persist the new turn.
 */

import { auth } from "@clerk/nextjs/server";

import {
	BlobUnavailableError,
	isStorageConfigured,
	listChats,
	saveChat,
	type ChatRecord,
} from "@/lib/storage/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	if (!isStorageConfigured()) {
		return Response.json({
			ok: false,
			reason: "storage_not_configured",
			message:
				"Vercel Blob is not configured. Set BLOB_READ_WRITE_TOKEN to enable chat history.",
			chats: [],
		});
	}
	try {
		const chats = await listChats(userId);
		return Response.json({ ok: true, chats });
	} catch (err) {
		if (err instanceof BlobUnavailableError) {
			return Response.json({
				ok: false,
				reason: "storage_not_configured",
				message: err.message,
				chats: [],
			});
		}
		const message = err instanceof Error ? err.message : "unknown_error";
		return Response.json({ error: "list_failed", message }, { status: 502 });
	}
}

export async function POST(request: Request): Promise<Response> {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}
	if (!isStorageConfigured()) {
		return Response.json(
			{
				error: "storage_not_configured",
				message:
					"Vercel Blob is not configured. Set BLOB_READ_WRITE_TOKEN to enable chat history.",
			},
			{ status: 503 },
		);
	}
	let body: ChatRecord;
	try {
		body = (await request.json()) as ChatRecord;
	} catch {
		return Response.json({ error: "invalid_json" }, { status: 400 });
	}
	if (!body.id || typeof body.id !== "string") {
		return Response.json({ error: "id_required" }, { status: 422 });
	}
	if (!Array.isArray(body.messages)) {
		return Response.json({ error: "messages_required" }, { status: 422 });
	}
	const now = new Date().toISOString();
	const record: ChatRecord = {
		...body,
		updatedAt: now,
		createdAt: body.createdAt || now,
		messageCount: body.messages.length,
		title: (body.title || derivedTitle(body.messages)).slice(0, 120),
	};
	try {
		await saveChat(userId, record);
		return Response.json({ ok: true, chat: record });
	} catch (err) {
		if (err instanceof BlobUnavailableError) {
			return Response.json(
				{ error: "storage_not_configured", message: err.message },
				{ status: 503 },
			);
		}
		const message = err instanceof Error ? err.message : "unknown_error";
		return Response.json({ error: "save_failed", message }, { status: 502 });
	}
}

function derivedTitle(messages: ChatRecord["messages"]): string {
	const firstUser = messages.find((m) => m.role === "user");
	if (!firstUser) return "untitled chat";
	const text = firstUser.content.trim().replace(/\s+/g, " ");
	return text.length > 0 ? text : "untitled chat";
}
