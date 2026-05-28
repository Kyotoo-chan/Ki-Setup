# Claude-only Paket

## Stil

- Antworte in der Sprache der Eingabe
- Kompakt und direkt — keine Präambeln, kein Fülltext
- Kein Emoji
- Keine Kommentare im Code außer wenn das *Warum* nicht offensichtlich ist

## Dateien in diesem Paket

| Pfad | Inhalt |
|---|---|
| `.claude/CLAUDE.md` | Einstieg und Paketkonventionen |
| `.claude/settings.json` | autocompact 75%, BASH_MAX_OUTPUT_LENGTH 150000 |
| `.claude/andrej_karpathy_CLAUDE.md` | Karpathy-inspirierte Referenz, nicht als Projektvorlage gedacht |
| `../templates/CLAUDE.project.md` | Schlanke Startvorlage zum Kopieren in Projektroots |

## Konventionen

- `settings.json` immer mit `jq . <file>` validieren vor Commit
- Projektvorlagen bleiben in `../templates/`, Referenzen in `.claude/`
- Persönliche Hooks, Agent-Workflows und Stilregeln gehören nicht in dieses Paket
