import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";

import type {
  AssistantMessage,
  ImageContent,
  Model,
  TextContent,
} from "@mariozechner/pi-ai";
import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

const LIMIT_STATE_TYPE = "usage-footer-state";
const AUTO_COMPACT_THRESHOLD_PERCENT = 75;

type LimitWindowId = "5h" | "7d";

type ExactLimitWindow = {
  limit?: number;
  remaining?: number;
  used?: number;
  remainingPercent?: number;
  usedPercent?: number;
  resetAt?: number;
};

type ExactLimitSnapshot = {
  provider: string;
  modelId: string;
  capturedAt: number;
  windows: Partial<Record<LimitWindowId, ExactLimitWindow>>;
};

type PersistedLimitState = {
  snapshots: Record<string, ExactLimitSnapshot>;
};

const EMPTY_STATE: PersistedLimitState = { snapshots: {} };

const WINDOW_PATTERNS: Record<LimitWindowId, RegExp[]> = {
  "5h": [/\b5h\b/i, /\b5[-_ ]?hour/i, /\bfive[-_ ]?hour/i],
  "7d": [/\b7d\b/i, /\b7[-_ ]?day/i, /\bweekly\b/i],
};

function getModelKey(model: Model<any> | undefined): string | undefined {
  if (!model) return undefined;
  return `${model.provider}/${model.id}`;
}

function formatTokens(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1000000) return `${Math.round(count / 1000)}k`;
  if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
  return `${Math.round(count / 1000000)}M`;
}

