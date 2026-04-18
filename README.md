# ki-setup — Claude Code Blueprint

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

## Struktur

```
ki-setup/
├── .claude/
│   └── settings.json       # Autocompact + Bash-Output-Limit
├── CLAUDE.md               # Globale Claude-Direktiven (Stil, Skills)
├── templates/
│   └── CLAUDE.project.md   # Karpathy-Guidelines als Projekt-Template
└── README.md
```

---

## Plugins

### Codex
Repo: [github.com/openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc)  
Voraussetzung: [Node.js ≥ 18.18](https://nodejs.org/en/download) + ChatGPT-Abo oder OpenAI API Key

```
/plugin install codex@openai-codex
/codex:setup
```

| Befehl | Funktion |
|---|---|
| `/codex:review` | Code-Review via Codex |
| `/codex:adversarial-review` | Kritisches Review |
| `/codex:rescue` | Task an Codex delegieren |
| `/codex:status` | Status laufender Tasks |
| `/codex:result` | Ergebnis abrufen |
| `/codex:cancel` | Task abbrechen |

### Weitere Plugins (aus `/plugin`)
`frontend-design` · `firecrawl` · `codereview` · `security-guidance`

---

## Settings (`.claude/settings.json`)

| Key | Wert | Effekt |
|---|---|---|
| `autocompact_percentage_override` | `75` | Komprimierung bei 75% Kontextauslastung |
| `BASH_MAX_OUTPUT_LENGTH` | `150000` | Längere Bash-Outputs ohne Abschneiden |

---

## Neues Projekt einrichten

1. `templates/CLAUDE.project.md` → in Projektroot als `CLAUDE.md` kopieren
2. Projektspezifischen Kontext ergänzen (Stack, Konventionen, wichtige Pfade)

---

## Tools

- **Obsidian + graphify** — [github.com/safishamsi/graphify](https://github.com/safishamsi/graphify)  
  Verwandelt Repo in `.md`-Dateien für token-effiziente Verarbeitung
- **Awesome Design MD** — [github.com/VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)

# Anitgravity
[Antigravity Download Link](https://antigravity.google/download)
