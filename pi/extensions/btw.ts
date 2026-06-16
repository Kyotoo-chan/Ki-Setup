import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function btwExtension(pi: ExtensionAPI) {
	pi.registerCommand("btw", {
		description: "Inject an additional instruction while the agent is running",
		handler: async (args, ctx) => {
			const text = args.trim();
			if (!text) {
				ctx.ui.notify("Usage: /btw <additional instruction>", "warning");
				return;
			}

			const message = `Additional instruction for the current task: ${text}`;

			if (ctx.isIdle()) {
				pi.sendUserMessage(message);
				return;
			}

			pi.sendUserMessage(message, { deliverAs: "steer" });
			ctx.ui.notify("Additional instruction queued for the current run", "info");
		},
	});
}
