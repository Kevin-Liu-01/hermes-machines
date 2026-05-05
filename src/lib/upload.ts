/**
 * Ship a directory of knowledge into the VM.
 *
 * The execution API can't take heredocs, multi-line strings, or arbitrary
 * binary stdin reliably, so we tar+gzip the knowledge folder locally, encode
 * it as a single base64 string, write it to disk in chunks via `printf`,
 * and then `tar -xzf` it inside the VM. Slower than rsync, but bulletproof.
 *
 * Chunked because Linux ARG_MAX caps a single `printf` argument around 128KB
 * on many configurations; we pick 64KB chunks to stay well below it.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Dedalus from "dedalus";

import { exec } from "./exec.js";
import { VM_HOME, VM_KNOWLEDGE_DROP } from "./constants.js";

const CHUNK_BYTES = 64 * 1024;

const TAR_EXCLUDES = ["node_modules", "dist", ".git", ".DS_Store"];

function tarballDirectory(sourceDir: string): Buffer {
	if (!existsSync(sourceDir)) {
		throw new Error(`Source directory not found: ${sourceDir}`);
	}
	const tmp = mkdtempSync(join(tmpdir(), "hermes-payload-"));
	const archivePath = join(tmp, "payload.tar.gz");
	try {
		const args = ["-czf", archivePath];
		for (const exclude of TAR_EXCLUDES) args.push(`--exclude=${exclude}`);
		args.push("-C", sourceDir, ".");
		const result = spawnSync("tar", args, { stdio: "pipe" });
		if (result.status !== 0) {
			throw new Error(
				`tar failed: ${result.stderr.toString().trim() || "exit " + result.status}`,
			);
		}
		return readFileSync(archivePath);
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

function chunkBase64(buffer: Buffer): string[] {
	const encoded = buffer.toString("base64");
	const out: string[] = [];
	for (let offset = 0; offset < encoded.length; offset += CHUNK_BYTES) {
		out.push(encoded.slice(offset, offset + CHUNK_BYTES));
	}
	return out;
}

/**
 * Upload `sourceDir` to the VM and unpack it into `destDir`. Existing files
 * at the destination are overwritten so re-running is idempotent.
 */
export async function uploadKnowledge(
	client: Dedalus,
	machineId: string,
	sourceDir: string,
	destDir: string,
): Promise<{ chunks: number; sizeBytes: number }> {
	const archive = tarballDirectory(sourceDir);
	const chunks = chunkBase64(archive);

	await exec(client, machineId, `rm -f ${VM_KNOWLEDGE_DROP}.b64 ${VM_KNOWLEDGE_DROP}`);
	await exec(client, machineId, `mkdir -p ${VM_HOME} ${destDir}`);

	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i];
		// `printf %s` avoids interpreting backslashes; redirect to append.
		await exec(
			client,
			machineId,
			`printf %s '${chunk}' >> ${VM_KNOWLEDGE_DROP}.b64`,
			{ timeoutMs: 60_000 },
		);
	}

	await exec(
		client,
		machineId,
		`base64 -d ${VM_KNOWLEDGE_DROP}.b64 > ${VM_KNOWLEDGE_DROP} && rm ${VM_KNOWLEDGE_DROP}.b64`,
	);
	await exec(
		client,
		machineId,
		`tar -xzf ${VM_KNOWLEDGE_DROP} -C ${destDir} && rm ${VM_KNOWLEDGE_DROP}`,
		{ timeoutMs: 60_000 },
	);

	return { chunks: chunks.length, sizeBytes: archive.length };
}
