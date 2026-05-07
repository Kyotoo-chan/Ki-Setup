import type { Model } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"] as const;
type ThinkingLevel = (typeof THINKING_LEVELS)[number];

function getSupportedThinkingLevels(model: Model<any>): ThinkingLevel[] {
	if (!model.reasoning) return ["off"];
	const map = model.thinkingLevelMap ?? {};
	const supported = THINKING_LEVELS.filter((level) => map[level] !== null);
	return supported.length > 0 ? supported : ["off"];
}

function formatThinkingLabel(level: ThinkingLevel, current: string): string {
	return level === current ? `${level}  [current]` : level;
}

export default function modelSelectorExtension(pi: ExtensionAPI) {
	pi.on("model_select", async (event, ctx) => {
		// Built-in /model changes the model first. We hook that event and then ask for thinking.
		// Ctrl+P model cycling uses source "cycle"; session resume uses "restore". Leave those alone.
		if (event.source !== "set" || !ctx.hasUI) return;

		const supportedLevels = getSupportedThinkingLevels(event.model);
		if (supportedLevels.length === 1 && supportedLevels[0] === "off") {
			pi.setThinkingLevel("off");
			ctx.ui.notify(`Model: ${event.model.provider}/${event.model.id} · Thinking: off · Cycle later with Ctrl+T`, "info");
			return;
		}

		const currentThinking = pi.getThinkingLevel();
		const choices = supportedLevels.map((level) => formatThinkingLabel(level, currentThinking));
		const picked = await ctx.ui.select("Select thinking level (Ctrl+T cycles later)", choices);
		if (!picked) return;

		const selectedLevel = supportedLevels[choices.indexOf(picked)];
		if (!selectedLevel) return;

		pi.setThinkingLevel(selectedLevel);
		ctx.ui.notify(`Model: ${event.model.provider}/${event.model.id} · Thinking: ${selectedLevel} · Cycle later with Ctrl+T`, "info");
	});
}
