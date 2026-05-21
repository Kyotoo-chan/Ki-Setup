# Claude-only Setup

Dieser Ordner ist bewusst vom Rest des Repos getrennt.

---

## Installation

PowerShell
```powershell
irm https://claude.ai/install.ps1 | iex
```

CMD
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

---

## Empfohlene Nutzung

1. Claude Code installieren
2. Dateien aus [`.claude/`](./.claude/) in dein Claude-Setup übernehmen
3. [`templates/CLAUDE.project.md`](./templates/CLAUDE.project.md) als `CLAUDE.md` ins Projektroot kopieren
4. [`./.claude/andrej_karpathy_CLAUDE.md`](./.claude/andrej_karpathy_CLAUDE.md) nur als Referenz nutzen

---

## Struktur

```text
claude/
├── README.md
├── .claude/
│   ├── CLAUDE.md
│   ├── agents.md
│   ├── andrej_karpathy_CLAUDE.md
│   ├── hooks.md
│   └── settings.json
└── templates/
    └── CLAUDE.project.md
```

---

## Kerndateien

| Datei | Zweck |
|---|---|
| [`./.claude/CLAUDE.md`](./.claude/CLAUDE.md) | Einstieg und Paketkonventionen |
| [`./.claude/agents.md`](./.claude/agents.md) | Kurze Workflow-Hinweise |
| [`./.claude/hooks.md`](./.claude/hooks.md) | Hook-Referenz und Windows-Hinweise |
| [`./.claude/andrej_karpathy_CLAUDE.md`](./.claude/andrej_karpathy_CLAUDE.md) | Karpathy-inspirierte Referenz, nicht die Kopiervorlage |
| [`./templates/CLAUDE.project.md`](./templates/CLAUDE.project.md) | Schlanke Startvorlage für projektspezifische Claude-Regeln |

---

## Hinweis

Das allgemeine Pi-Setup liegt getrennt unter [`../pi/`](../pi/).  
Geteilte Agent-Profile liegen zusätzlich unter [`../agents/`](../agents/).
