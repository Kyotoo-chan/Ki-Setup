# Claude-only Setup

Dieser Ordner ist bewusst vom Rest des Repos getrennt.

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
│   ├── settings.json
│   └── rules/
│       └── code-style.md
└── templates/
    └── CLAUDE.project.md
```

---

## Kerndateien

| Datei | Zweck |
|---|---|
| [`./.claude/CLAUDE.md`](./.claude/CLAUDE.md) | Einstieg für den Claude-Teil |
| [`./.claude/agents.md`](./.claude/agents.md) | Kurze Workflow-Hinweise |
| [`./.claude/hooks.md`](./.claude/hooks.md) | Hook-Referenz und Windows-Hinweise |
| [`./.claude/andrej_karpathy_CLAUDE.md`](./.claude/andrej_karpathy_CLAUDE.md) | Behaltene Referenzvorlage |
| [`./templates/CLAUDE.project.md`](./templates/CLAUDE.project.md) | Startvorlage für projektspezifische Claude-Regeln |

---

## Hinweis

Das allgemeine Pi-Setup liegt getrennt unter [`../pi/`](../pi/).
Geteilte Agent-Profile liegen zusätzlich unter [`../agents/`](../agents/).