function formatPercent(value: number): string {
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)}%`;
}

type RgbColor = { r: number; g: number; b: number };
type UsageColorStop = { percent: number; color: RgbColor };

const USAGE_COLOR_STOPS: UsageColorStop[] = [
  { percent: 0, color: { r: 0x6f, g: 0x8f, b: 0xb8 } },
  { percent: 50, color: { r: 0x6f, g: 0x8f, b: 0xb8 } },
  { percent: 70, color: { r: 0x8b, g: 0x83, b: 0xb8 } },
  { percent: 85, color: { r: 0xb8, g: 0x9a, b: 0x62 } },
  { percent: 95, color: { r: 0xbd, g: 0x7a, b: 0x55 } },
  { percent: 100, color: { r: 0xbd, g: 0x5f, b: 0x5f } },
];

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function interpolateColor(a: RgbColor, b: RgbColor, t: number): RgbColor {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function getUsageColor(percent: number): RgbColor {
  const clamped = clampPercent(percent);
  let previous = USAGE_COLOR_STOPS[0]!;
  for (const stop of USAGE_COLOR_STOPS.slice(1)) {
    if (clamped <= stop.percent) {
      const span = stop.percent - previous.percent;
      const t = span > 0 ? (clamped - previous.percent) / span : 0;
      return interpolateColor(previous.color, stop.color, t);
    }
    previous = stop;
  }
  return previous.color;
}

function ansiFgRgb(text: string, color: RgbColor): string {
  return `\x1b[38;2;${color.r};${color.g};${color.b}m${text}\x1b[39m`;
}

function colorUsagePercent(text: string, percent: number): string {
  return ansiFgRgb(text, getUsageColor(percent));
}

function sanitizeStatusText(text: string): string {
  return text
    .replace(/[\r\n\t]/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

function isApiKeyModel(
  ctx: ExtensionContext,
  model: Model<any> | undefined,
): boolean {
  if (!model) return false;
  return (
    ctx.modelRegistry.hasConfiguredAuth(model) &&
    !ctx.modelRegistry.isUsingOAuth(model)
  );
}

function getUsedPercent(
  window: ExactLimitWindow | undefined,
): number | undefined {
  if (!window) return undefined;
  if (window.usedPercent !== undefined) return window.usedPercent;
  if (window.remainingPercent !== undefined)
    return 100 - window.remainingPercent;
  if (window.used !== undefined && window.limit)
    return (window.used / window.limit) * 100;
  if (window.remaining !== undefined && window.limit)
    return ((window.limit - window.remaining) / window.limit) * 100;
  return undefined;
}

function hasExactData(snapshot: ExactLimitSnapshot | undefined): boolean {
  if (!snapshot) return false;
  return Object.values(snapshot.windows).some(
    (window) => !!window && Object.keys(window).length > 0,
  );
}

function mergeWindow(
  existing: ExactLimitWindow | undefined,
  next: ExactLimitWindow,
): ExactLimitWindow {
  return {
    limit: next.limit ?? existing?.limit,
    remaining: next.remaining ?? existing?.remaining,
    used: next.used ?? existing?.used,
    remainingPercent: next.remainingPercent ?? existing?.remainingPercent,
    usedPercent: next.usedPercent ?? existing?.usedPercent,
    resetAt: next.resetAt ?? existing?.resetAt,
  };
}

function getWindowId(headerName: string): LimitWindowId | undefined {
  const normalized = headerName.toLowerCase();
  for (const windowId of Object.keys(WINDOW_PATTERNS) as LimitWindowId[]) {
    if (WINDOW_PATTERNS[windowId].some((pattern) => pattern.test(normalized)))
      return windowId;
  }
  return undefined;
}

function parseNumericValue(
  rawValue: string,
): { value: number; isPercent: boolean } | undefined {
  const trimmed = rawValue.trim();
  if (!trimmed) return undefined;
  if (trimmed.endsWith("%")) {
    const parsed = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(parsed)
      ? { value: parsed, isPercent: true }
      : undefined;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed)
    ? { value: parsed, isPercent: false }
    : undefined;
}

function parseDurationToMs(rawValue: string): number | undefined {
  const match = rawValue.trim().match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match) return undefined;
  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const seconds = Number.parseInt(match[3] ?? "0", 10);
  if (!hours && !minutes && !seconds) return undefined;
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

function parseResetTimestamp(
  rawValue: string,
  now: number,
): number | undefined {
  const trimmed = rawValue.trim();
  if (!trimmed) return undefined;

  const directDate = Date.parse(trimmed);
  if (Number.isFinite(directDate)) return directDate;

  const durationMs = parseDurationToMs(trimmed);
  if (durationMs !== undefined) return now + durationMs;

  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) return undefined;
  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric)) return undefined;
  if (numeric > 1_000_000_000_000) return Math.round(numeric);
  if (numeric > 1_000_000_000) return Math.round(numeric * 1000);
  if (numeric < 86_400) return now + Math.round(numeric * 1000);
  return Math.round(numeric);
}

function extractSnapshotFromHeaders(
  headers: Record<string, string>,
  model: Model<any>,
  now: number,
  previous: ExactLimitSnapshot | undefined,
): ExactLimitSnapshot | undefined {
  const snapshot: ExactLimitSnapshot = previous
    ? {
        provider: previous.provider,
        modelId: previous.modelId,
        capturedAt: now,
        windows: { ...previous.windows },
      }
    : {
        provider: model.provider,
        modelId: model.id,
        capturedAt: now,
        windows: {},
      };

  for (const [rawName, rawValue] of Object.entries(headers)) {
    const headerName = rawName.toLowerCase();
    const windowId = getWindowId(headerName);
    if (!windowId) continue;

    const current = snapshot.windows[windowId] ?? {};
    let update: ExactLimitWindow | undefined;

    if (/reset/.test(headerName)) {
      const resetAt = parseResetTimestamp(rawValue, now);
      if (resetAt !== undefined) update = { ...current, resetAt };
    } else if (/remaining/.test(headerName)) {
      const parsed = parseNumericValue(rawValue);
      if (parsed)
        update = parsed.isPercent
          ? { ...current, remainingPercent: parsed.value }
          : { ...current, remaining: parsed.value };
    } else if (/(?:used|consumed)/.test(headerName)) {
      const parsed = parseNumericValue(rawValue);
      if (parsed)
        update = parsed.isPercent
          ? { ...current, usedPercent: parsed.value }
          : { ...current, used: parsed.value };
    } else if (/limit/.test(headerName)) {
      const parsed = parseNumericValue(rawValue);
      if (parsed && !parsed.isPercent)
        update = { ...current, limit: parsed.value };
    }

    if (update) snapshot.windows[windowId] = mergeWindow(current, update);
  }

  return hasExactData(snapshot) ? snapshot : undefined;
}

function formatReset(resetAt: number | undefined): string | undefined {
  if (!resetAt || !Number.isFinite(resetAt)) return undefined;
  return new Date(resetAt).toLocaleString();
}

function formatFooterWindow(
  label: LimitWindowId,
  window: ExactLimitWindow | undefined,
): string | undefined {
  const usedPercent = getUsedPercent(window);
  if (usedPercent !== undefined)
    return `${label} ${formatPercent(usedPercent)}`;
  if (window?.used !== undefined && window.limit !== undefined)
    return `${label} ${window.used}/${window.limit}`;
  return undefined;
}

function buildDeferredContent(
  text: string,
  images?: ImageContent[],
): string | (TextContent | ImageContent)[] {
  if (!images?.length) return text;
  const content: (TextContent | ImageContent)[] = [];
  if (text.trim()) content.push({ type: "text", text });
  content.push(...images);
  return content;
}

export default function usageFooterExtension(pi: ExtensionAPI) {
  let state: PersistedLimitState = EMPTY_STATE;
  let currentModel: Model<any> | undefined;
  let currentThinking: string = "off";
  let showApiIndicator = false;
  let compacting = false;
  let requestFooterRender: (() => void) | undefined;

  function requestRender() {
    requestFooterRender?.();
  }

  // Usage Polling State
  let isGenerating = false;
  let providerUsage: { used5h: number; used7d: number } | null = null;
  let usageInterval: ReturnType<typeof setInterval> | null = null;
  let hasNotifiedUsageError = false;

  // Helper to safely read and parse pi auth file
  function readPiAuth(): any {
    const authPaths = [
      path.join(homedir(), ".pi", "agent", "auth.json"),
      path.join(homedir(), ".pi", "auth.json"),
    ];

    for (const authPath of authPaths) {
      try {
        if (!fs.existsSync(authPath)) continue;
        return JSON.parse(fs.readFileSync(authPath, "utf-8"));
      } catch {
        return null;
      }
    }
    return null;
  }

  async function fetchProviderUsage(
    model: Model<any> | undefined,
    ctx?: ExtensionContext,
  ): Promise<void> {
    if (!model) {
      providerUsage = null;
      return;
    }
    const auth = readPiAuth();
    if (!auth) {
      providerUsage = null;
      return;
    }

    try {
      if (model.provider === "openai-codex" && auth["openai-codex"]?.access) {
        const res = await fetch("https://chatgpt.com/backend-api/wham/usage", {
          headers: { Authorization: `Bearer ${auth["openai-codex"].access}` },
        });
        if (!res.ok) throw new Error("Codex usage fetch failed");
        const data = await res.json();
        const p1 = data?.rate_limit?.primary_window?.used_percent;
        const p2 = data?.rate_limit?.secondary_window?.used_percent;
        if (typeof p1 === "number" && typeof p2 === "number") {
          providerUsage = { used5h: clampPercent(p1), used7d: clampPercent(p2) };
          return;
        }
      }

      if (model.provider === "anthropic" && auth.anthropic?.access) {
        const res = await fetch("https://api.anthropic.com/api/oauth/usage", {
          headers: {
            Authorization: `Bearer ${auth.anthropic.access}`,
            "anthropic-beta": "oauth-2025-04-20",
          },
        });
        if (!res.ok) throw new Error("Claude usage fetch failed");
        const data = await res.json();
        const p1 = data?.rate_limit?.primary_window?.used_percent;
        const p2 = data?.rate_limit?.secondary_window?.used_percent;
        if (typeof p1 === "number" && typeof p2 === "number") {
          providerUsage = { used5h: clampPercent(p1), used7d: clampPercent(p2) };
          return;
        }
      }

      // Unsupported provider or missing data
      providerUsage = null;
    } catch (err) {
      providerUsage = null;
      // Notify only once per session if a supported provider fails
      if (
        !hasNotifiedUsageError &&
        (model.provider === "openai-codex" || model.provider === "anthropic")
      ) {
        hasNotifiedUsageError = true;
        if (ctx?.hasUI) {
          ctx.ui.notify(
            `Usage API changed or unavailable for ${model.provider}`,
            "warning",
          );
        }
      }
    }
  }

  function startUsagePolling(ctx: ExtensionContext) {
    isGenerating = true;
    fetchProviderUsage(currentModel, ctx).then(() => requestRender());
    if (usageInterval) clearInterval(usageInterval);
    usageInterval = setInterval(() => {
      if (!isGenerating) return;
      fetchProviderUsage(currentModel, ctx).then(() => requestRender());
    }, 30000);
  }

  function stopUsagePolling(ctx: ExtensionContext) {
    isGenerating = false;
    if (usageInterval) {
      clearInterval(usageInterval);
      usageInterval = null;
    }
    fetchProviderUsage(currentModel, ctx).then(() => requestRender());
  }
  let delayedPrompt: string | (TextContent | ImageContent)[] | undefined;

  function syncModel(ctx: ExtensionContext, model = ctx.model) {
    currentModel = model;
    currentThinking = pi.getThinkingLevel();
    showApiIndicator = isApiKeyModel(ctx, model);
  }

  function restoreState(ctx: ExtensionContext) {
    const restored = ctx.sessionManager
      .getEntries()
      .filter(
        (entry: { type: string; customType?: string }) =>
          entry.type === "custom" && entry.customType === LIMIT_STATE_TYPE,
      )
      .pop() as { data?: PersistedLimitState } | undefined;
    state = restored?.data?.snapshots ? restored.data : EMPTY_STATE;
  }

  function persistState() {
    pi.appendEntry(LIMIT_STATE_TYPE, state);
  }

  function getCurrentSnapshot(): ExactLimitSnapshot | undefined {
    const key = getModelKey(currentModel);
    return key ? state.snapshots[key] : undefined;
  }

  function shouldCompact(ctx: ExtensionContext): boolean {
    const usage = ctx.getContextUsage();
    return (
      usage?.percent !== null &&
      usage?.percent !== undefined &&
      usage.percent >= AUTO_COMPACT_THRESHOLD_PERCENT
    );
  }

  function startCompact(
    ctx: ExtensionContext,
    handlers?: {
      onComplete?: () => void;
      onError?: (error: Error) => void;
    },
  ): boolean {
    if (compacting || !shouldCompact(ctx)) return false;
    compacting = true;
    ctx.compact({
      onComplete: () => {
        compacting = false;
        handlers?.onComplete?.();
      },
      onError: (error) => {
        compacting = false;
        handlers?.onError?.(error);
      },
    });
    return true;
  }

  function installFooter(ctx: ExtensionContext) {
    if (!ctx.hasUI) return;
    ctx.ui.setFooter((tui, theme, footerData) => {
      const request = () => tui.requestRender();
      requestFooterRender = request;
      const unsubscribe = footerData.onBranchChange(request);

      return {
        dispose: () => {
          unsubscribe();
          if (requestFooterRender === request) requestFooterRender = undefined;
        },
        invalidate() {},
        render(width: number): string[] {
          let totalInput = 0;
          let totalOutput = 0;

          for (const entry of ctx.sessionManager.getBranch()) {
            if (
              entry.type === "message" &&
              entry.message.role === "assistant"
            ) {
              const message = entry.message as AssistantMessage;
              totalInput += message.usage?.input ?? 0;
              totalOutput += message.usage?.output ?? 0;
            }
          }

          const contextUsage = ctx.getContextUsage();
          const contextWindow =
            contextUsage?.contextWindow ?? currentModel?.contextWindow ?? 0;
          const contextPercentKnown =
            contextUsage?.percent !== null &&
            contextUsage?.percent !== undefined;
          const contextPercentValue = contextUsage?.percent ?? 0;
          const contextDisplay = contextPercentKnown
            ? `${contextPercentValue.toFixed(1)}%/${formatTokens(contextWindow)} (${AUTO_COMPACT_THRESHOLD_PERCENT}% auto)`
            : `?/${formatTokens(contextWindow)} (${AUTO_COMPACT_THRESHOLD_PERCENT}% auto)`;

          let pwd = ctx.sessionManager.getCwd();
          const home = process.env.HOME || process.env.USERPROFILE;
          if (home && pwd.startsWith(home)) pwd = `~${pwd.slice(home.length)}`;

          const branch = footerData.getGitBranch();
          if (branch) pwd = `${pwd} (${branch})`;

          const sessionName = ctx.sessionManager.getSessionName();
          if (sessionName) pwd = `${pwd} • ${sessionName}`;

          const statsParts: string[] = [];
          if (totalInput)
            statsParts.push(theme.fg("dim", `↑${formatTokens(totalInput)}`));
          if (totalOutput)
            statsParts.push(theme.fg("dim", `↓${formatTokens(totalOutput)}`));

          const snapshot = getCurrentSnapshot();
          const quota5h = formatFooterWindow("5h", snapshot?.windows["5h"]);
          const quota7d = formatFooterWindow("7d", snapshot?.windows["7d"]);
          if (quota5h) statsParts.push(theme.fg("dim", quota5h));
          if (quota7d) statsParts.push(theme.fg("dim", quota7d));

          if (providerUsage) {
            const usage5h = `${formatPercent(providerUsage.used5h)}/5h`;
            const usage7d = `${formatPercent(providerUsage.used7d)}/7d`;
            statsParts.push(
              theme.fg("dim", "[") +
                colorUsagePercent(usage5h, providerUsage.used5h) +
                theme.fg("dim", " ") +
                colorUsagePercent(usage7d, providerUsage.used7d) +
                theme.fg("dim", "]"),
            );
          }

          let contextText = theme.fg("dim", contextDisplay);
          if (contextPercentKnown && contextPercentValue > 90)
            contextText = theme.fg("error", contextDisplay);
          else if (contextPercentKnown && contextPercentValue > 70)
            contextText = theme.fg("warning", contextDisplay);
          statsParts.push(contextText);

          if (showApiIndicator) statsParts.push(theme.fg("dim", "(api)"));

          let statsLeft = statsParts.join(" ");
          let statsLeftWidth = visibleWidth(statsLeft);
          if (statsLeftWidth > width) {
            statsLeft = truncateToWidth(statsLeft, width, "...");
            statsLeftWidth = visibleWidth(statsLeft);
          }

          const modelName = currentModel?.id || "no-model";
          let rightWithoutProvider = modelName;
          if (currentModel?.reasoning) {
            rightWithoutProvider =
              currentThinking === "off"
                ? `${modelName} • thinking off`
                : `${modelName} • ${currentThinking}`;
          }

          let rightSide = rightWithoutProvider;
          if (footerData.getAvailableProviderCount() > 1 && currentModel) {
            rightSide = `(${currentModel.provider}) ${rightWithoutProvider}`;
            if (statsLeftWidth + 2 + visibleWidth(rightSide) > width)
              rightSide = rightWithoutProvider;
          }

          const rightSideWidth = visibleWidth(rightSide);
          const totalNeeded = statsLeftWidth + 2 + rightSideWidth;
          let statsLine: string;
          if (totalNeeded <= width) {
            const padding = " ".repeat(width - statsLeftWidth - rightSideWidth);
            statsLine = statsLeft + padding + theme.fg("dim", rightSide);
          } else {
            const availableForRight = width - statsLeftWidth - 2;
            if (availableForRight > 0) {
              const truncatedRight = truncateToWidth(
                rightSide,
                availableForRight,
                "",
              );
              const truncatedRightWidth = visibleWidth(truncatedRight);
              const padding = " ".repeat(
                Math.max(0, width - statsLeftWidth - truncatedRightWidth),
              );
              statsLine = statsLeft + padding + theme.fg("dim", truncatedRight);
            } else {
              statsLine = statsLeft;
            }
          }

          const lines = [
            truncateToWidth(
              theme.fg("dim", pwd),
              width,
              theme.fg("dim", "..."),
            ),
            statsLine,
          ];

          const statuses = footerData.getExtensionStatuses();
          if (statuses.size > 0) {
            const statusLine = Array.from(statuses.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([, text]) => sanitizeStatusText(text))
              .filter(Boolean)
              .join(" ");
            if (statusLine)
              lines.push(
                truncateToWidth(statusLine, width, theme.fg("dim", "...")),
              );
          }

          return lines;
        },
      };
    });
  }

  pi.registerCommand("limit", {
    description: "Show exact provider limit data when exposed",
    handler: async (_args, ctx) => {
      syncModel(ctx);
      const snapshot = getCurrentSnapshot();
      const modelLabel = currentModel
        ? `${currentModel.provider}/${currentModel.id}`
        : "none";

      if (!currentModel) {
        pi.sendMessage(
          {
            customType: "usage-footer-limit",
            content: "No active model.",
            display: true,
          },
          { triggerTurn: false },
        );
        return;
      }

      if (!hasExactData(snapshot)) {
        pi.sendMessage(
          {
            customType: "usage-footer-limit",
            content:
              `# /limit\n\n` +
              `- Model: ${modelLabel}\n` +
              `- Context auto-compact threshold: ${AUTO_COMPACT_THRESHOLD_PERCENT}%\n\n` +
              `The current provider does not provide exact 5h/7d limit data to Pi in this session.`,
            display: true,
          },
          { triggerTurn: false },
        );
        return;
      }

      const usage = ctx.getContextUsage();
      const lines = ["# /limit", "", `- Model: ${modelLabel}`];
      if (usage?.percent !== null && usage?.percent !== undefined) {
        lines.push(
          `- Context usage: ${usage.percent.toFixed(1)}%/${formatTokens(usage.contextWindow)}`,
        );
      } else if (usage?.contextWindow) {
        lines.push(`- Context usage: ?/${formatTokens(usage.contextWindow)}`);
      }
      lines.push(
        `- Context auto-compact threshold: ${AUTO_COMPACT_THRESHOLD_PERCENT}%`,
        "",
      );

      for (const windowId of ["5h", "7d"] as LimitWindowId[]) {
        const window = snapshot.windows[windowId];
        lines.push(`## ${windowId}`);
        if (!window) {
          lines.push(
            `Exact ${windowId} limit data was not exposed by the provider.`,
            "",
          );
          continue;
        }

        const usedPercent = getUsedPercent(window);
        if (usedPercent !== undefined)
          lines.push(`- Used: ${formatPercent(usedPercent)}`);
        if (window.limit !== undefined) lines.push(`- Limit: ${window.limit}`);
        if (window.used !== undefined)
          lines.push(`- Used amount: ${window.used}`);
        if (window.remaining !== undefined)
          lines.push(`- Remaining amount: ${window.remaining}`);
        if (window.remainingPercent !== undefined)
          lines.push(`- Remaining: ${formatPercent(window.remainingPercent)}`);
        const reset = formatReset(window.resetAt);
        if (reset) lines.push(`- Resets: ${reset}`);
        if (lines[lines.length - 1] === `## ${windowId}`)
          lines.push(
            `Exact ${windowId} limit data was not exposed by the provider.`,
          );
        lines.push("");
      }

      lines.push(
        `_Captured: ${new Date(snapshot.capturedAt).toLocaleString()}_`,
      );
      pi.sendMessage(
        {
          customType: "usage-footer-limit",
          content: lines.join("\n"),
          display: true,
        },
        { triggerTurn: false },
      );
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    restoreState(ctx);
    syncModel(ctx);
    compacting = false;
    delayedPrompt = undefined;
    installFooter(ctx);
    await fetchProviderUsage(currentModel, ctx);
    requestRender();
  });

  pi.on("model_select", async (event, ctx) => {
    syncModel(ctx, event.model);
    await fetchProviderUsage(currentModel, ctx);
    requestRender();
  });

  pi.on("thinking_level_select", async (event) => {
    currentThinking = event.level;
    requestRender();
  });

  pi.on("agent_start", async (_event, ctx) => {
    startUsagePolling(ctx);
  });

  pi.on("agent_end", async (_event, ctx) => {
    stopUsagePolling(ctx);
    if (
      delayedPrompt ||
      compacting ||
      ctx.hasPendingMessages() ||
      !shouldCompact(ctx)
    )
      return;
    startCompact(ctx, {
      onComplete: () => {
        if (ctx.hasUI)
          ctx.ui.notify(
            `Context auto-compacted at ${AUTO_COMPACT_THRESHOLD_PERCENT}%.`,
            "info",
          );
      },
      onError: (error) => {
        if (ctx.hasUI)
          ctx.ui.notify(`Auto-compaction failed: ${error.message}`, "warning");
      },
    });
  });

  pi.on("input", async (event, ctx) => {
    if (event.source === "extension") return;
    if (compacting) {
      if (ctx.hasUI)
        ctx.ui.notify(
          "Auto-compaction is already running. Please wait.",
          "info",
        );
      return { action: "handled" };
    }
    if (!shouldCompact(ctx)) return;

    delayedPrompt = buildDeferredContent(event.text, event.images);
    if (ctx.hasUI)
      ctx.ui.notify(
        `Context reached ${AUTO_COMPACT_THRESHOLD_PERCENT}%+. Compacting before sending your prompt.`,
        "info",
      );
    startCompact(ctx, {
      onComplete: () => {
        const pending = delayedPrompt;
        delayedPrompt = undefined;
        if (pending) pi.sendUserMessage(pending);
      },
      onError: (error) => {
        const pending = delayedPrompt;
        delayedPrompt = undefined;
        if (ctx.hasUI)
          ctx.ui.notify(
            `Compaction failed: ${error.message}. Sending your prompt anyway.`,
            "warning",
          );
        if (pending) pi.sendUserMessage(pending);
      },
    });
    return { action: "handled" };
  });
}
