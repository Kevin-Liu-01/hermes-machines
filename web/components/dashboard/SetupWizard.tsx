"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Logo } from "@/components/Logo";
import { ReticleBadge } from "@/components/reticle/ReticleBadge";
import { ReticleButton } from "@/components/reticle/ReticleButton";
import { ReticleFrame } from "@/components/reticle/ReticleFrame";
import { ReticleHatch } from "@/components/reticle/ReticleHatch";
import { ReticleLabel } from "@/components/reticle/ReticleLabel";
import { cn } from "@/lib/cn";
import {
	AGENT_KINDS,
	DEFAULT_MACHINE_SPEC,
	DEFAULT_MODEL,
	PROVIDER_KINDS,
	type AgentKind,
	type MachineSpec,
	type ProviderKind,
	type PublicUserConfig,
	type SetupStep,
} from "@/lib/user-config/schema";

type WizardDefaults = {
	machineSpec: MachineSpec;
	model: string;
	hasOwnerDedalusKey: boolean;
	hasOwnerCursorKey: boolean;
	hasOwnerMachine: boolean;
};

type Props = {
	initialConfig: PublicUserConfig;
	defaults: WizardDefaults;
};

type StepDef = {
	id: SetupStep;
	label: string;
	hint: string;
};

const STEPS: ReadonlyArray<StepDef> = [
	{ id: "api-key", label: "API key", hint: "dedalus" },
	{ id: "agent", label: "Agent", hint: "hermes / openclaw" },
	{ id: "provider", label: "Provider", hint: "where it runs" },
	{ id: "spec", label: "Spec", hint: "vcpu . mem . disk" },
	{ id: "review", label: "Review", hint: "confirm" },
	{ id: "provisioned", label: "Provisioned", hint: "machine live" },
];

const NEXT_OF: Record<SetupStep, SetupStep | null> = {
	"api-key": "agent",
	agent: "provider",
	provider: "spec",
	spec: "review",
	review: "provisioned",
	provisioned: null,
};

const AGENTS_DESC: Record<AgentKind, { name: string; tagline: string; logo: "nous" | "dedalus" }> = {
	hermes: {
		name: "Hermes",
		tagline:
			"Nous Research's self-improving agent. Persistent memory, automation scheduling, MCP-native, OpenAI-compatible API.",
		logo: "nous",
	},
	openclaw: {
		name: "OpenClaw",
		tagline:
			"Dedalus's open computer-use baseline. Browser, shell, file system, vision. Pinned to anthropic/claude on the gateway.",
		logo: "dedalus",
	},
};

const PROVIDERS_DESC: Record<
	ProviderKind,
	{ name: string; tagline: string; ready: boolean }
> = {
	dedalus: {
		name: "Dedalus Machines",
		tagline:
			"Firecracker microVMs with sleep/wake, persistent /home/machine volume, cloudflared previews. The original.",
		ready: true,
	},
	"vercel-sandbox": {
		name: "Vercel Sandbox",
		tagline:
			"Ephemeral Firecracker microVMs from Vercel. No sleep/wake; each run is a fresh box. Lands in PR4.",
		ready: false,
	},
	fly: {
		name: "Fly Machines",
		tagline:
			"Fly.io's Firecracker microVMs. Global placement, autostart on connect. Lands in PR4.",
		ready: false,
	},
};

/**
 * Multi-step wizard for provisioning a per-user agent. Each step is a
 * standalone POST to `/api/dashboard/admin/setup`, so a refresh resumes
 * at the same step instead of starting over. The "review" step's
 * "Provision" button hits the dedicated provision endpoint and saves
 * the resulting machine ID into the user's config.
 */
