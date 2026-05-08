"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Chat } from "@/components/Chat";
import { ReticleBadge } from "@/components/reticle/ReticleBadge";
import { ReticleButton } from "@/components/reticle/ReticleButton";
import { ReticleFrame } from "@/components/reticle/ReticleFrame";
import { ReticleHatch } from "@/components/reticle/ReticleHatch";
import { cn } from "@/lib/cn";
import type { Message } from "@/lib/types";

type ChatSummary = {
	id: string;
	title: string;
	machineId: string | null;
	model: string | null;
	createdAt: string;
	updatedAt: string;
	messageCount: number;
};

type ChatRecord = ChatSummary & { messages: Message[] };

type ListResponse = {
	ok: boolean;
	chats?: ChatSummary[];
	reason?: string;
	message?: string;
};

type LoadResponse = {
	ok: boolean;
	chat?: ChatRecord;
	error?: string;
	message?: string;
};

type Props = {
	activeMachineId: string | null;
	model: string | null;
};

const newId = () => `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function ChatShell({ activeMachineId, model }: Props) {
	const [chats, setChats] = useState<ChatSummary[]>([]);
	const [storageReason, setStorageReason] = useState<string | null>(null);
	const [activeChatId, setActiveChatId] = useState<string | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [busy, setBusy] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);

	const titleRef = useRef<string>("untitled chat");
	const createdAtRef = useRef<string>(new Date().toISOString());

	const refreshList = useCallback(async () => {
		try {
			const response = await fetch("/api/dashboard/chats", {
				cache: "no-store",
			});
			const body = (await response.json()) as ListResponse;
			if (!response.ok) {
				setLoadError(body.message ?? `HTTP ${response.status}`);
				return;
			}
			if (body.ok && body.chats) {
				setChats(body.chats);
				setStorageReason(null);
			} else {
				setStorageReason(body.message ?? body.reason ?? "Storage unavailable");
				setChats([]);
			}
		} catch (err) {
			setLoadError(err instanceof Error ? err.message : "fetch failed");
		}
	}, []);

	useEffect(() => {
		refreshList();
	}, [refreshList]);

	const loadChat = useCallback(async (chatId: string) => {
		setBusy(true);
		setLoadError(null);
		try {
			const response = await fetch(`/api/dashboard/chats/${chatId}`, {
				cache: "no-store",
			});
			const body = (await response.json()) as LoadResponse;
			if (!response.ok || !body.ok || !body.chat) {
				setLoadError(body.message ?? `HTTP ${response.status}`);
				return;
			}
			setActiveChatId(body.chat.id);
			setMessages(body.chat.messages ?? []);
			titleRef.current = body.chat.title;
			createdAtRef.current = body.chat.createdAt;
		} catch (err) {
			setLoadError(err instanceof Error ? err.message : "load failed");
		} finally {
			setBusy(false);
		}
	}, []);

	const newChat = useCallback(() => {
		setActiveChatId(newId());
		setMessages([]);
		titleRef.current = "untitled chat";
		createdAtRef.current = new Date().toISOString();
	}, []);

	const deleteChat = useCallback(
		async (chatId: string) => {
			if (!window.confirm("Delete this chat history?")) return;
			try {
				const response = await fetch(`/api/dashboard/chats/${chatId}`, {
					method: "DELETE",
				});
				if (!response.ok) {
					const body = (await response.json().catch(() => ({}))) as {
						message?: string;
					};
					setLoadError(body.message ?? `delete failed: HTTP ${response.status}`);
					return;
				}
				if (chatId === activeChatId) {
					setActiveChatId(null);
					setMessages([]);
				}
				await refreshList();
			} catch (err) {
				setLoadError(err instanceof Error ? err.message : "delete failed");
			}
		},
		[activeChatId, refreshList],
	);

	useEffect(() => {
		if (activeChatId !== null) return;
		if (chats.length > 0) {
			void loadChat(chats[0].id);
		} else {
			newChat();
		}
	}, [activeChatId, chats, loadChat, newChat]);

	const persistTurn = useCallback(
		async (final: Message[]) => {
			if (!activeChatId) return;
			if (storageReason) return;
			const firstUser = final.find((m) => m.role === "user");
			const title = firstUser
				? firstUser.content.trim().replace(/\s+/g, " ").slice(0, 80)
				: "untitled chat";
			titleRef.current = title;
			const record: ChatRecord = {
				id: activeChatId,
				title,
				machineId: activeMachineId,
				model,
				createdAt: createdAtRef.current,
				updatedAt: new Date().toISOString(),
				messageCount: final.length,
				messages: final,
			};
			try {
				const response = await fetch("/api/dashboard/chats", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(record),
				});
				if (response.ok) await refreshList();
			} catch {
				// Surfaced via the chat error UI on the next interaction.
			}
		},
		[activeChatId, activeMachineId, model, refreshList, storageReason],
	);

	return (
		<div className="grid gap-px bg-[var(--ret-border)] lg:grid-cols-[260px_1fr]">
			<aside className="bg-[var(--ret-bg)] p-3">
				<div className="flex items-center justify-between gap-2 pb-3">
					<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ret-text-muted)]">
						History
					</span>
					<ReticleButton variant="primary" size="sm" onClick={newChat}>
						New
					</ReticleButton>
				</div>
				{storageReason ? (
					<ReticleFrame className="mb-3 border-[var(--ret-amber)]/40 bg-[var(--ret-amber)]/5 p-3">
						<p className="font-mono text-[10px] text-[var(--ret-amber)]">
							{storageReason}
						</p>
						<p className="mt-1 font-mono text-[10px] text-[var(--ret-text-muted)]">
							In-memory chats still work; nothing is saved.
						</p>
					</ReticleFrame>
				) : null}
				{loadError ? (
					<ReticleFrame className="mb-3 border-[var(--ret-red)]/40 bg-[var(--ret-red)]/5 p-3">
						<p className="font-mono text-[10px] text-[var(--ret-red)]">
							{loadError}
						</p>
					</ReticleFrame>
				) : null}
				<ul className="flex flex-col gap-px bg-[var(--ret-border)]">
					{chats.length === 0 ? (
						<li className="bg-[var(--ret-bg)] p-3 font-mono text-[11px] text-[var(--ret-text-muted)]">
							no past chats
						</li>
					) : null}
					{chats.map((chat) => {
						const active = chat.id === activeChatId;
						return (
							<li
								key={chat.id}
								className={cn(
									"group flex flex-col gap-1 p-2",
									active
										? "bg-[var(--ret-purple-glow)]"
										: "bg-[var(--ret-bg)] hover:bg-[var(--ret-surface)]",
								)}
							>
								<button
									type="button"
									onClick={() => void loadChat(chat.id)}
									disabled={busy}
									className="text-left"
								>
									<p
										className={cn(
											"truncate font-mono text-[12px]",
											active
												? "text-[var(--ret-purple)]"
												: "text-[var(--ret-text)]",
										)}
									>
										{chat.title}
									</p>
									<p className="font-mono text-[10px] text-[var(--ret-text-muted)]">
										{chat.messageCount} msg . {timeAgo(chat.updatedAt)}
									</p>
								</button>
								<div className="flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100">
									<button
										type="button"
										onClick={() => void deleteChat(chat.id)}
										className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)] hover:text-[var(--ret-red)]"
									>
										delete
									</button>
								</div>
							</li>
						);
					})}
				</ul>
			</aside>

			<section className="bg-[var(--ret-bg)] p-5">
				<div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ret-text-muted)]">
					<span>chat</span>
					<span>.</span>
					<span className="text-[var(--ret-text-dim)]">
						{titleRef.current}
					</span>
					{activeMachineId ? (
						<ReticleBadge variant="default" className="text-[10px]">
							{activeMachineId.slice(0, 14)}
						</ReticleBadge>
					) : (
						<ReticleBadge variant="warning" className="text-[10px]">
							no active machine
						</ReticleBadge>
					)}
				</div>
				<ReticleHatch className="mb-4 h-1 border-b border-[var(--ret-border)]" pitch={6} />
				<Chat
					key={activeChatId ?? "blank"}
					messages={messages}
					onMessagesChange={setMessages}
					onTurnComplete={persistTurn}
					disabled={!activeMachineId}
					disabledReason={
						!activeMachineId
							? "No active machine. Pick or provision one in /dashboard/machines."
							: undefined
					}
				/>
			</section>
		</div>
	);
}

function timeAgo(iso: string): string {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return "--";
	const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}
