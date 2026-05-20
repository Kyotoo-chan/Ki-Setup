import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Model } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Key, matchesKey, truncateToWidth } from "@mariozechner/pi-tui";

const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"] as const;
type ThinkingLevel = (typeof THINKING_LEVELS)[number];

type ModelItem = {
	label: string;
	model: Model<any>;
};

type SelectorResult = {
	model: Model<any>;
	thinking: ThinkingLevel;
};

type InteractiveModeLike = {
	session: {
		model: Model<any> | undefined;
		modelRegistry: {
			refresh(): void;
			getAvailable(): Promise<Model<any>[]>;
		};
		setModel(model: Model<any>): Promise<void>;
		setThinkingLevel(level: ThinkingLevel): void;
		thinkingLevel: ThinkingLevel;
	};
	ui: { requestRender(): void };
	footer: { invalidate(): void };
	updateEditorBorderColor(): void;
	showStatus(message: string): void;
	showError(message: string): void;
	maybeWarnAboutAnthropicSubscriptionAuth(model?: Model<any>): Promise<void>;
	checkDaxnutsEasterEgg(model: Model<any>): void;
	getModelCandidates(): Promise<Model<any>[]>;
	showSelector(create: (done: () => void) => { component: { render(width: number): string[]; handleInput(data: string): void; invalidate(): void }; focus: unknown }): void;
};

type InteractiveModePrototype = {
	handleModelCommand(searchTerm?: string): Promise<void>;
	showModelSelector(initialSearchInput?: string): void;
};

type ThemeLike = {
	fg(color: string, text: string): string;
	bold(text: string): string;
};

function formatTokenCount(value: number | undefined): string {
	if (!value || value <= 0) return "?";
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
	return `${value}`;
}

function formatCost(value: number | undefined): string {
	if (value === undefined || value === null) return "?";
	if (value === 0) return "$0";
	if (value < 0.01) return `$${value.toFixed(4)}`;
	if (value < 1) return `$${value.toFixed(3)}`;
	return `$${value.toFixed(2)}`;
}

function getModelInfoLines(model: Model<any>, theme: ThemeLike): string[] {
	const lines: string[] = [];
	if (model.name && model.name !== model.id) {
		lines.push(theme.fg("muted", ` Name: ${model.name}`));
	}
	lines.push(theme.fg("muted", ` Context: ${formatTokenCount((model as { contextWindow?: number }).contextWindow)} • Max out: ${formatTokenCount((model as { maxTokens?: number }).maxTokens)}`));
	const cost = (model as { cost?: { input?: number; output?: number; cacheRead?: number; cacheWrite?: number } }).cost;
	if (cost) {
		const parts = [`in ${formatCost(cost.input)}`, `out ${formatCost(cost.output)}`];
		if ((cost.cacheRead ?? 0) > 0 || (cost.cacheWrite ?? 0) > 0) {
			parts.push(`cache-r ${formatCost(cost.cacheRead)}`);
			parts.push(`cache-w ${formatCost(cost.cacheWrite)}`);
		}
		lines.push(theme.fg("muted", ` Cost / 1M tok: ${parts.join(" • ")}`));
	}
	return lines;
}

function modelsEqual(a: Model<any> | undefined, b: Model<any> | undefined): boolean {
	return !!a && !!b && a.provider === b.provider && a.id === b.id;
}

function getSupportedThinkingLevels(model: Model<any>): ThinkingLevel[] {
	if (!model.reasoning) return ["off"];
	const map = model.thinkingLevelMap ?? {};
	const supported = THINKING_LEVELS.filter((level) => map[level] !== null);
	return supported.length > 0 ? supported : ["off"];
}

function getInitialThinkingLevel(model: Model<any>, currentLevel: ThinkingLevel): ThinkingLevel {
	const supportedLevels = getSupportedThinkingLevels(model);
	return supportedLevels.includes(currentLevel) ? currentLevel : supportedLevels[0]!;
}

function getVisibleRange(selectedIndex: number, total: number, maxVisible: number): { start: number; end: number } {
	const start = Math.max(0, Math.min(selectedIndex - Math.floor(maxVisible / 2), Math.max(0, total - maxVisible)));
	return { start, end: Math.min(total, start + maxVisible) };
}

async function loadInteractiveTheme(): Promise<ThemeLike> {
	const packageEntry = require.resolve("@mariozechner/pi-coding-agent");
	const themePath = path.join(path.dirname(packageEntry), "modes", "interactive", "theme", "theme.js");
	const themeUrl = pathToFileURL(themePath).href;
	const mod = (await import(themeUrl)) as { theme?: ThemeLike };
	if (!mod.theme) throw new Error("Could not load interactive theme");
	return mod.theme;
}