export function SetupWizard({ initialConfig, defaults }: Props) {
	const router = useRouter();
	const [config, setConfig] = useState<PublicUserConfig>(initialConfig);
	const [activeStep, setActiveStep] = useState<SetupStep>(initialConfig.setupStep);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const completedSteps = useMemo(() => {
		const done = new Set<SetupStep>();
		const order = STEPS.map((s) => s.id);
		const idx = order.indexOf(config.setupStep);
		for (let i = 0; i < idx; i++) done.add(order[i]);
		if (config.setupStep === "provisioned") done.add("review");
		return done;
	}, [config.setupStep]);

	const submitPatch = useCallback(
		async (patch: Record<string, unknown>): Promise<boolean> => {
			setBusy(true);
			setError(null);
			try {
				const response = await fetch("/api/dashboard/admin/setup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(patch),
				});
				const body = (await response.json()) as {
					config?: PublicUserConfig;
					message?: string;
				};
				if (!response.ok) {
					setError(body.message ?? `setup failed (HTTP ${response.status})`);
					return false;
				}
				if (body.config) setConfig(body.config);
				return true;
			} catch (err) {
				setError(err instanceof Error ? err.message : "network error");
				return false;
			} finally {
				setBusy(false);
			}
		},
		[],
	);

	const advanceTo = useCallback(
		async (next: SetupStep, extra: Record<string, unknown> = {}) => {
			const ok = await submitPatch({ ...extra, setupStep: next });
			if (ok) setActiveStep(next);
		},
		[submitPatch],
	);

	const provision = useCallback(async () => {
		setBusy(true);
		setError(null);
		try {
			const response = await fetch(
				"/api/dashboard/admin/provision-machine",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				},
			);
			const body = (await response.json()) as {
				ok?: boolean;
				machineId?: string;
				phase?: string;
				message?: string;
				error?: string;
			};
			if (!response.ok) {
				setError(body.message ?? `provision failed (HTTP ${response.status})`);
				return;
			}
			setActiveStep("provisioned");
			setConfig((prev) => ({
				...prev,
				machineId: body.machineId ?? prev.machineId,
				setupStep: "provisioned",
			}));
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "network error");
		} finally {
			setBusy(false);
		}
	}, [router]);

	return (
		<div className="space-y-6 px-5 py-5">
			<StepRail
				active={activeStep}
				completed={completedSteps}
				onJump={(step) => setActiveStep(step)}
			/>

			{error ? (
				<ReticleFrame className="border-[var(--ret-red)]/50 bg-[var(--ret-red)]/5 p-4">
					<p className="font-mono text-[11px] text-[var(--ret-red)]">
						error: {error}
					</p>
				</ReticleFrame>
			) : null}

			{activeStep === "api-key" ? (
				<ApiKeyStep
					hasKey={config.hasDedalusKey}
					hasOwnerKey={defaults.hasOwnerDedalusKey}
					hasCursorKey={config.hasCursorKey}
					hasOwnerCursorKey={defaults.hasOwnerCursorKey}
					busy={busy}
					onSave={async (dedalusApiKey, cursorApiKey) => {
						const patch: Record<string, unknown> = {
							setupStep: "agent",
						};
						if (dedalusApiKey) patch.dedalusApiKey = dedalusApiKey;
						if (cursorApiKey !== undefined)
							patch.cursorApiKey = cursorApiKey;
						const ok = await submitPatch(patch);
						if (ok) setActiveStep("agent");
					}}
					onSkip={() => advanceTo("agent")}
				/>
			) : null}

			{activeStep === "agent" ? (
				<AgentStep
					value={config.agentKind}
					busy={busy}
					onSelect={async (agentKind) => advanceTo("provider", { agentKind })}
				/>
			) : null}

			{activeStep === "provider" ? (
				<ProviderStep
					value={config.providerKind}
					busy={busy}
					onSelect={async (providerKind) =>
						advanceTo("spec", { providerKind })
					}
				/>
			) : null}

			{activeStep === "spec" ? (
				<SpecStep
					value={config.machineSpec}
					defaults={defaults.machineSpec}
					model={config.model}
					defaultModel={defaults.model}
					busy={busy}
					onSave={async (machineSpec, model) =>
						advanceTo("review", { machineSpec, model })
					}
				/>
			) : null}

			{activeStep === "review" ? (
				<ReviewStep
					config={config}
					busy={busy}
					onProvision={provision}
					onBack={() => setActiveStep("spec")}
				/>
			) : null}

			{activeStep === "provisioned" ? (
				<ProvisionedStep
					config={config}
					onChat={() => router.push("/dashboard/chat")}
					onOverview={() => router.push("/dashboard")}
				/>
			) : null}
		</div>
	);
}

