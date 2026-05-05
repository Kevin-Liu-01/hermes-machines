/**
 * Minimal pretty progress reporter for long deploy phases.
 *
 * Each phase prints `→ name` while running, then collapses to `✓ name (1.2s)`
 * once done. Errors print `✗ name`. No deps; uses ANSI escapes directly so it
 * works in any TTY without bringing in chalk/listr/ora.
 */

const ANSI = {
	reset: "\x1b[0m",
	dim: "\x1b[2m",
	bold: "\x1b[1m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	gray: "\x1b[90m",
};

const isTty = Boolean(process.stdout.isTTY);

function fmt(color: keyof typeof ANSI, text: string): string {
	if (!isTty) return text;
	return `${ANSI[color]}${text}${ANSI.reset}`;
}

function elapsed(startMs: number): string {
	const seconds = (Date.now() - startMs) / 1000;
	if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
	return `${seconds.toFixed(1)}s`;
}

export function info(message: string): void {
	console.log(`${fmt("cyan", "→")} ${message}`);
}

export function success(message: string, startMs?: number): void {
	const suffix = startMs ? ` ${fmt("gray", `(${elapsed(startMs)})`)}` : "";
	console.log(`${fmt("green", "✓")} ${message}${suffix}`);
}

export function warn(message: string): void {
	console.log(`${fmt("yellow", "⚠")} ${message}`);
}

export function fail(message: string): void {
	console.log(`${fmt("red", "✗")} ${message}`);
}

export function dim(message: string): void {
	console.log(fmt("gray", message));
}

export function header(label: string): void {
	if (!isTty) {
		console.log(`\n=== ${label} ===\n`);
		return;
	}
	const line = "─".repeat(Math.max(8, 60 - label.length - 2));
	console.log(`\n${fmt("gray", "─".repeat(2))} ${fmt("bold", label)} ${fmt("gray", line)}\n`);
}

export async function phase<T>(
	name: string,
	fn: () => Promise<T>,
): Promise<T> {
	const start = Date.now();
	info(name);
	try {
		const result = await fn();
		success(name, start);
		return result;
	} catch (err) {
		fail(name);
		throw err;
	}
}
