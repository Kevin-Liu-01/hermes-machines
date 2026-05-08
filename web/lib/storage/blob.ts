/**
 * Vercel Blob persistence for chat history + artifacts.
 *
 * Layout (per user):
 *   users/<userId>/chats/<chatId>.json     -- ChatRecord
 *   users/<userId>/chats-index.json        -- ChatSummary[]
 *   users/<userId>/artifacts/<id>/<name>   -- raw artifact bytes
 *   users/<userId>/artifacts-index.json    -- ArtifactRef[]
 *
 * The index files exist so the dashboard can list a user's chats and
 * artifacts in one round-trip without paginating through `list()`. We
 * rewrite the index alongside every chat/artifact mutation -- this is
 * O(N) writes per change, but N is small (single user, ~hundreds at
 * most), so the cost is negligible compared to the network hop.
 *
 * Graceful degradation: when `BLOB_READ_WRITE_TOKEN` is not set the
 * helpers throw `BlobUnavailableError`. API routes catch this and
 * return `{ ok: false, reason: "storage_not_configured" }` so the UI
 * can render a "set BLOB_READ_WRITE_TOKEN" affordance instead of
 * crashing.
 */

import { del, head, list, put } from "@vercel/blob";

import type { Message } from "@/lib/types";

export class BlobUnavailableError extends Error {
	constructor(
		message = "Vercel Blob is not configured. Set BLOB_READ_WRITE_TOKEN in Vercel env, then redeploy.",
	) {
		super(message);
		this.name = "BlobUnavailableError";
	}
}

function ensureToken(): void {
	if (!process.env.BLOB_READ_WRITE_TOKEN) {
		throw new BlobUnavailableError();
	}
}

export type ChatSummary = {
	id: string;
	title: string;
	machineId: string | null;
	model: string | null;
	createdAt: string;
	updatedAt: string;
	messageCount: number;
};

export type ChatRecord = ChatSummary & {
	messages: Message[];
};

export type ArtifactRef = {
	id: string;
	name: string;
	mime: string;
	bytes: number;
	url: string;
	chatId: string | null;
	createdAt: string;
};

const CHAT_PREFIX = (userId: string) => `users/${userId}/chats`;
const CHATS_INDEX = (userId: string) => `users/${userId}/chats-index.json`;
const ARTIFACT_PREFIX = (userId: string) => `users/${userId}/artifacts`;
const ARTIFACTS_INDEX = (userId: string) => `users/${userId}/artifacts-index.json`;

const JSON_OPTS = {
	access: "public" as const,
	contentType: "application/json",
	addRandomSuffix: false,
	allowOverwrite: true,
};

async function readJson<T>(pathname: string): Promise<T | null> {
	ensureToken();
	try {
		const meta = await head(pathname, {
			token: process.env.BLOB_READ_WRITE_TOKEN,
		});
		const response = await fetch(meta.url, { cache: "no-store" });
		if (!response.ok) return null;
		return (await response.json()) as T;
	} catch (err) {
		// `head` throws when the blob does not exist -- that's expected
		// for first reads. Any other error bubbles up.
		if (err instanceof Error && /not.*found|does not exist/i.test(err.message)) {
			return null;
		}
		throw err;
	}
}

async function writeJson<T>(pathname: string, value: T): Promise<void> {
	ensureToken();
	await put(pathname, JSON.stringify(value), JSON_OPTS);
}

/* ------------------------------------------------------------------ */
/* Chats                                                              */
/* ------------------------------------------------------------------ */

function chatPath(userId: string, chatId: string): string {
	return `${CHAT_PREFIX(userId)}/${chatId}.json`;
}