function StepRail({
	active,
	completed,
	onJump,
}: {
	active: SetupStep;
	completed: ReadonlySet<SetupStep>;
	onJump: (step: SetupStep) => void;
}) {
	return (
		<ol className="grid gap-px overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-border)] sm:grid-cols-3 lg:grid-cols-6">
			{STEPS.map((step, idx) => {
				const isActive = step.id === active;
				const isDone = completed.has(step.id);
				const reachable = isActive || isDone;
				return (
					<li
						key={step.id}
						className={cn(
							"flex items-center gap-3 bg-[var(--ret-bg)] px-3 py-3",
							reachable
								? "cursor-pointer hover:bg-[var(--ret-surface)]"
								: "cursor-not-allowed opacity-60",
						)}
						onClick={() => {
							if (reachable) onJump(step.id);
						}}
					>
						<span
							className={cn(
								"flex h-5 w-5 items-center justify-center border font-mono text-[10px]",
								isDone
									? "border-[var(--ret-green)]/40 bg-[var(--ret-green)]/10 text-[var(--ret-green)]"
									: isActive
										? "border-[var(--ret-purple)]/40 bg-[var(--ret-purple-glow)] text-[var(--ret-purple)]"
										: "border-[var(--ret-border)] text-[var(--ret-text-muted)]",
							)}
						>
							{isDone ? "ok" : idx + 1}
						</span>
						<div className="min-w-0">
							<p className="font-mono text-[11px] text-[var(--ret-text)]">
								{step.label}
							</p>
							<p className="font-mono text-[10px] text-[var(--ret-text-muted)]">
								{step.hint}
							</p>
						</div>
					</li>
				);
			})}
		</ol>
	);
}

function StepShell({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<ReticleFrame>
			<ReticleHatch
				className="h-1.5 border-b border-[var(--ret-border)]"
				pitch={6}
			/>
			<div className="space-y-4 p-5">
				<header>
					<ReticleLabel>step</ReticleLabel>
					<h2 className="ret-display mt-1 text-base">{title}</h2>
					<p className="mt-1 max-w-[68ch] text-[12px] text-[var(--ret-text-dim)]">
						{description}
					</p>
				</header>
				{children}
			</div>
		</ReticleFrame>
	);
}

function ApiKeyStep({
	hasKey,
	hasOwnerKey,
	hasCursorKey,
	hasOwnerCursorKey,
	busy,
	onSave,
	onSkip,
}: {
	hasKey: boolean;
	hasOwnerKey: boolean;
	hasCursorKey: boolean;
	hasOwnerCursorKey: boolean;
	busy: boolean;
	onSave: (dedalus: string, cursor: string | undefined) => Promise<void>;
	onSkip: () => void;
}) {
	const [dedalus, setDedalus] = useState("");
	const [cursor, setCursor] = useState("");

	return (
		<StepShell
			title="Bring your Dedalus API key"
			description="Get one at dcs.dedaluslabs.ai. Stored in your Clerk private metadata, never sent to the browser. Cursor key is optional -- only needed if you plan to use the cursor-bridge MCP for code generation."
		>
			<div className="grid gap-4 md:grid-cols-2">
				<KeyField
					label="Dedalus API key"
					placeholder="dsk-live-..."
					value={dedalus}
					onChange={setDedalus}
					hint={
						hasKey
							? "On file. Leave blank to keep the existing key."
							: hasOwnerKey
								? "Owner default exists. Leave blank to inherit."
								: "Required to provision a machine."
					}
					required={!hasKey && !hasOwnerKey}
				/>
				<KeyField
					label="Cursor API key (optional)"
					placeholder="cursor-..."
					value={cursor}
					onChange={setCursor}
					hint={
						hasCursorKey
							? "On file. Leave blank to keep."
							: hasOwnerCursorKey
								? "Owner default exists. Leave blank to inherit."
								: "Optional. Skip for now if you don't have one."
					}
				/>
			</div>
			<div className="flex flex-wrap items-center justify-end gap-2">
				<ReticleButton
					variant="ghost"
					size="sm"
					onClick={onSkip}
					disabled={busy || (!hasKey && !hasOwnerKey)}
				>
					Skip
				</ReticleButton>
				<ReticleButton
					variant="primary"
					size="sm"
					disabled={busy || (!dedalus && !hasKey && !hasOwnerKey)}
					onClick={() =>
						onSave(
							dedalus.trim(),
							cursor.trim() === "" ? undefined : cursor.trim(),
						)
					}
				>
					{busy ? "Saving..." : "Save and continue"}
				</ReticleButton>
			</div>
		</StepShell>
	);
}

