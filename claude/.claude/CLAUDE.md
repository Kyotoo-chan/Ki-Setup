# Claude-only Paket

## Stil

- Antworte in der Sprache der Eingabe
- Kompakt und direkt — keine Präambeln, kein Fülltext
- Kein Emoji
- Keine Kommentare im Code außer wenn das *Warum* nicht offensichtlich ist

## Dateien in diesem Paket

| Pfad | Inhalt |
|---|---|
| `.claude/settings.json` | autocompact 75%, BASH_MAX_OUTPUT_LENGTH 150000 |
| `.claude/rules/code-style.md` | Platzhalter für projektspezifischen Codestil |
| `.claude/agents.md` | Empfohlene Workflows und Rollentrennung |
| `.claude/hooks.md` | Hook-Referenz und Windows-Besonderheiten |
| `.claude/andrej_karpathy_CLAUDE.md` | Referenzvorlage, bleibt bewusst erhalten |
| `../templates/CLAUDE.project.md` | gepflegte Startvorlage für projektspezifische Regeln |

## Konventionen

- `settings.json` immer mit `jq . <file>` validieren vor commit
- Hooks testen: JSON auf stdin pipen, exit-code + Seiteneffekt prüfen
- Projektvorlagen bleiben in `../templates/`, nicht in `.claude/`
