import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { CustomEditor, type ExtensionAPI, type ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Box, Key, Text, matchesKey } from "@mariozechner/pi-tui";
import { Type } from "typebox";

const PLAN_FILE = ".pi/plan.md";
const PLAN_QUESTIONS_TOOL = "plan_questions";
const PLANNING_TOOLS = ["read", "bash", "write", PLAN_QUESTIONS_TOOL];
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

type PlanMessageDetails = {
	path?: string;
	hint?: string;
	task?: string;
	title?: string;
};

type PlanQuestion = {
	label: string;
	question: string;
	suggestions: string[];
};

type PlanAnswer = {
	label: string;
	answer: string;
	choiceIndex?: number;
	wasCustom: boolean;
};

type PlanQuestionsResult = {
	title?: string;
	questions: PlanQuestion[];
	answers: PlanAnswer[];
	cancelled: boolean;
};

const PlanQuestionSchema = Type.Object({
	label: Type.Optional(Type.String({ description: "Short tab label, e.g. Scope, Provider, Output" })),
	question: Type.String({ description: "The full question shown to the user" }),
	suggestions: Type.Array(Type.String({ description: "Suggested answers. Do not include an 'other' option." }), {
		description: "Suggested answers for the user. The UI automatically appends a final free-text option.",
	}),
});

const PlanQuestionsSchema = Type.Object({
	title: Type.Optional(Type.String({ description: "Optional short title for the question set" })),
	questions: Type.Array(PlanQuestionSchema, {
		description: "Structured clarifying questions to ask before writing the plan",
	}),
});

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
		theme.bold(theme.fg("customMessageLabel", details?.title || "plan")),
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

class PlanModeEditor extends CustomEditor {
	constructor(
		tui: ConstructorParameters<typeof CustomEditor>[0],
		theme: ConstructorParameters<typeof CustomEditor>[1],
		keybindings: ConstructorParameters<typeof CustomEditor>[2],
		private onTogglePlanMode: () => void | Promise<void>,
	) {
		super(tui, theme, keybindings);
	}

	handleInput(data: string): void {
		if (matchesKey(data, Key.ctrl("p"))) {
			void this.onTogglePlanMode();
			return;
		}
		super.handleInput(data);
	}
}