function KeyField({
	label,
	placeholder,
	value,
	onChange,
	hint,
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	hint: string;
	required?: boolean;
}) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
				{label}
				{required ? <span className="ml-1 text-[var(--ret-red)]">*</span> : null}
			</span>
			<input
				type="password"
				autoComplete="off"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="border border-[var(--ret-border)] bg-[var(--ret-bg)] px-3 py-2 font-mono text-[12px] text-[var(--ret-text)] placeholder:text-[var(--ret-text-muted)] focus:border-[var(--ret-purple)] focus:outline-none"
			/>
			<span className="font-mono text-[10px] text-[var(--ret-text-muted)]">
				{hint}
			</span>
		</label>
	);
}

function AgentStep({
	value,
	busy,
	onSelect,
}: {
	value: AgentKind;
	busy: boolean;
	onSelect: (kind: AgentKind) => Promise<void>;
}) {
	return (
		<StepShell
			title="Pick your agent"
			description="The personality and toolset baked into the gateway. You can switch later from the navbar; switching after provisioning rewrites ~/.hermes/SOUL.md and restarts the gateway."
		>
			<div className="grid gap-4 md:grid-cols-2">
				{AGENT_KINDS.map((kind) => {
					const meta = AGENTS_DESC[kind];
					const selected = value === kind;
					return (
						<button
							key={kind}
							type="button"
							disabled={busy}
							onClick={() => void onSelect(kind)}
							className={cn(
								"group relative flex flex-col gap-3 border bg-[var(--ret-bg)] p-4 text-left transition-colors",
								selected
									? "border-[var(--ret-purple)] bg-[var(--ret-purple-glow)]"
									: "border-[var(--ret-border)] hover:border-[var(--ret-border-hover)] hover:bg-[var(--ret-surface)]",
							)}
						>
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-2">
									<Logo mark={meta.logo} size={18} />
									<h3 className="font-mono text-[13px] text-[var(--ret-text)]">
										{meta.name}
									</h3>
								</div>
								{selected ? (
									<ReticleBadge variant="accent">selected</ReticleBadge>
								) : null}
							</div>
							<p className="text-[12px] leading-relaxed text-[var(--ret-text-dim)]">
								{meta.tagline}
							</p>
							<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
								agent: {kind}
							</span>
						</button>
					);
				})}
			</div>
		</StepShell>
	);
}

function ProviderStep({
	value,
	busy,
	onSelect,
}: {
	value: ProviderKind;
	busy: boolean;
	onSelect: (kind: ProviderKind) => Promise<void>;
}) {
	return (
		<StepShell
			title="Pick the provider"
			description="Where the agent's microVM lives. Dedalus is the only provider wired end-to-end today. Vercel Sandbox and Fly land in PR4 once we have a clean machine-provider abstraction."
		>
			<div className="grid gap-4 md:grid-cols-3">
				{PROVIDER_KINDS.map((kind) => {
					const meta = PROVIDERS_DESC[kind];
					const selected = value === kind;
					return (
						<button
							key={kind}
							type="button"
							disabled={busy || !meta.ready}
							onClick={() => void onSelect(kind)}
							className={cn(
								"flex flex-col gap-3 border bg-[var(--ret-bg)] p-4 text-left transition-colors",
								selected
									? "border-[var(--ret-purple)] bg-[var(--ret-purple-glow)]"
									: "border-[var(--ret-border)] hover:border-[var(--ret-border-hover)]",
								!meta.ready ? "cursor-not-allowed opacity-50" : "",
							)}
						>
							<div className="flex items-center justify-between gap-3">
								<h3 className="font-mono text-[13px] text-[var(--ret-text)]">
									{meta.name}
								</h3>
								{!meta.ready ? (
									<ReticleBadge variant="warning">pr4</ReticleBadge>
								) : selected ? (
									<ReticleBadge variant="accent">selected</ReticleBadge>
								) : (
									<ReticleBadge variant="success">ready</ReticleBadge>
								)}
							</div>
							<p className="text-[12px] leading-relaxed text-[var(--ret-text-dim)]">
								{meta.tagline}
							</p>
							<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
								provider: {kind}
							</span>
						</button>
					);
				})}
			</div>
		</StepShell>
	);
}

