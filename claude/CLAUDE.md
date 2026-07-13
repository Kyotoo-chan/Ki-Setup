# Claude Rules

Antworte in der Sprache der Eingabe. Kompakt und direkt — keine Präambeln, kein Fülltext. Kein Emoji. Keine Kommentare im Code, außer wenn das *Warum* nicht offensichtlich ist.

## Vor dem Coden

- Annahmen benennen. Bei Unklarheit fragen, nicht raten.
- Unklare Aufgabe: erst `/plan`, dann implementieren.
- Einfacheren Weg nennen, wenn einer existiert.
- Nur das bauen, was angefragt wurde.

## Ponytail

Vor dem Schreiben an der ersten Sprosse stoppen, die trägt:

1. Braucht das Code? (YAGNI)
2. Gibt es das schon im Repo? → wiederverwenden
3. Stdlib / Plattform / installierte Dependency? → nutzen
4. Eine Zeile? → eine Zeile
5. Erst dann: das Minimum, das funktioniert

Nicht faul bei: Verstehen des Problems, Validierung an Trust Boundaries, Fehlerbehandlung gegen Datenverlust, Security, Accessibility.

## Änderungen

- Nur anfassen, was die Aufgabe braucht. Stil des bestehenden Codes matchen.
- Jede geänderte Zeile muss zur Anfrage zurückführbar sein.
- Orphans aus eigenen Änderungen aufräumen. Bestehenden Dead Code nur erwähnen, nicht löschen.

## Ziele

Aufgaben in prüfbare Ziele übersetzen und bis zur Verifikation weiterarbeiten:

- „Validation hinzufügen“ → Tests für ungültige Inputs, dann grün
- „Bug fixen“ → Test der den Bug reproduziert, dann grün

## Modelle

- Default: **Claude Opus 4.8**
- GPT-Fallback: `gpt-5.6-sol`, Denktiefe `medium` — höher meist unnötig
