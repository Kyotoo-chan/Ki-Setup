import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Box, Key, Text } from "@mariozechner/pi-tui";

const PLAN_FILE = ".pi/plan.md";
const PLANNING_TOOLS = ["read", "bash", "write"];
const NORMAL_TOOLS = ["read", "bash", "edit", "write"];

const DESTRUCTIVE_PATTERNS = [
	/\brm\b/i,
	/\brmdir\b/i,
	/\bmv\b/i,
	/\bcp\b/i,
	/\bmkdir\b/i,
	/\btouch\b/i,
	/\bchmod\b/i,
	/\bchown\b/i,
	/\bln\b/i,
	/(^|[^<])>(?!>)/,
	/>>/,
	/\bnpm\s+(install|uninstall|update|ci|link|publish)/i,
	/\byarn\s+(add|remove|install|publish)/i,
	/\bpnpm\s+(add|remove|install|publish)/i,
	/\bpip\s+(install|uninstall)/i,
	/\bgit\s+(add|commit|push|pull|merge|rebase|reset|checkout|stash|clone)/i,
	/\bsudo\b/i,
	/\bkill\b/i,
	/\b(vim?|nano|emacs|code|subl)\b/i,
];

const SAFE_PATTERNS = [
	/^\s*cat\b/i,
	/^\s*head\b/i,
	/^\s*tail\b/i,
	/^\s*less\b/i,
	/^\s*more\b/i,
	/^\s*grep\b/i,
	/^\s*find\b/i,
	/^\s*ls\b/i,
	/^\s*pwd\b/i,
	/^\s*echo\b/i,
	/^\s*printf\b/i,
	/^\s*wc\b/i,
	/^\s*sort\b/i,
	/^\s*uniq\b/i,
	/^\s*diff\b/i,
	/^\s*file\b/i,
	/^\s*stat\b/i,
	/^\s*du\b/i,
	/^\s*df\b/i,
	/^\s*tree\b/i,
	/^\s*which\b/i,
	/^\s*whereis\b/i,
	/^\s*env\b/i,
	/^\s*printenv\b/i,
	/^\s*uname\b/i,
	/^\s*whoami\b/i,
	/^\s*id\b/i,
	/^\s*date\b/i,
	/^\s*uptime\b/i,
	/^\s*ps\b/i,
	/^\s*git\s+(status|log|diff|show|branch|remote|config\s+--get)/i,
	/^\s*git\s+ls-/i,
	/^\s*npm\s+(list|ls|view|info|search|outdated|audit)/i,
	/^\s*yarn\s+(list|info|why|audit)/i,
	/^\s*node\s+--version/i,
	/^\s*python\s+--version/i,
	/^\s*curl\s/i,
	/^\s*wget\s+-O\s*- /i,
	/^\s*jq\b/i,
	/^\s*sed\s+-n/i,
	/^\s*awk\b/i,
	/^\s*rg\b/i,
	/^\s*fd\b/i,
	/^\s*bat\b/i,
	/^\s*eza\b/i,
];

function isSafeCommand(command: string): boolean {
	return !DESTRUCTIVE_PATTERNS.some((p) => p.test(command)) && SAFE_PATTERNS.some((p) => p.test(command));
}

function planFileAbsolute(cwd: string): string {
	return path.resolve(cwd, PLAN_FILE);
}

function normalizeFilePath(cwd: string, filePath: string): string {
	return path.resolve(cwd, filePath).replace(/\\/g, "/").toLowerCase();
}

async function readPlan(cwd: string): Promise<string | undefined> {
	try {
		return await readFile(planFileAbsolute(cwd), "utf8");
	} catch {
		return undefined;
	}
}

const GLOBAL_KEYBINDINGS_PATH = path.join(os.homedir(), ".pi", "agent", "keybindings.json");

type KeybindingsConfig = Record<string, string | string[]>;

async function readKeybindingsConfig(): Promise<KeybindingsConfig> {
	try {
		return JSON.parse(await readFile(GLOBAL_KEYBINDINGS_PATH, "utf8")) as KeybindingsConfig;
	} catch {
		return {};
	}
}