async function openModelAndThinkingSelector(mode: InteractiveModeLike, searchTerm?: string): Promise<void> {
	mode.session.modelRegistry.refresh();
	const availableModels = await mode.getModelCandidates();
	const normalizedSearch = searchTerm?.trim().toLowerCase();
	const theme = await loadInteractiveTheme();

	const models = availableModels
		.filter((model) => {
			if (!normalizedSearch) return true;
			const haystack = `${model.provider}/${model.id} ${model.provider} ${model.id} ${model.name ?? ""}`.toLowerCase();
			return haystack.includes(normalizedSearch);
		})
		.map((model) => ({
			model,
			label: `${model.id} [${model.provider}]`,
		} satisfies ModelItem));

	if (models.length === 0) {
		mode.showError(normalizedSearch ? `No models match: ${searchTerm}` : "No models available");
		return;
	}

	const initialModelIndex = Math.max(0, models.findIndex((item) => modelsEqual(mode.session.model, item.model)));
	const currentThinking = mode.session.thinkingLevel;

	const result = await new Promise<SelectorResult | undefined>((resolve) => {
		mode.showSelector((done) => {
			let stage: "model" | "thinking" = "model";
			let modelIndex = initialModelIndex;
			let selectedModel = models[modelIndex]!.model;
			let thinkingLevels = getSupportedThinkingLevels(selectedModel);
			let thinkingIndex = Math.max(0, thinkingLevels.indexOf(getInitialThinkingLevel(selectedModel, currentThinking)));
			let cachedLines: string[] | undefined;
			const maxVisible = 7;

			function syncThinkingState(): void {
				selectedModel = models[modelIndex]!.model;
				thinkingLevels = getSupportedThinkingLevels(selectedModel);
				const initialThinking = getInitialThinkingLevel(selectedModel, currentThinking);
				thinkingIndex = Math.max(0, thinkingLevels.indexOf(initialThinking));
			}

			function refresh(): void {
				cachedLines = undefined;
				mode.ui.requestRender();
			}

			function finish(value: SelectorResult | undefined): void {
				done();
				resolve(value);
			}

			function moveUp(): void {
				if (stage === "model") {
					modelIndex = modelIndex === 0 ? models.length - 1 : modelIndex - 1;
					syncThinkingState();
				} else {
					thinkingIndex = thinkingIndex === 0 ? thinkingLevels.length - 1 : thinkingIndex - 1;
				}
				refresh();
			}

			function moveDown(): void {
				if (stage === "model") {
					modelIndex = modelIndex === models.length - 1 ? 0 : modelIndex + 1;
					syncThinkingState();
				} else {
					thinkingIndex = thinkingIndex === thinkingLevels.length - 1 ? 0 : thinkingIndex + 1;
				}
				refresh();
			}

			syncThinkingState();

			const component = {
				handleInput(data: string): void {
					if (matchesKey(data, Key.up)) {
						moveUp();
						return;
					}
					if (matchesKey(data, Key.down)) {
						moveDown();
						return;
					}
					if (matchesKey(data, Key.enter)) {
						if (stage === "model") {
							stage = "thinking";
							refresh();
							return;
						}
						finish({ model: selectedModel, thinking: thinkingLevels[thinkingIndex]! });
						return;
					}
					if (matchesKey(data, Key.escape)) {
						if (stage === "thinking") {
							stage = "model";
							refresh();
							return;
						}
						finish(undefined);
					}
				},
				invalidate(): void {
					cachedLines = undefined;
				},
				render(width: number): string[] {
					if (cachedLines) return cachedLines;

					const lines: string[] = [];
					const add = (text: string) => lines.push(truncateToWidth(text, width));

					if (stage === "model") {
						const { start, end } = getVisibleRange(modelIndex, models.length, maxVisible);
						add(theme.fg("accent", "═".repeat(width)));
						add(theme.fg("accent", theme.bold(" Model selection")));
						add(theme.fg("muted", normalizedSearch ? ` Filter: ${searchTerm}` : " Choose the model first. Scoped models are honored when configured."));
						lines.push("");

						for (let i = start; i < end; i++) {
							const selected = i === modelIndex;
							const marker = selected ? theme.fg("accent", "> model    ") : "  model    ";
							const color = selected ? "accent" : "text";
							const currentSuffix = modelsEqual(mode.session.model, models[i]!.model) ? theme.fg("muted", " [current]") : "";
							add(`${marker}${theme.fg(color, models[i]!.label)}${currentSuffix}`);
						}

						if (start > 0 || end < models.length) {
							lines.push("");
							add(theme.fg("muted", ` ${modelIndex + 1}/${models.length}`));
						}

						lines.push("");
						for (const infoLine of getModelInfoLines(selectedModel, theme)) {
							add(infoLine);
						}
						lines.push("");
						add(theme.fg("dim", " ↑↓ select model • Enter continue • Esc cancel"));
						add(theme.fg("dim", " Wrap-around enabled: ↑ on first jumps to last, ↓ on last jumps to first"));
						add(theme.fg("accent", "═".repeat(width)));
					} else {
						const { start, end } = getVisibleRange(thinkingIndex, thinkingLevels.length, maxVisible);
						const currentLevel = getInitialThinkingLevel(selectedModel, currentThinking);
						add(theme.fg("accent", "═".repeat(width)));
						add(theme.fg("accent", theme.bold(" Thinking level")));
						add(theme.fg("muted", ` Model: ${selectedModel.id} [${selectedModel.provider}]`));
						lines.push("");

						for (let i = start; i < end; i++) {
							const level = thinkingLevels[i]!;
							const selected = i === thinkingIndex;
							const marker = selected ? theme.fg("accent", "> thinking ") : "  thinking ";
							const color = selected ? "accent" : "text";
							const currentSuffix = level === currentLevel ? theme.fg("muted", " [current]") : "";
							add(`${marker}${theme.fg(color, level)}${currentSuffix}`);
						}

						if (start > 0 || end < thinkingLevels.length) {
							lines.push("");
							add(theme.fg("muted", ` ${thinkingIndex + 1}/${thinkingLevels.length}`));
						}

						lines.push("");
						add(theme.fg("muted", " Thinking cost has no fixed multiplier."));
						add(theme.fg("muted", " More thinking usually means more hidden reasoning tokens, depending on task/model/provider."));
						lines.push("");
						add(theme.fg("dim", " ↑↓ select thinking • Enter confirm • Esc back"));
						add(theme.fg("dim", " Wrap-around enabled: ↑ on first jumps to last, ↓ on last jumps to first"));
						add(theme.fg("accent", "═".repeat(width)));
					}

					cachedLines = lines;
					return lines;
				},
			};

			return { component, focus: component };
		});
	});

	if (!result) return;

	const modelChanged = !modelsEqual(mode.session.model, result.model);
	if (modelChanged) {
		try {
			await mode.session.setModel(result.model);
			mode.footer.invalidate();
			mode.updateEditorBorderColor();
			mode.showStatus(`Model: ${result.model.id}`);
			void mode.maybeWarnAboutAnthropicSubscriptionAuth(result.model);
			mode.checkDaxnutsEasterEgg(result.model);
		}
		catch (error) {
			mode.showError(error instanceof Error ? error.message : String(error));
			return;
		}
	}

	mode.session.setThinkingLevel(result.thinking);
	mode.footer.invalidate();
	mode.showStatus(`Model: ${result.model.id} · Thinking: ${result.thinking}`);
}

