# Agentic Coding Setup

Dieses Setup ist für **Windows 11** gedacht und benötigt eine [Node.js](https://nodejs.org/dist/v24.15.0/node-v24.15.0-x64.msi)-Installation.

> Das allgemeine Regelwerk liegt in [`AGENTS.md`](./AGENTS.md). Die Agent-Profile werden mit Claude geteilt und liegen unter [`../agents/`](../agents/). Claude-spezifische Dateien liegen getrennt unter [`../claude/`](../claude/).

---

## Schnellstart

```bash
npm install -g @mariozechner/pi-coding-agent
```
```bash
pi
```
```bash
/login
```

Passenden Provider auswählen und dann **nicht** den Link per `strg+klick` **öffnen**.  
Stattdessen den Link kopieren und im Browser **händisch alle Leerzeichen entfernen**.

---

## Repo-Struktur

```text
pi/
├── extensions/          ← Erweiterungen für Pi
├── AGENTS.md            ← Regelwerk für den allgemeinen Bereich
└── README.md
```

---

## Kerndateien

| Datei | Zweck |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Regelwerk für das allgemeine Setup |
| [`../agents/main.md`](../agents/main.md) | Übersicht der geteilten Agent-Profile |
| [`extensions/planmode.ts`](./extensions/planmode.ts) | Plan Mode mit strukturierten Rückfragen |
| [`extensions/usage-footer.ts`](./extensions/usage-footer.ts) | Footer, Auto-Compaction und `/reset` |

---

## Eigene Pi Befehle

| Befehl | Funktion | Quelle |
|---|---|---|
| `/btw` | Schneller Hinweis/Kontext-Einwurf | [`extensions/btw.ts`](./extensions/btw.ts) |
| `/plan` | Erst planen, dann implementieren | [`extensions/planmode.ts`](./extensions/planmode.ts) |
| `/reset` | Zeigt verfügbare Reset-Zeiten des aktuellen Providers | [`extensions/usage-footer.ts`](./extensions/usage-footer.ts) |
| `/model` | Modellwechsel mit Auswahl der Denktiefe | basiert auf [`extensions/model-selector.ts`](./extensions/model-selector.ts) |

Zusätzliche Shortcuts im Setup:

- `Shift+Tab` cycled den Thinking Mode
- `Ctrl+P` schaltet den Plan Mode um
- Plan-Nachrichten erscheinen im Verlauf und lassen sich wie andere Einträge mit `Ctrl+O` expandieren
- `Ctrl+L` öffnet die Modell-Auswahl

---

## Settings

Die Extension [`extensions/usage-footer.ts`](./extensions/usage-footer.ts) kompaktet proaktiv ab **75 %** Kontextauslastung.

---

## Eigene Extensions nutzen

Die Dateien unter [`extensions/`](./extensions/) können nach:

- `~/.pi/agent/extensions/`
- `.pi/extensions/`

kopiert und danach mit `/reload` neu geladen werden.

---

### Modell- & Denktiefen-Strategie

- Als **Standard-Denktiefe** wird `medium` bis manchmal `high` verwendet
- Als **Standard-Modell** wird **Anthropic-Sonnet-(aktuellste Version)** oder **OpenAI GPT-(Vorgängerversion der neuesten Version)** für normales Coding genutzt
- **Anthropic-Opus-(aktuellste Version)** oder **OpenAI GPT-(aktuellste Version)** nur bei sehr komplexen Aufgaben wie Architektur-Entscheidungen, schwierigen Bugfixes und großen Code-Reviews

---

## Hinweis zu den geteilten Agent-Profilen

Die eigentlichen Rollenprofile liegen gemeinsam unter [`../agents/`](../agents/).
Sie können sowohl für Pi als auch für Claude sinnvoll sein.

---

## Hinweis zum Ordner `../claude/`

[`../claude/`](../claude/) enthält ein **eigenständiges Setup** speziell für Claude.
Es ist vom allgemeinen Pi-Teil getrennt und nur dann relevant, wenn man den Claude-Teil separat nutzen möchte.