function normalizeBinding(value: string | string[] | undefined): string[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

function hasExactBinding(value: string | string[] | undefined, key: string): boolean {
	return normalizeBinding(value).map((v) => v.toLowerCase()).includes(key.toLowerCase());
}

async function writeKeybindingsConfig(config: KeybindingsConfig): Promise<void> {
	await mkdir(path.dirname(GLOBAL_KEYBINDINGS_PATH), { recursive: true });
	await writeFile(GLOBAL_KEYBINDINGS_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

type PlanMessageDetails = {
	path?: string;
	hint?: string;
	task?: string;
};

function stripInlineMarkdown(text: string): string {
	return text
		.replace(/`([^`]+)`/g, "$1")
		.replace(/\*\*([^*]+)\*\*/g, "$1")
		.replace(/__([^_]+)__/g, "$1")
		.replace(/\*([^*]+)\*/g, "$1")
		.replace(/_([^_]+)_/g, "$1");
}

function renderPlanLine(line: string, inFence: boolean, theme: ExtensionContext["ui"]["theme"]): string {
	const trimmed = line.trim();
	if (!trimmed) return "";
	if (inFence) return theme.fg("mdCode", line);

	if (/^#{1,6}\s+/.test(trimmed)) {
		return theme.bold(theme.fg("borderAccent", stripInlineMarkdown(trimmed.replace(/^#{1,6}\s+/, ""))));
	}

	const checkbox = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
	if (checkbox) {
		const checked = checkbox[1].toLowerCase() === "x";
		const marker = checked ? theme.fg("success", "☑") : theme.fg("accent", "☐");
		return `${marker} ${stripInlineMarkdown(checkbox[2])}`;
	}

	const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/);
	if (numbered) {
		return `${theme.fg("accent", `${numbered[1]}.`)} ${stripInlineMarkdown(numbered[2])}`;
	}

	const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
	if (bullet) {
		return `${theme.fg("accent", "•")} ${stripInlineMarkdown(bullet[1])}`;
	}

	const quote = trimmed.match(/^>\s?(.*)$/);
	if (quote) {
		return `${theme.fg("muted", "│")} ${theme.fg("muted", stripInlineMarkdown(quote[1]))}`;
	}

	return stripInlineMarkdown(line);
}

function formatPlanForDisplay(plan: string, details: PlanMessageDetails | undefined, theme: ExtensionContext["ui"]["theme"]): string {
	const lines = [
		theme.bold(theme.fg("customMessageLabel", "plan")),
		theme.fg("muted", details?.path || PLAN_FILE),
	];

	if (details?.task?.trim()) {
		lines.push("", `${theme.fg("muted", "task:")} ${stripInlineMarkdown(details.task.trim())}`);
	}

	lines.push("");

	let inFence = false;
	for (const rawLine of plan.replace(/\r\n/g, "\n").trim().split("\n")) {
		if (/^\s*```/.test(rawLine)) {
			inFence = !inFence;
			continue;
		}
		lines.push(renderPlanLine(rawLine, inFence, theme));
	}

	if (details?.hint) {
		lines.push("", theme.fg("muted", details.hint));
	}

	return lines.join("\n");
}

