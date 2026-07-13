# Cursor Setup

> Dieser Ordner enthält das Cursor-Setup.
> Wenn eine Aufgabe noch unklar ist, erst planen und dann implementieren.
> Dieses Setup ist für **Windows 11** gedacht.

## Installation

1. [Cursor](https://cursor.com/download) installieren
2. [`.cursor/rules/ponytail.mdc`](./.cursor/rules/ponytail.mdc) ins Projektroot kopieren (oder global unter `~/.cursor/rules/` ablegen)
3. Optional: [`../agents/main.md`](../agents/main.md) als Rollenreferenz nutzen

## Ponytail

> Makes your AI agent think like the laziest senior dev in the room. The best code is the code you never wrote.

Ponytail ist eine Always-on-Regel für minimalen, notwendigen Code. Du zeigst fünfzig Zeilen — der Agent ersetzt sie durch eine.

Die Regeldatei stammt aus [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (`.cursor/rules/ponytail.mdc`). Kurzfassung:

**Vor dem Schreiben** stoppt der Agent an der ersten Leiter-Sprosse, die trägt:

1. Braucht das überhaupt Code? (YAGNI)
2. Gibt es das schon im Repo? → wiederverwenden
3. Stdlib? → nutzen
4. Native Plattform-Feature? → nutzen
5. Installierte Dependency? → nutzen
6. Geht es in einer Zeile? → eine Zeile
7. Erst dann: das Minimum, das funktioniert

**Nicht faul bei:** Verstehen des Problems, Validierung an Trust Boundaries, Fehlerbehandlung gegen Datenverlust, Security, Accessibility, explizit angefragte Anforderungen.

Cursor lädt die Always-on-Regel automatisch. Slash-Commands wie `/ponytail-review` gibt es in Cursor nicht — dafür Pi oder Claude Code mit dem Ponytail-Package nutzen.

## Modell-Defaults

| Bereich | Empfehlung |
|---|---|
| Standard-Modell | **Claude Opus 4.8** (`claude-opus-4-8`) |
| GPT-Fallback | `gpt-5.6-sol` mit Denktiefe **medium** — höher meist unnötig |

In Cursor: **Settings → Models** → Claude Opus 4.8 als Default setzen.

## Struktur

```text
cursor/
├── README.md
├── AGENTS.md
└── .cursor/
    └── rules/
        └── ponytail.mdc
```

## Kerndateien

| Datei | Zweck |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Regeln für den Cursor-Bereich |
| [`.cursor/rules/ponytail.mdc`](./.cursor/rules/ponytail.mdc) | Ponytail Always-on-Regel (aus GitHub) |