export default function planModeExtension(pi: ExtensionAPI) {
	let active = false;
	let taskPrompt = "";
	let lastShownPlan = "";

	pi.registerMessageRenderer<PlanMessageDetails>("planmode-plan", (message, options, theme) => {
		if (typeof message.content !== "string") return undefined;
		const box = new Box(1, 1, (text) => theme.bg("selectedBg", text));
		const details = options.expanded ? message.details : { ...message.details, hint: undefined };
		const text = formatPlanForDisplay(message.content, details, theme);
		const preview = [...text.split("\n").slice(0, 10), "", theme.fg("dim", "Ctrl+O to expand")].join("\n");
		box.addChild(new Text(options.expanded ? text : preview));
		return box;
	});

	pi.registerTool({
		name: PLAN_QUESTIONS_TOOL,
		label: "Plan Questions",
		description: `Ask the user structured clarifying questions before writing ${PLAN_FILE}. Use this in plan mode when required information is missing.`,
		promptSnippet: `Collect structured clarifying answers from the user before writing ${PLAN_FILE}`,
		promptGuidelines: [
			`Use ${PLAN_QUESTIONS_TOOL} in plan mode when required information is missing before writing ${PLAN_FILE}.`,
			`When calling ${PLAN_QUESTIONS_TOOL}, provide short labels and concrete suggestions. Do not add your own "other" option because the tool already appends a final free-text choice.`,
		],
		parameters: PlanQuestionsSchema,
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			if (!ctx.hasUI) {
				return {
					content: [{ type: "text", text: "Structured clarifying questions require interactive mode." }],
					details: { title: params.title, questions: [], answers: [], cancelled: true } satisfies PlanQuestionsResult,
				};
			}

			const questions: PlanQuestion[] = params.questions
				.map((question, index) => ({
					label: question.label?.trim() || `Q${index + 1}`,
					question: question.question.trim(),
					suggestions: question.suggestions.map((suggestion) => suggestion.trim()).filter(Boolean),
				}))
				.filter((question) => question.question);

			if (questions.length === 0) {
				return {
					content: [{ type: "text", text: "No valid clarifying questions were provided." }],
					details: { title: params.title, questions: [], answers: [], cancelled: true } satisfies PlanQuestionsResult,
				};
			}

			const title = params.title?.trim() || "Plan mode questions";
			const answers: PlanAnswer[] = [];

			for (let index = 0; index < questions.length; index++) {
				const question = questions[index]!;
				const options = [...question.suggestions, "Eigene Eingabe"];
				const prompt = [`${title} (${index + 1}/${questions.length})`, question.label, "", question.question].join("\n");
				const selection = await ctx.ui.select(prompt, options);

				if (selection === undefined) {
					return {
						content: [{ type: "text", text: "The user cancelled the structured clarifying questions." }],
						details: {
							title: params.title?.trim() || undefined,
							questions,
							answers,
							cancelled: true,
						} satisfies PlanQuestionsResult,
					};
				}

				if (selection === "Eigene Eingabe") {
					let draft = "";
					for (;;) {
						const customAnswer = await ctx.ui.editor(prompt, draft);
						if (customAnswer === undefined) {
							return {
								content: [{ type: "text", text: "The user cancelled the structured clarifying questions." }],
								details: {
									title: params.title?.trim() || undefined,
									questions,
									answers,
									cancelled: true,
								} satisfies PlanQuestionsResult,
							};
						}

						draft = customAnswer;
						const trimmed = customAnswer.trim();
						if (!trimmed) {
							ctx.ui.notify("Please enter a value before confirming.", "warning");
							continue;
						}

						answers.push({
							label: question.label,
							answer: trimmed,
							wasCustom: true,
						});
						break;
					}
					continue;
				}

				const choiceIndex = question.suggestions.findIndex((suggestion) => suggestion === selection);
				answers.push({
					label: question.label,
					answer: selection,
					choiceIndex: choiceIndex >= 0 ? choiceIndex + 1 : undefined,
					wasCustom: false,
				});
			}

			const result: PlanQuestionsResult = {
				title: params.title?.trim() || undefined,
				questions,
				answers,
				cancelled: false,
			};
			const summary = result.answers.map((answer) => `- ${answer.label}: ${answer.answer}`).join("\n");
			return {
				content: [{ type: "text", text: `Structured user answers:\n${summary}` }],
				details: result,
			};
		},
		renderCall(args, theme) {
			const count = Array.isArray(args.questions) ? args.questions.length : 0;
			const title = typeof args.title === "string" && args.title.trim() ? `${args.title.trim()} · ` : "";
			return new Text(
				`${theme.fg("toolTitle", theme.bold(`${PLAN_QUESTIONS_TOOL} `))}${theme.fg("muted", `${title}${count} question${count === 1 ? "" : "s"}`)}`,
				0,
				0,
			);
		},
		renderResult(result, _options, theme) {
			const details = result.details as PlanQuestionsResult | undefined;
			if (!details) {
				const text = result.content[0];
				return new Text(text?.type === "text" ? text.text : "", 0, 0);
			}
			if (details.cancelled) {
				return new Text(theme.fg("warning", "Clarifying questions cancelled"), 0, 0);
			}
			const lines = details.answers.map((answer) => `${theme.fg("success", "✓ ")}${theme.fg("accent", answer.label)}: ${answer.answer}`);
			return new Text(lines.join("\n"), 0, 0);
		},
	});

	function persist() {
		pi.appendEntry("planmode-state", { active, taskPrompt, lastShownPlan });
	}

	function footerText(ctx: ExtensionContext): string | undefined {
		if (!active) return undefined;
		return `${ctx.ui.theme.fg("accent", "plan mode on")} ${ctx.ui.theme.fg("muted", "(ctrl+p or /plan toggle)")}`;
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

	async function togglePlanning(ctx: ExtensionContext) {
		if (active) {
			resetPlanning(ctx, "Plan mode disabled");
			return;
		}
		await enablePlanning(ctx, "", false);
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
			`Work in planning mode only. Inspect the codebase read-only and identify missing information first.`,
			`If anything is ambiguous, risky, or underspecified, ask clarifying questions with ${PLAN_QUESTIONS_TOOL} first. Provide short labels and concrete suggestions. Do not add your own "other" option because the tool already appends a free-text choice.`,
			`Do not write ${PLAN_FILE} before those questions are answered or there are genuinely no open questions. Do not put unanswered open questions into the written plan.`,
			`Only when there are no open questions, write the plan to ${PLAN_FILE}. The plan must include: goal, assumptions, open questions, affected files, step-by-step changes, validation steps, and risks.`,
			`Do not edit any file except ${PLAN_FILE}. After asking questions or after writing the plan, stop and wait for the user's next message.`,
		].join("\n\n");

		if (ctx.isIdle()) pi.sendUserMessage(planRequest);
		else pi.sendUserMessage(planRequest, { deliverAs: "steer" });
	}

	function sendPlanRefinementContext(ctx: ExtensionContext) {
		const content = [
			"[PLAN MODE FOLLOW-UP]",
			"The user's next message is a refinement to the active plan, not plan approval and not an implementation request.",
			`Treat it as a request to update ${PLAN_FILE}. If the refinement is specific enough, overwrite ${PLAN_FILE} completely in this turn and then stop.`,
			`Only if genuinely required information is still missing, ask clarifying questions with ${PLAN_QUESTIONS_TOOL} first and stop without implementing anything.`,
			`Do not edit any file except ${PLAN_FILE}.`,
		].join("\n\n");

		if (ctx.isIdle()) {
			pi.sendMessage({ customType: "planmode-refinement-context", content, display: false }, { triggerTurn: false });
			return;
		}

		pi.sendMessage({ customType: "planmode-refinement-context", content, display: false }, { triggerTurn: false, deliverAs: "steer" });
	}

	function extractOpenQuestions(plan: string): string[] {
		const lines = plan.replace(/\r\n/g, "\n").split("\n");
		const questions: string[] = [];
		let inOpenQuestions = false;
		let inFence = false;

		for (const line of lines) {
			if (/^\s*```/.test(line)) {
				inFence = !inFence;
				continue;
			}
			if (inFence) continue;

			const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
			if (heading) {
				const title = stripInlineMarkdown(heading[2]).trim().toLowerCase();
				inOpenQuestions = title === "open questions" || title === "questions";
				continue;
			}

			if (!inOpenQuestions) continue;
			const trimmed = line.trim();
			if (!trimmed) continue;

			const checkbox = trimmed.match(/^[-*]\s+\[ \]\s+(.*)$/i);
			if (checkbox) {
				questions.push(stripInlineMarkdown(checkbox[1]).trim());
				continue;
			}

			const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
			if (bullet) {
				questions.push(stripInlineMarkdown(bullet[1]).trim());
				continue;
			}

			const numbered = trimmed.match(/^\d+\.\s+(.*)$/);
			if (numbered) {
				questions.push(stripInlineMarkdown(numbered[1]).trim());
			}
		}

		return questions.filter(Boolean);
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

	function showPlan(plan: string, hint: string) {
		const trimmedPlan = plan.trim();
		lastShownPlan = trimmedPlan;
		persist();
		pi.sendMessage(
			{
				customType: "planmode-plan",
				content: trimmedPlan,
				details: {
					path: PLAN_FILE,
					hint,
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

		const hasOpenQuestions = extractOpenQuestions(plan).length > 0;
		showPlan(
			plan,
			hasOpenQuestions
				? 'This plan still contains open questions. Refine the request or answer clarifying questions, then review this entry with Ctrl+O.'
				: 'Reply with approval like "approve plan" or send a normal follow-up message to refine/change the plan. Use Ctrl+O to expand this entry.',
		);
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

	pi.registerCommand("plan", {
		description: "Toggle plan mode or plan a specific task",
		handler: async (args, ctx) => {
			const input = args.trim();
			const lower = input.toLowerCase();

			if (lower === "off" || lower === "disable") {
				resetPlanning(ctx, "Plan mode disabled");
				return;
			}

			if (["show", "view", "inspect", "full"].includes(lower)) {
				ctx.ui.notify("Plans now appear as normal messages in the timeline. Use Ctrl+O on the plan entry to expand it.", "info");
				return;
			}

			if (input) {
				await enablePlanning(ctx, input, true);
				return;
			}

			await togglePlanning(ctx);
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.setEditorComponent((tui, theme, keybindings) => new PlanModeEditor(tui, theme, keybindings, () => togglePlanning(ctx)));
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
	});

	pi.on("before_agent_start", async (_event, ctx) => {
		if (!active) return;
		const planAbs = planFileAbsolute(ctx.cwd);
		return {
			message: {
				customType: "planmode-context",
				content:
					`[PLAN MODE ACTIVE]\nCurrent task: ${taskPrompt || "(will be provided by the user's next message)"}\n\nBefore making any code or file changes, do the following in order:\n1. Analyze the task and inspect the codebase read-only.\n2. Identify missing information first. If anything is ambiguous, risky, or underspecified, ask clarifying questions with ${PLAN_QUESTIONS_TOOL}.\n3. When using ${PLAN_QUESTIONS_TOOL}, provide short labels and concrete suggestions. Do not add your own "other" option because the tool already appends a free-text choice.\n4. Do not write ${PLAN_FILE} until those questions have been answered or there are genuinely no open questions. Do not put unanswered open questions into the written plan.\n5. Once there are no open questions, write a detailed implementation plan to ${PLAN_FILE} using the write tool. Overwrite that file completely when updating the plan.\n6. The plan must include: goal, assumptions, open questions, affected files, step-by-step changes, validation steps, and risks.\n7. Do not edit any file except ${PLAN_FILE}. Do not use write/edit/bash to modify anything else.\n8. After asking questions or after writing the plan, stop and wait for the user's next message.\n9. If the user refines the request, treat it as a plan refinement request and overwrite ${PLAN_FILE} again before stopping instead of just discussing changes.\n10. Only start implementation after the user clearly approves the plan.\n\nCurrent working directory: ${ctx.cwd}\nPlan file absolute path: ${planAbs}`,
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

		const refinement = event.text.trim();
		if (!refinement) return;

		if (!taskPrompt) {
			taskPrompt = refinement;
			persist();
		}

		sendPlanRefinementContext(ctx);
		if (ctx.isIdle()) pi.sendUserMessage(refinement);
		else pi.sendUserMessage(refinement, { deliverAs: "steer" });
		return { action: "handled" };
	});

	pi.on("agent_end", async (_event, ctx) => {
		await maybeShowPlan(ctx);
	});
}