export async function listChats(userId: string): Promise<ChatSummary[]> {
	const index = await readJson<ChatSummary[]>(CHATS_INDEX(userId));
	if (index) return index.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	// Index missing -- fall back to a `list` and rebuild it.
	const blobs = await list({
		prefix: `${CHAT_PREFIX(userId)}/`,
		token: process.env.BLOB_READ_WRITE_TOKEN,
	});
	const summaries: ChatSummary[] = [];
	for (const blob of blobs.blobs) {
		const record = await readJson<ChatRecord>(blob.pathname);
		if (record) summaries.push(stripMessages(record));
	}
	const sorted = summaries.sort((a, b) =>
		b.updatedAt.localeCompare(a.updatedAt),
	);
	if (sorted.length > 0) await writeJson(CHATS_INDEX(userId), sorted);
	return sorted;
}

export async function loadChat(
	userId: string,
	chatId: string,
): Promise<ChatRecord | null> {
	return readJson<ChatRecord>(chatPath(userId, chatId));
}

function stripMessages(record: ChatRecord): ChatSummary {
	const { messages, ...summary } = record;
	void messages;
	return summary;
}

export async function saveChat(
	userId: string,
	record: ChatRecord,
): Promise<void> {
	await writeJson(chatPath(userId, record.id), record);
	const index = (await listChats(userId)).filter((c) => c.id !== record.id);
	const next = [stripMessages(record), ...index].sort((a, b) =>
		b.updatedAt.localeCompare(a.updatedAt),
	);
	await writeJson(CHATS_INDEX(userId), next);
}

export async function deleteChat(userId: string, chatId: string): Promise<void> {
	ensureToken();
	try {
		const meta = await head(chatPath(userId, chatId), {
			token: process.env.BLOB_READ_WRITE_TOKEN,
		});
		await del(meta.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
	} catch {
		// already gone
	}
	const index = (await listChats(userId)).filter((c) => c.id !== chatId);
	await writeJson(CHATS_INDEX(userId), index);
}

/* ------------------------------------------------------------------ */
/* Artifacts                                                          */
/* ------------------------------------------------------------------ */

function artifactPath(userId: string, id: string, name: string): string {
	return `${ARTIFACT_PREFIX(userId)}/${id}/${safeName(name)}`;
}

function safeName(name: string): string {
	return name
		.replace(/[^a-zA-Z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 120) || "artifact";
}

export async function listArtifacts(userId: string): Promise<ArtifactRef[]> {
	const index = await readJson<ArtifactRef[]>(ARTIFACTS_INDEX(userId));
	if (index) return index.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	return [];
}

export async function saveArtifact(args: {
	userId: string;
	id: string;
	name: string;
	mime: string;
	body: ArrayBuffer | Buffer | Blob | string;
	chatId?: string;
}): Promise<ArtifactRef> {
	ensureToken();
	const path = artifactPath(args.userId, args.id, args.name);
	const result = await put(path, args.body, {
		access: "public",
		contentType: args.mime,
		addRandomSuffix: false,
		allowOverwrite: true,
	});
	const bytes =
		typeof args.body === "string"
			? new TextEncoder().encode(args.body).byteLength
			: args.body instanceof Blob
				? args.body.size
				: args.body instanceof ArrayBuffer
					? args.body.byteLength
					: (args.body as Buffer).byteLength;
	const ref: ArtifactRef = {
		id: args.id,
		name: args.name,
		mime: args.mime,
		bytes,
		url: result.url,
		chatId: args.chatId ?? null,
		createdAt: new Date().toISOString(),
	};
	const index = (await listArtifacts(args.userId)).filter((a) => a.id !== ref.id);
	await writeJson(ARTIFACTS_INDEX(args.userId), [ref, ...index]);
	return ref;
}

export async function deleteArtifact(
	userId: string,
	id: string,
): Promise<void> {
	const index = await listArtifacts(userId);
	const ref = index.find((a) => a.id === id);
	if (ref) {
		try {
			await del(ref.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
		} catch {
			// already gone
		}
	}
	await writeJson(
		ARTIFACTS_INDEX(userId),
		index.filter((a) => a.id !== id),
	);
}

export function isStorageConfigured(): boolean {
	return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
