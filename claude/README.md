# Claude-only Setup

> Dieser Ordner ist nur für Claude.
> Dieses Setup ist für **Windows 11** gedacht.
> Wenn eine Umsetzung unklar ist, erst mit `/plan` planen und dann umsetzen.
> Auto-Compact läuft ab **75 %**.

## Installation

PowerShell
```powershell
irm https://claude.ai/install.ps1 | iex
```

CMD
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

## Empfohlene Nutzung

1. Claude Code installieren
2. Dateien aus [`.claude/`](./.claude/) in dein Claude-Setup übernehmen
3. [`templates/CLAUDE.project.md`](./templates/CLAUDE.project.md) als `CLAUDE.md` ins Projektroot kopieren
4. [`./.claude/agents.md`](./.claude/agents.md) an dein Projekt, deine Agenten und deine Workflows anpassen
5. [`./.claude/andrej_karpathy_CLAUDE.md`](./.claude/andrej_karpathy_CLAUDE.md) nur als Referenz nutzen

## Wichtige Claude-Befehle

| Befehl | Kurz |
|---|---|
| `/plan` | Erst den Weg klären, dann umsetzen |
| `/goal` | Arbeitet so lange weiter, bis ein übergeordnetes Ziel erfüllt ist |

## Struktur

```text
claude/
├── README.md
├── .claude/
│   ├── CLAUDE.md
│   ├── agents.md
│   ├── andrej_karpathy_CLAUDE.md
│   ├── hooks.md
│   ├── rules/
│   └── settings.json
└── templates/
    └── CLAUDE.project.md
```

## Kerndateien

| Datei | Zweck |
|---|---|
| [`./.claude/CLAUDE.md`](./.claude/CLAUDE.md) | Einstieg und Paketkonventionen |
| [`./.claude/agents.md`](./.claude/agents.md) | Workflow-Hinweise und Rollentrennung |
| [`./.claude/hooks.md`](./.claude/hooks.md) | Hook-Referenz und Windows-Hinweise |
| [`./.claude/settings.json`](./.claude/settings.json) | Auto-Compact ab 75 % und weitere Settings |
| [`./.claude/andrej_karpathy_CLAUDE.md`](./.claude/andrej_karpathy_CLAUDE.md) | Referenz, nicht die Kopiervorlage |
| [`./templates/CLAUDE.project.md`](./templates/CLAUDE.project.md) | Schlanke Startvorlage für projektspezifische Claude-Regeln |

## `agents.md` in diesem Ordner

[`./.claude/agents.md`](./.claude/agents.md) beschreibt, wie Aufgaben und Rollen hier grob getrennt werden.
Wenn du die Datei in ein Projekt übernimmst, passe sie an deine echten Agenten, Namen und Abläufe an.
Das geht per Agent oder von Hand.

## Auto-Compact

[`./.claude/settings.json`](./.claude/settings.json) setzt Auto-Compact fest auf **75 %**.
