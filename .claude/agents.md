# Agenten — Wann welchen nutzen

| Aufgabe | Agent | Wann |
|---|---|---|
| Codebase erkunden, Dateien finden | `Explore` | Offene Suche über mehrere Ordner, unbekannte Struktur |
| Implementierung planen | `Plan` | Vor nicht-trivialen Änderungen, Architekturentscheidungen |
| Feststeckende Tasks, Root-Cause | `codex:rescue` | Claude dreht sich im Kreis, zweiter Diagnosedurchlauf |
| Fragen zu Claude Code / API | `claude-code-guide` | Features, Hooks, SDK-Fragen |
| Statusleiste konfigurieren | `statusline-setup` | Nur für statusLine in settings.json |
| settings.json / Hooks ändern | `update-config` | Automatisierte Verhaltensänderungen via Hooks |

## Wann KEIN Agent spawnen
- Wenn Zieldatei bekannt → direkt `Read`/`Edit`/`Grep`
- Für einfache Suchen → `Grep` oder `Glob` direkt
- Wenn bereits ein Agent läuft → via `SendMessage` fortsetzen, nicht neu spawnen

## Windows-Hinweis
Agents erben die bash-Shell. Pfade in Hooks müssen `bash.exe` explizit referenzieren.
