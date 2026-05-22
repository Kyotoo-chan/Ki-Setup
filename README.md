# Agentic Coding Setup

> Dieses Repo ist eine einfache Basis für Pi und Claude.
> Wenn eine Umsetzung nicht klar ist, erst im Plan Mode klären und dann umsetzen.
> `AGENTS.md` und `agents.md` sind nur Startpunkte. Kopiere sie pro Projekt und passe sie an, per Agent oder von Hand.

## Schnellstart

```bash
git clone https://github.com/Kyotoo-chan/Ki-Setup.git
cd Ki-Setup
```

Danach je nach Bereich weiter in:

- [`pi/README.md`](./pi/README.md)
- [`claude/README.md`](./claude/README.md)

## Repo-Aufteilung

```text
Ki-Setup/
├── agents/   ← Geteilte Agent-Profile
├── pi/       ← Pi-Setup
├── claude/   ← Claude-only Setup
└── README.md
```

## Was `AGENTS.md` und `agents.md` machen

Diese Dateien halten Regeln, Rollen, Workflows und Projektkontext fest.

Wichtig dabei:

- Nicht blind kopieren
- Pro Projekt anpassen
- Das geht per Agent oder von Hand
- Erst dann bringen die Dateien wirklich etwas

Die geteilten Profile dieses Repos liegen in [`agents/main.md`](./agents/main.md).

## Einstieg

| Bereich | Zweck |
|---|---|
| [`pi/README.md`](./pi/README.md) | Pi-Installation, Extensions und Pi-Befehle |
| [`claude/README.md`](./claude/README.md) | Claude-Installation, `.claude/`-Dateien und Claude-Workflow |
| [`agents/main.md`](./agents/main.md) | Geteilte Agent-Profile für beide Bereiche |
