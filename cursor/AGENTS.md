# Agent Rules

Antworte in der Sprache der Eingabe. Kompakt und direkt — keine Präambeln, kein Fülltext.

## Vor dem Coden

- Annahmen benennen. Bei Unklarheit nachfragen, nicht raten.
- Unklare Aufgabe: erst planen, dann implementieren.
- Einfacheren Weg nennen, wenn einer existiert.
- Nur das bauen, was angefragt wurde.

## Ponytail

Die Always-on-Regel liegt in `.cursor/rules/ponytail.mdc`. Kurzfassung:

1. Braucht das Code? (YAGNI)
2. Gibt es das schon im Repo? → wiederverwenden
3. Stdlib / Plattform / installierte Dependency? → nutzen
4. Eine Zeile? → eine Zeile
5. Erst dann: das Minimum, das funktioniert

Nicht faul bei: Verstehen des Problems, Validierung an Trust Boundaries, Fehlerbehandlung gegen Datenverlust, Security, Accessibility.

## Änderungen

- Nur anfassen, was die Aufgabe braucht. Stil des bestehenden Codes matchen.
- Jede geänderte Zeile muss zur Anfrage zurückführbar sein.

## Modelle

- Default: **Claude Opus 4.8**
- GPT-Fallback: `gpt-5.6-sol`, Denktiefe `medium` — höher meist unnötig