function SpecStep({
	value,
	defaults,
	model,
	defaultModel,
	busy,
	onSave,
}: {
	value: MachineSpec;
	defaults: MachineSpec;
	model: string;
	defaultModel: string;
	busy: boolean;
	onSave: (spec: MachineSpec, model: string) => Promise<void>;
}) {
	const [vcpu, setVcpu] = useState(value.vcpu);
	const [memory, setMemory] = useState(value.memoryMib);
	const [storage, setStorage] = useState(value.storageGib);
	const [chosenModel, setChosenModel] = useState(model || defaultModel || DEFAULT_MODEL);

	return (
		<StepShell
			title="Size the box"
			description="Defaults are tuned for Hermes + cursor-bridge: 1 vCPU, 2 GiB RAM, 10 GiB disk. Most plans cap at 4 vCPU / 8 GiB. Hermes uses ~600 MiB at idle; double the RAM if you plan to schedule heavy crons."
		>
			<div className="grid gap-4 md:grid-cols-4">
				<NumField
					label="vCPU"
					value={vcpu}
					onChange={setVcpu}
					min={1}
					max={16}
					hint={`default ${defaults.vcpu ?? DEFAULT_MACHINE_SPEC.vcpu}`}
				/>
				<NumField
					label="memory (MiB)"
					value={memory}
					onChange={setMemory}
					min={512}
					max={65_536}
					step={512}
					hint={`default ${defaults.memoryMib ?? DEFAULT_MACHINE_SPEC.memoryMib}`}
				/>
				<NumField
					label="storage (GiB)"
					value={storage}
					onChange={setStorage}
					min={5}
					max={200}
					hint={`default ${defaults.storageGib ?? DEFAULT_MACHINE_SPEC.storageGib}`}
				/>
				<TextField
					label="model id"
					value={chosenModel}
					onChange={setChosenModel}
					hint={`default ${defaultModel}`}
				/>
			</div>
			<div className="flex justify-end">
				<ReticleButton
					variant="primary"
					size="sm"
					disabled={busy}
					onClick={() =>
						void onSave(
							{ vcpu, memoryMib: memory, storageGib: storage },
							chosenModel,
						)
					}
				>
					{busy ? "Saving..." : "Save and review"}
				</ReticleButton>
			</div>
		</StepShell>
	);
}

function NumField({
	label,
	value,
	onChange,
	min,
	max,
	step,
	hint,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	min: number;
	max: number;
	step?: number;
	hint: string;
}) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
				{label}
			</span>
			<input
				type="number"
				min={min}
				max={max}
				step={step ?? 1}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="border border-[var(--ret-border)] bg-[var(--ret-bg)] px-3 py-2 font-mono text-[12px] text-[var(--ret-text)] focus:border-[var(--ret-purple)] focus:outline-none"
			/>
			<span className="font-mono text-[10px] text-[var(--ret-text-muted)]">
				{hint}
			</span>
		</label>
	);
}

function TextField({
	label,
	value,
	onChange,
	hint,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	hint: string;
}) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ret-text-muted)]">
				{label}
			</span>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="border border-[var(--ret-border)] bg-[var(--ret-bg)] px-3 py-2 font-mono text-[12px] text-[var(--ret-text)] focus:border-[var(--ret-purple)] focus:outline-none"
			/>
			<span className="font-mono text-[10px] text-[var(--ret-text-muted)]">
				{hint}
			</span>
		</label>
	);
}

