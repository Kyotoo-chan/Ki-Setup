# Agentic Coding Setup

> Dieses Repo bündelt ein schlankes Setup für Coding-Agenten wie Pi, Cursor und Claude Code. Der Fokus liegt auf **Windows 11**.
> Vor der Umsetzung lohnt sich ein kurzer Plan Mode oder `/plan`: So werden Ziel, Randbedingungen und offene Fragen geklärt, bevor Dateien geändert werden.

## Schnellstart

```powershell
git clone https://github.com/Kyotoo-chan/Ki-Setup.git
cd Ki-Setup
```

Installation und Kopierbefehle je nach Tool:

| Bereich | Setup | Agent-Regeln |
|---|---|---|
| Pi | [`pi/README.md`](./pi/README.md) | [`pi/AGENTS.md`](./pi/AGENTS.md) |
| Cursor | [`cursor/README.md`](./cursor/README.md) | [`cursor/AGENTS.md`](./cursor/AGENTS.md) |
| Claude | [`claude/README.md`](./claude/README.md) | [`claude/CLAUDE.md`](./claude/CLAUDE.md) |

`AGENTS.md` bzw. `CLAUDE.md` ins Projektroot kopieren. Rollenprofile optional aus [`agents/`](./agents/).

## Repo-Aufteilung

```text
Ki-Setup/
├── agents/   ← Geteilte Agent-Profile
├── pi/       ← Pi-Setup
├── cursor/   ← Cursor-Setup
├── claude/   ← Claude-only Setup
└── README.md
```

## Einstieg

| Bereich | Zweck |
|---|---|
| [`pi/README.md`](./pi/README.md) | Pi-Installation, Packages, Extensions und Pi-Befehle |
| [`cursor/README.md`](./cursor/README.md) | Cursor-Installation, Ponytail-Regel und Modell-Defaults |
| [`claude/README.md`](./claude/README.md) | Claude-Installation, `.claude/`-Dateien und Claude-Workflow |
| [`agents/main.md`](./agents/main.md) | Geteilte Agent-Profile für alle Bereiche |
