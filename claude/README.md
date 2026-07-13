# Claude-only Setup

> Dieser Ordner ist nur für Claude.
> Dieses Setup ist für **Windows 11** gedacht.
> Wenn eine Umsetzung unklar ist, erst mit `/plan` planen und dann umsetzen.
> Auto-Compact läuft ab **75 %**.

## Installation

PowerShell:

```powershell
irm https://claude.ai/install.ps1 | iex
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude" | Out-Null
Copy-Item -Recurse -Force "claude\.claude\*" "$env:USERPROFILE\.claude\"
Copy-Item -Force "claude\CLAUDE.md" ".\CLAUDE.md"
```

CMD:

```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

`CLAUDE.md` ins Projektroot kopieren (siehe PowerShell oben). [`./.claude/andrej_karpathy_CLAUDE.md`](./.claude/andrej_karpathy_CLAUDE.md) nur als Referenz nutzen.

## Bewusst nicht im Repo

- Agent-Workflows und Rollenaufteilungen
- Hooks
- projektspezifische Stilregeln

Diese Dinge sind meist persönlich oder projektabhängig und sollten lokal oder direkt im Zielprojekt gepflegt werden.

## Wichtige Claude-Befehle

| Befehl | Kurz |
|---|---|
| `/plan` | Erst den Weg klären, dann umsetzen |
| `/goal` | Arbeitet so lange weiter, bis ein übergeordnetes Ziel erfüllt ist |

## Struktur

```text
claude/
├── README.md
├── CLAUDE.md
├── .claude/
│   ├── CLAUDE.md
│   ├── andrej_karpathy_CLAUDE.md
│   └── settings.json
└── templates/
    └── CLAUDE.project.md
```

## Kerndateien

| Datei | Zweck |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Agent-Regeln zum Kopieren ins Projektroot |
| [`./.claude/settings.json`](./.claude/settings.json) | Auto-Compact ab 75 % und weitere Settings |
| [`./.claude/andrej_karpathy_CLAUDE.md`](./.claude/andrej_karpathy_CLAUDE.md) | Referenz, nicht die Kopiervorlage |
| [`./templates/CLAUDE.project.md`](./templates/CLAUDE.project.md) | Ältere Vorlage; [`CLAUDE.md`](./CLAUDE.md) bevorzugen |

## Auto-Compact

[`./.claude/settings.json`](./.claude/settings.json) setzt Auto-Compact fest auf **75 %**.