function ReviewStep({
	config,
	busy,
	onProvision,
	onBack,
}: {
	config: PublicUserConfig;
	busy: boolean;
	onProvision: () => Promise<void>;
	onBack: () => void;
}) {
	const memGib = (config.machineSpec.memoryMib / 1024).toFixed(1);
	return (
		<StepShell
			title="Confirm and provision"
			description="Provisioning hits Dedalus and creates a fresh machine. The machine ID is saved into your Clerk metadata. Bootstrap (Hermes install + cloudflared tunnel) lands in PR2; for PR1 you finish the install with `npm run deploy` locally against your new machine."
		>
			<dl className="grid gap-px overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-border)] sm:grid-cols-2">
				<Row label="agent" value={config.agentKind} />
				<Row label="provider" value={config.providerKind} />
				<Row
					label="spec"
					value={`${config.machineSpec.vcpu} vCPU . ${memGib} GiB RAM . ${config.machineSpec.storageGib} GiB disk`}
				/>
				<Row label="model" value={config.model} />
				<Row
					label="dedalus key"
					value={config.hasDedalusKey ? "on file" : "missing"}
					tone={config.hasDedalusKey ? "ok" : "warn"}
				/>
				<Row
					label="cursor key"
					value={config.hasCursorKey ? "on file" : "not provided"}
					tone="muted"
				/>
				{config.machineId ? (
					<Row label="existing machine" value={config.machineId} tone="muted" />
				) : null}
			</dl>
			<div className="flex flex-wrap items-center justify-end gap-2">
				<ReticleButton variant="ghost" size="sm" onClick={onBack} disabled={busy}>
					Back
				</ReticleButton>
				<ReticleButton
					variant="primary"
					size="sm"
					onClick={() => void onProvision()}
					disabled={busy || !config.hasDedalusKey}
				>
					{busy ? "Provisioning..." : config.machineId ? "Re-provision" : "Provision machine"}
				</ReticleButton>
			</div>
		</StepShell>
	);
}

function Row({
	label,
	value,
	tone,
}: {
	label: string;
	value: string;
	tone?: "ok" | "warn" | "muted";
}) {
	const valueClass =
		tone === "ok"
			? "text-[var(--ret-green)]"
			: tone === "warn"
				? "text-[var(--ret-amber)]"
				: tone === "muted"
					? "text-[var(--ret-text-muted)]"
					: "text-[var(--ret-text)]";
	return (
		<div className="flex items-center justify-between gap-3 bg-[var(--ret-bg)] px-3 py-2 font-mono text-[12px]">
			<dt className="text-[var(--ret-text-muted)]">{label}</dt>
			<dd className={cn("truncate text-right", valueClass)}>{value}</dd>
		</div>
	);
}

function ProvisionedStep({
	config,
	onChat,
	onOverview,
}: {
	config: PublicUserConfig;
	onChat: () => void;
	onOverview: () => void;
}) {
	return (
		<StepShell
			title="Machine provisioned"
			description="Your Dedalus machine is up. Bootstrap (Hermes install) ships in PR2; for now run `npm run deploy` locally against this machine ID to finish the install."
		>
			<div className="space-y-3">
				<dl className="grid gap-px overflow-hidden border border-[var(--ret-border)] bg-[var(--ret-border)] sm:grid-cols-2">
					<Row label="machine id" value={config.machineId ?? "--"} tone="ok" />
					<Row label="agent" value={config.agentKind} />
					<Row label="provider" value={config.providerKind} />
				</dl>
				<div className="space-y-1.5 border border-dashed border-[var(--ret-border)] bg-[var(--ret-surface)] p-3 font-mono text-[11px] text-[var(--ret-text-dim)]">
					<p className="text-[var(--ret-text-muted)]">next steps:</p>
					<p>
						{`$ HERMES_MACHINE_ID=${config.machineId ?? "<id>"} DEDALUS_API_KEY=... npm run deploy`}
					</p>
					<p className="text-[var(--ret-text-muted)]">
						after deploy:
						<span className="ml-2 text-[var(--ret-text)]">
							open /dashboard/chat to talk to it
						</span>
					</p>
				</div>
				<div className="flex flex-wrap justify-end gap-2">
					<ReticleButton variant="secondary" size="sm" onClick={onOverview}>
						Open overview
					</ReticleButton>
					<ReticleButton variant="primary" size="sm" onClick={onChat}>
						Open chat
					</ReticleButton>
				</div>
			</div>
		</StepShell>
	);
}
