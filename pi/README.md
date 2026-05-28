# Pi Setup

> Dieser Ordner ist nur für Pi.
> Wenn eine Umsetzung unklar ist, erst `/plan` nutzen und den Weg klären.
> Ab **75 %** Kontextauslastung wird automatisch kompaktiert.

Dieses Setup ist für **Windows 11** gedacht und braucht eine [Node.js](https://nodejs.org/dist/v24.15.0/node-v24.15.0-x64.msi)-Installation.

## Installation

```bash
npm install -g @mariozechner/pi-coding-agent
pi
/login
```

Passenden Provider auswählen und dann **nicht** den Link per `strg+klick` **öffnen**.
Stattdessen den Link kopieren und im Browser **händisch alle Leerzeichen entfernen**.

## `AGENTS.md` in diesem Ordner

[`AGENTS.md`](./AGENTS.md) beschreibt die Regeln für den allgemeinen Pi-Bereich.
Wenn du die Datei in ein Projekt übernimmst, passe sie an das Projekt an.
Die geteilten Rollenprofile liegen zusätzlich in [`../agents/main.md`](../agents/main.md).

## Kerndateien

| Datei | Zweck |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Regeln für das allgemeine Pi-Setup |
| [`extensions/planmode.ts`](./extensions/planmode.ts) | Plan Mode mit strukturierten Rückfragen |
| [`extensions/usage-footer.ts`](./extensions/usage-footer.ts) | Footer, Auto-Compact und `/reset` |
| [`extensions/model-selector.ts`](./extensions/model-selector.ts) | Modellwahl und Denktiefe |

## Eigene Pi-Befehle

Ein Teil dieser Befehle wurde bewusst ergänzt, weil der Workflow aus Claude im Alltag praktisch ist.

| Befehl | Funktion | Quelle |
|---|---|---|
| `/btw` | Schneller Zusatzhinweis oder Kontext-Einwurf | [`extensions/btw.ts`](./extensions/btw.ts) |
| `/plan` | Erst planen, dann implementieren; `.pi/plan.md` wird nach Freigabe und dem nächsten Implementierungs-Lauf automatisch gelöscht | [`extensions/planmode.ts`](./extensions/planmode.ts) |
| `/reset` | Zeigt Reset-Zeiten des aktuellen Providers | [`extensions/usage-footer.ts`](./extensions/usage-footer.ts) |
| `/model` | Modellwechsel mit Auswahl der Denktiefe | [`extensions/model-selector.ts`](./extensions/model-selector.ts) |

Zusätzliche Shortcuts:

- `Shift+Tab` wechselt den Thinking Mode
- `Ctrl+P` schaltet den Plan Mode um
- `Ctrl+O` klappt Plan-Nachrichten im Verlauf auf

## Auto-Compact

[`extensions/usage-footer.ts`](./extensions/usage-footer.ts) kompaktiert ab **75 %** Kontextauslastung automatisch.

## Eigene Extensions nutzen

Die Dateien unter [`extensions/`](./extensions/) kannst du nach:

- `~/.pi/agent/extensions/`
- `.pi/extensions/`

kopieren und danach mit `/reload` neu laden.

## Modell- und Denktiefen-Strategie

- Standard-Denktiefe: meist `medium`, manchmal `high`
- Standard-Modell für normales Coding: aktuelles Sonnet oder ein gutes GPT-Modell der Vorgängergeneration
- Für sehr komplexe Aufgaben: aktuelles Opus oder aktuelles GPT