export default function planModeExtension(pi: ExtensionAPI) {
	let active = false;
	let taskPrompt = "";
	let lastShownPlan = "";
	let keybindingsPromptHandled = false;

	pi.registerMessageRenderer<PlanMessageDetails>("planmode-plan", (message, _options, theme) => {
		if (typeof message.content !== "string") return undefined;
		const box = new Box(1, 1, (text) => theme.bg("selectedBg", text));
		box.addChild(new Text(formatPlanForDisplay(message.content, message.details, theme)));
		return box;
	});

	function persist() {
		pi.appendEntry("planmode-state", { active, taskPrompt, lastShownPlan });
	}

	function footerText(ctx: ExtensionContext): string | undefined {
		if (!active) return undefined;
		return `${ctx.ui.theme.fg("accent", "plan mode on")} ${ctx.ui.theme.fg("muted", "(shift+tab to cycle)")}`;
	}

	function updateUi(ctx: ExtensionContext) {
		if (active) {
			pi.setActiveTools(PLANNING_TOOLS);
			ctx.ui.setStatus("planmode", footerText(ctx));
		} else {
			pi.setActiveTools(NORMAL_TOOLS);
			ctx.ui.setStatus("planmode", undefined);
		}
	}

	function resetPlanning(ctx: ExtensionContext, notify?: string) {
		active = false;
		taskPrompt = "";
		lastShownPlan = "";
		updateUi(ctx);
		persist();
		if (notify) ctx.ui.notify(notify, "info");
	}

	async function enablePlanning(ctx: ExtensionContext, prompt = "", queuePrompt = false) {
		active = true;
		taskPrompt = prompt.trim();
		lastShownPlan = "";
		await mkdir(path.dirname(planFileAbsolute(ctx.cwd)), { recursive: true });
		updateUi(ctx);
		persist();

		if (!queuePrompt) {
			ctx.ui.notify("Plan mode enabled", "info");
			return;
		}

		const planRequest = [
			`Plan this task before implementation: ${taskPrompt}`,
			`Work in planning mode only. Inspect the codebase read-only, ask clarifying questions if needed, and write the plan to ${PLAN_FILE}.`,
			`The plan must include: goal, assumptions, open questions, affected files, step-by-step changes, validation steps, and risks.`,
			`Do not edit any file except ${PLAN_FILE}. After writing the plan, stop and wait for the user's next message.`,
		].join("\n\n");

		if (ctx.isIdle()) pi.sendUserMessage(planRequest);
		else pi.sendUserMessage(planRequest, { deliverAs: "steer" });
	}

	function isTextApproval(text: string): boolean {
		const normalized = text.trim().toLowerCase();
		if (!normalized) return false;

		const plainApprovals = new Set([
			"approve",
			"approved",
			"ok",
			"okay",
			"yes",
			"y",
			"jo",
			"jup",
			"yep",
			"sure",
			"go",
			"start",
			"mach",
			"passt",
			"genehmigt",
			"freigabe",
		]);
		if (plainApprovals.has(normalized)) return true;

		return (
			(/\bapprove\b/.test(normalized) && /\bplan\b/.test(normalized)) ||
			(/\bapproved\b/.test(normalized) && /\bplan\b/.test(normalized)) ||
			(/\b(plan|planung)\b/.test(normalized) && /\b(ok|okay|go|start|freigabe|freigeben|genehmigt|genehmige)\b/.test(normalized))
		);
	}

	async function showPlan(ctx: ExtensionContext) {
		const plan = await readPlan(ctx.cwd);
		if (!plan?.trim()) {
			ctx.ui.notify(`No ${PLAN_FILE} found yet`, "warning");
			return;
		}

		lastShownPlan = plan.trim();
		persist();
		pi.sendMessage(
			{
				customType: "planmode-plan",
				content: plan.trim(),
				details: {
					path: PLAN_FILE,
					hint: 'Reply with approval like "approve plan" or send a normal follow-up message to refine/change the plan.',
					task: taskPrompt || undefined,
				},
				display: true,
			},
			{ triggerTurn: false },
		);
	}

	async function maybeShowPlan(ctx: ExtensionContext) {
		if (!active) return;
		const plan = (await readPlan(ctx.cwd))?.trim();
		if (!plan || plan === lastShownPlan) return;
		await showPlan(ctx);
	}

	async function approvePlan(ctx: ExtensionContext, note?: string) {
		const plan = await readPlan(ctx.cwd);
		if (!plan?.trim()) {
			ctx.ui.notify(`No ${PLAN_FILE} found yet`, "warning");
			return false;
		}

		resetPlanning(ctx, "Plan approved. Starting implementation.");
		const extra = note?.trim() ? `\nAdditional note from user: ${note.trim()}` : "";
		const message = `The implementation plan in ${PLAN_FILE} is approved. Execute it now. Follow the plan, update the plan file if needed, and call out any deviations explicitly.${extra}`;
		if (ctx.isIdle()) pi.sendUserMessage(message);
		else pi.sendUserMessage(message, { deliverAs: "steer" });
		return true;
	}

	async function maybeOfferKeybindingSetup(ctx: ExtensionContext) {
		if (keybindingsPromptHandled || !ctx.hasUI) return;
		keybindingsPromptHandled = true;

		const config = await readKeybindingsConfig();
		const thinkingCycle = config["app.thinking.cycle"];
		const thinkingToggle = config["app.thinking.toggle"];
		const hasCycleOverride = Object.prototype.hasOwnProperty.call(config, "app.thinking.cycle");
		const shiftTabFreed = hasCycleOverride && !hasExactBinding(thinkingCycle, "shift+tab");
		const needsFreeShiftTab = !shiftTabFreed;
		const needsCtrlT = !hasExactBinding(thinkingCycle, "ctrl+t");
		const needsCtrlAltT = !hasExactBinding(thinkingToggle, "ctrl+alt+t");
		if (!needsFreeShiftTab && !needsCtrlT && !needsCtrlAltT) return;

		const changes = [
			`${needsFreeShiftTab ? "remove" : "keep removed"} shift+tab from app.thinking.cycle so the exported plan mode shortcut can use Shift+Tab`,
			`${needsCtrlT ? "add" : "keep"} ctrl+t -> app.thinking.cycle`,
			`${needsCtrlAltT ? "set" : "keep"} ctrl+alt+t -> app.thinking.toggle (moves the old ctrl+t toggle)`,
		];

		const choice = await ctx.ui.select(
			`Exported setup detected missing keybindings. Apply global keybinding changes in ${GLOBAL_KEYBINDINGS_PATH}?\n\n${changes.join("\n")}`,
			["Apply changes", "Not now"],
		);
		if (choice !== "Apply changes") return;

		const nextConfig: KeybindingsConfig = { ...config };
		const nextThinkingCycle = Array.from(
			new Set([
				...normalizeBinding(thinkingCycle).filter((v) => v.toLowerCase() !== "shift+tab"),
				"ctrl+shift+t",
				"ctrl+t",
			]),
		);
		const nextThinkingToggle = Array.from(new Set(["ctrl+alt+t", ...normalizeBinding(thinkingToggle).filter((v) => v.toLowerCase() !== "ctrl+t")]));
		nextConfig["app.thinking.cycle"] = nextThinkingCycle;
		nextConfig["app.thinking.toggle"] = nextThinkingToggle.length === 1 ? nextThinkingToggle[0] : nextThinkingToggle;
		await writeKeybindingsConfig(nextConfig);
		ctx.ui.notify("Global keybindings updated for exported setup. Run /reload if needed.", "success");
	}

	pi.registerCommand("plan", {
		description: "Enable plan mode or view the current session plan",
		handler: async (args, ctx) => {
			const input = args.trim();
			const lower = input.toLowerCase();

			if (lower === "off" || lower === "disable") {
				resetPlanning(ctx, "Plan mode disabled");
				return;
			}

			if (input) {
				await enablePlanning(ctx, input, true);
				return;
			}

			if (!active) {
				await enablePlanning(ctx, "", false);
				return;
			}

			await showPlan(ctx);
		},
	});

	pi.registerShortcut(Key.shift("tab"), {
		description: "Toggle plan mode",
		handler: async (ctx) => {
			if (active) {
				resetPlanning(ctx, "Plan mode disabled");
				return;
			}
			await enablePlanning(ctx, "", false);
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		const entries = ctx.sessionManager.getEntries();
		const state = entries
			.filter((e: { type: string; customType?: string }) => e.type === "custom" && e.customType === "planmode-state")
			.pop() as { data?: { active?: boolean; taskPrompt?: string; lastShownPlan?: string } } | undefined;
		if (state?.data) {
			active = state.data.active ?? active;
			taskPrompt = state.data.taskPrompt ?? taskPrompt;
			lastShownPlan = state.data.lastShownPlan ?? lastShownPlan;
		}
		updateUi(ctx);
		await maybeOfferKeybindingSetup(ctx);
	});

	pi.on("before_agent_start", async (_event, ctx) => {
		if (!active) return;
		const planAbs = planFileAbsolute(ctx.cwd);
		return {
			message: {
				customType: "planmode-context",
				content:
					`[PLAN MODE ACTIVE]\nCurrent task: ${taskPrompt || "(will be provided by the user's next message)"}\n\nBefore making any code or file changes, do the following in order:\n1. Analyze the task and inspect the codebase read-only.\n2. Ask clarifying questions for anything ambiguous or risky before implementation.\n3. Write a detailed implementation plan to ${PLAN_FILE} using the write tool. Overwrite that file completely when updating the plan.\n4. The plan must include: goal, assumptions, open questions, affected files, step-by-step changes, validation steps, and risks.\n5. Do not edit any file except ${PLAN_FILE}. Do not use write/edit/bash to modify anything else.\n6. After the plan is written, stop and wait for the user's next message.\n7. If the user refines the request, update the plan instead of implementing.\n8. Only start implementation after the user clearly approves the plan.\n\nCurrent working directory: ${ctx.cwd}\nPlan file absolute path: ${planAbs}`,
				display: false,
			},
		};
	});

	pi.on("tool_call", async (event, ctx) => {
		if (!active) return;

		if (event.toolName === "edit") {
			return { block: true, reason: "Plan mode: edits are blocked until the plan is approved." };
		}

		if (event.toolName === "write") {
			const target = String(event.input.path ?? "");
			const normalizedTarget = normalizeFilePath(ctx.cwd, target);
			const normalizedPlan = normalizeFilePath(ctx.cwd, PLAN_FILE);
			if (normalizedTarget !== normalizedPlan) {
				return { block: true, reason: `Plan mode: only ${PLAN_FILE} may be written before approval.` };
			}
		}

		if (event.toolName === "bash") {
			const command = String(event.input.command ?? "");
			if (!isSafeCommand(command)) {
				return {
					block: true,
					reason: `Plan mode: destructive or write-capable bash is blocked before approval. Command: ${command}`,
				};
			}
		}
	});

	pi.on("input", async (event, ctx) => {
		if (!active || event.source === "extension") return;

		if (isTextApproval(event.text)) {
			const normalized = event.text.trim();
			let note = "";
			const match = normalized.match(/^(?:approve(?:\s+plan)?|approved(?:\s+plan)?|plan\s+(?:ok|okay|go|start)|ich\s+genehmige\s+den\s+plan|plan\s+freigeben)[:\-\s]*(.*)$/i);
			if (match?.[1]?.trim()) note = match[1].trim();
			await approvePlan(ctx, note);
			return { action: "handled" };
		}

		if (!taskPrompt && event.text.trim()) {
			taskPrompt = event.text.trim();
			persist();
		}
	});

	pi.on("agent_end", async (_event, ctx) => {
		await maybeShowPlan(ctx);
	});
}
