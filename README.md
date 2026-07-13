# Agentic Coding Setup

> Dieses Repo bündelt ein schlankes Setup für Coding-Agenten wie Pi, Cursor und Claude Code. Der Fokus liegt auf **Windows 11**.
> Vor der Umsetzung lohnt sich ein kurzer Plan Mode oder `/plan`: So werden Ziel, Randbedingungen und offene Fragen geklärt, bevor Dateien geändert werden.
> Für Pi nutzt das Setup externe Packages für Tool-Darstellung, Kontextarbeit, Web-Zugriff, Subagenten, Rückfragen, Todo-Listen und Ponytail. Die Install-Befehle stehen in [`pi/README.md`](./pi/README.md).
> `AGENTS.md` und `agents.md` sind Vorlagen. Kopiere sie pro Projekt und passe Regeln, Rollen und Kontext an das jeweilige Projekt an.

## Schnellstart

```bash
git clone https://github.com/Kyotoo-chan/Ki-Setup.git
cd Ki-Setup
```

Danach je nach Bereich weiter in:

- [`pi/README.md`](./pi/README.md)
- [`cursor/README.md`](./cursor/README.md)
- [`claude/README.md`](./claude/README.md)

## Pi-Pakete in diesem Setup

```bash
pi install npm:pi-claude-style-tools
pi install npm:context-mode
pi install npm:pi-web-access
pi install npm:@juicesharp/rpiv-ask-user-question
pi install npm:@juicesharp/rpiv-todo
pi install npm:pi-subagents
pi install npm:@dietrichgebert/ponytail
```

## Repo-Aufteilung

```text
Ki-Setup/
├── agents/   ← Geteilte Agent-Profile
├── pi/       ← Pi-Setup
├── cursor/   ← Cursor-Setup
├── claude/   ← Claude-only Setup
└── README.md
```

## Was `AGENTS.md` und `agents.md` machen

Diese Dateien halten Regeln, Rollen, Workflows und Projektkontext fest. Sie funktionieren am besten, wenn sie zum jeweiligen Projekt passen:

- Nur übernehmen, was wirklich gebraucht wird
- Projektregeln ergänzen oder streichen
- Rollen und Workflows klar beschreiben
- Danach können Agenten konsistenter arbeiten

Die geteilten Profile dieses Repos liegen in [`agents/main.md`](./agents/main.md).

## Einstieg

| Bereich | Zweck |
|---|---|
| [`pi/README.md`](./pi/README.md) | Pi-Installation, Packages, Extensions und Pi-Befehle |
| [`cursor/README.md`](./cursor/README.md) | Cursor-Installation, Ponytail-Regel und Modell-Defaults |
| [`claude/README.md`](./claude/README.md) | Claude-Installation, `.claude/`-Dateien und Claude-Workflow |
| [`agents/main.md`](./agents/main.md) | Geteilte Agent-Profile für alle Bereiche |
