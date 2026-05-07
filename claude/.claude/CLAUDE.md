# Stil
- Antworte in der Sprache der Eingabe
- Kompakt und direkt — keine Präambeln, kein Fülltext
- Kein Emoji
- Keine Kommentare im Code außer wenn das *Warum* nicht offensichtlich ist

# Skills — nur nutzen wenn Frage in diese Richtung geht
| Aufgabe | Skill |
|---|---|
| Code-Review, Bugfix | `/code-review:code-review` · `/codex:review` · `/codex:adversarial-review` |
| Task delegieren | `/codex:rescue` |
| Frontend / UI | `/frontend-design` |
| Web-Recherche | `/firecrawl` |

# Dateistruktur
| Pfad | Inhalt |
|---|---|
| `.claude/settings.json` | autocompact 75%, BASH_MAX_OUTPUT_LENGTH 150000 |
| `.claude/rules/code-style.md` | Projekt-Codestil (wird gefüllt) |
| `.claude/agents.md` | Wann welchen Agenten nutzen |
| `.claude/hooks.md` | Hook-Referenz und Windows-Besonderheiten |
| `templates/CLAUDE.project.md` | Karpathy-Guidelines als Startvorlage |
| `~/.claude/statusline-command.sh` | Statusleiste (bash + jq) |

# Konventionen
- `settings.json` immer mit `jq . <file>` validieren vor commit
- Hooks testen: JSON auf stdin pipen, exit-code + Seiteneffekt prüfen
- Templates liegen in `templates/`, nicht in `.claude/`

@.claude/rules/code-style.md
@.claude/agents.md
@.claude/hooks.md
