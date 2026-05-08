/**
 * GET / POST /api/dashboard/artifacts
 *
 * GET  -- list user's artifacts.
 * POST -- multipart upload: file + optional chatId. Returns the persisted ref.
 *
 * Files go to Vercel Blob under users/<userId>/artifacts/<id>/<name>.
 * The metadata index (URL, mime, bytes, chatId) lives next to the
 * blobs in users/<userId>/artifacts-index.json so the dashboard can
 * render the gallery in one round-trip.
 */

import { randomUUID } from "node:crypto";

import { auth } from "@clerk/nextjs/server";

import {
	BlobUnavailableError,
	isStorageConfigured,
	listArtifacts,
	saveArtifact,
} from "@/lib/storage/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;

export async function GET(): Promise<Response> {
	const { userId } = await auth();
	if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
	if (!isStorageConfigured()) {
		return Response.json({
			ok: false,
			reason: "storage_not_configured",
			artifacts: [],
		});
	}
	try {
		const artifacts = await listArtifacts(userId);
		return Response.json({ ok: true, artifacts });
	} catch (err) {
		if (err instanceof BlobUnavailableError) {
			return Response.json({
				ok: false,
				reason: "storage_not_configured",
				artifacts: [],
			});
		}
		const message = err instanceof Error ? err.message : "unknown_error";
		return Response.json({ error: "list_failed", message }, { status: 502 });
	}
}

export async function POST(request: Request): Promise<Response> {
	const { userId } = await auth();
	if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
	if (!isStorageConfigured()) {
		return Response.json(
			{ error: "storage_not_configured" },
			{ status: 503 },
		);
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return Response.json({ error: "invalid_form" }, { status: 400 });
	}
	const file = form.get("file");
	const chatId = form.get("chatId");
	if (!(file instanceof File)) {
		return Response.json({ error: "file_required" }, { status: 422 });
	}
	if (file.size > MAX_BYTES) {
		return Response.json(
			{
				error: "too_large",
				message: `Artifact exceeds ${MAX_BYTES} byte limit (got ${file.size}).`,
			},
			{ status: 413 },
		);
	}
	try {
		const ref = await saveArtifact({
			userId,
			id: randomUUID(),
			name: file.name,
			mime: file.type || "application/octet-stream",
			body: await file.arrayBuffer(),
			chatId: typeof chatId === "string" && chatId ? chatId : undefined,
		});
		return Response.json({ ok: true, artifact: ref });
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
