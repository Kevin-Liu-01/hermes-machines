"use client";

import { useMachineControl } from "@/lib/dashboard/use-machine-control";

/**
 * Renders nothing. Mounted in the dashboard layout so any /dashboard/*
 * page auto-wakes the container on entry. The hook is the same one the
 * Overview page uses; calling it twice is fine -- both instances poll
 * `/api/dashboard/machine` independently and the wake API is idempotent.
 *
 * This is what makes "the deployed app auto-wakes my container" true:
 * land on /dashboard/chat, go straight to chatting; land on
 * /dashboard/logs, the logs poll succeeds because the container is
 * already coming up. No CLI required.
 */
export function AutoWake() {
	useMachineControl();
	return null;
}