async function patchInteractiveMode(): Promise<void> {
	const key = Symbol.for("btw.pi.model-selector.patch");
	const globalState = globalThis as Record<PropertyKey, unknown>;
	if (globalState[key]) return;

	const packageEntry = require.resolve("@mariozechner/pi-coding-agent");
	const interactiveModePath = path.join(path.dirname(packageEntry), "modes", "interactive", "interactive-mode.js");
	const interactiveModeUrl = pathToFileURL(interactiveModePath).href;
	const mod = (await import(interactiveModeUrl)) as { InteractiveMode?: { prototype: InteractiveModePrototype } };
	const prototype = mod.InteractiveMode?.prototype;
	if (!prototype) throw new Error("Could not load InteractiveMode prototype");

	prototype.handleModelCommand = async function (this: InteractiveModeLike, searchTerm?: string): Promise<void> {
		await openModelAndThinkingSelector(this, searchTerm);
	};

	prototype.showModelSelector = function (this: InteractiveModeLike, initialSearchInput?: string): void {
		void openModelAndThinkingSelector(this, initialSearchInput).catch((error: unknown) => {
			this.showError(error instanceof Error ? error.message : String(error));
		});
	};

	globalState[key] = true;
}

export default function modelSelectorExtension(_pi: ExtensionAPI) {
	void patchInteractiveMode();
}
