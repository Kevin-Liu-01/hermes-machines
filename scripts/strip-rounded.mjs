#!/usr/bin/env node
/**
 * One-shot: strip every `rounded-*` Tailwind utility from web/{app,components}
 * TSX sources. Reticle is sharp corners everywhere -- pill shapes, card edges,
 * code blocks, all of it.
 *
 * Approach: scan the file content for all rounded-* tokens. A "token" is the
 * literal `rounded` optionally followed by a Tailwind suffix (`-md`, `-full`,
 * `-[var(--ret-card-radius)]`, etc.) and bounded by either whitespace, a quote
 * char (` ' " `` ` ``), an open paren, or a backslash. Surrounding whitespace
 * collapses cleanly so we don't leave double-spaces inside class strings.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = resolve(HERE, "..", "web");
const ROOTS = ["app", "components"].map((d) => join(WEB_ROOT, d));

// rounded-{none,sm,md,DEFAULT,lg,xl,2xl,3xl,full}
// rounded-{t,r,b,l,tl,tr,bl,br}{,-{none,sm,md,...}}
// rounded-[ARBITRARY]
// rounded (alone)
const SUFFIX = String.raw`(?:-(?:none|sm|md|lg|xl|2xl|3xl|full|s|e|ss|se|es|ee|t|r|b|l|tl|tr|bl|br)(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?|-\[[^\]]+\])?`;
const ROUND_PATTERN = new RegExp(
	String.raw`(^|[\s"'\`\\(])rounded${SUFFIX}(?=$|[\s"'\`\\)])`,
	"g",
);

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
			walk(full, out);
		} else if (
			entry.isFile() &&
			(entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
		) {
			out.push(full);
		}
	}
	return out;
}

function strip(file) {
	const before = readFileSync(file, "utf8");
	let after = before.replace(ROUND_PATTERN, (_match, lead) => lead);
	// Collapse runs of internal whitespace inside class strings the strip
	// leaves behind. Don't touch indentation: only operate inside quoted
	// string literals on a single line.
	after = after.replace(
		/("|'|`)([^"'`\n]*)\1/g,
		(full, quote, body) => `${quote}${body.replace(/[ \t]{2,}/g, " ").replace(/^[ \t]+|[ \t]+$/g, " ").replace(/^ ([^ ])/, "$1").replace(/([^ ]) $/, "$1")}${quote}`,
	);
	if (after === before) return false;
	writeFileSync(file, after);
	return true;
}

function main() {
	const files = ROOTS.flatMap((root) => {
		try {
			return statSync(root).isDirectory() ? walk(root) : [];
		} catch {
			return [];
		}
	});
	let changed = 0;
	for (const file of files) {
		if (strip(file)) {
			changed += 1;
			console.log(`  stripped ${file.replace(WEB_ROOT, "web")}`);
		}
	}
	console.log("");
	console.log(`strip-rounded: scanned ${files.length} files, changed ${changed}`);
}

main();
