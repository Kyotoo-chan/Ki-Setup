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
4. [`./.claude/andrej_karpathy_CLAUDE.md`](./.claude/andrej_karpathy_CLAUDE.md) nur als Referenz nutzen

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
| [`./.claude/CLAUDE.md`](./.claude/CLAUDE.md) | Einstieg und Paketkonventionen |
| [`./.claude/settings.json`](./.claude/settings.json) | Auto-Compact ab 75 % und weitere Settings |
| [`./.claude/andrej_karpathy_CLAUDE.md`](./.claude/andrej_karpathy_CLAUDE.md) | Referenz, nicht die Kopiervorlage |
| [`./templates/CLAUDE.project.md`](./templates/CLAUDE.project.md) | Schlanke Startvorlage für projektspezifische Claude-Regeln |

## Auto-Compact

[`./.claude/settings.json`](./.claude/settings.json) setzt Auto-Compact fest auf **75 %**.
