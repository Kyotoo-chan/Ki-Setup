# Pi Setup

> Dieser Ordner enthält das Pi-Setup.
> Wenn eine Aufgabe noch unklar ist, erst `/plan` nutzen. So werden Ziel, Vorgehen und Risiken geklärt, bevor Dateien geändert werden.
> Strukturierte Rückfragen laufen über `@juicesharp/rpiv-ask-user-question`, damit Entscheidungen nicht in Fließtext untergehen.
> Ab **75 %** Kontextauslastung wird automatisch kompaktiert, damit lange Sessions nutzbar bleiben.

Dieses Setup ist für **Windows 11** gedacht und braucht eine [Node.js](https://nodejs.org/dist/v24.15.0/node-v24.15.0-x64.msi)-Installation.

## Installation

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
pi
/login
```

Passenden Provider auswählen. Den Login-Link nicht per `strg+klick` öffnen, sondern kopieren und im Browser die Leerzeichen entfernen. So landet der OAuth-Link sauber im Browser.

Danach die in diesem Setup verwendeten Packages installieren:

```bash
pi install npm:pi-claude-style-tools
pi install npm:context-mode
pi install npm:pi-web-access
pi install npm:@juicesharp/rpiv-ask-user-question
pi install npm:@juicesharp/rpiv-todo
pi install npm:pi-subagents
pi install npm:@dietrichgebert/ponytail
```

Extensions und Settings kopieren (PowerShell, aus dem Repo-Root):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.pi\agent\extensions" | Out-Null
Copy-Item -Recurse -Force "pi\extensions\*" "$env:USERPROFILE\.pi\agent\extensions\"
Copy-Item -Force "pi\settings.json" "$env:USERPROFILE\.pi\agent\settings.json"
```

Optional [`AGENTS.md`](./AGENTS.md) ins Projektroot kopieren.

Nach Package-Änderungen Pi einmal neu starten oder `/reload` ausführen.

## Kerndateien

| Datei | Zweck |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Agent-Regeln zum Kopieren ins Projektroot |
| [`extensions/planmode.ts`](./extensions/planmode.ts) | Plan Mode; nutzt bei Bedarf `ask_user_question` aus `@juicesharp/rpiv-ask-user-question` |
| [`extensions/usage-footer.ts`](./extensions/usage-footer.ts) | Footer, Auto-Compact und `/reset` |
| [`extensions/model-selector.ts`](./extensions/model-selector.ts) | Modellwahl und Denktiefe |
| [`extensions/btw.ts`](./extensions/btw.ts) | Zusatzhinweis für den laufenden Task |
| [`settings.json`](./settings.json) | Empfohlene Modell-Defaults und Package-Liste für `~/.pi/agent/settings.json` |

## Verwendete Pi-Packages

| Package | Zweck |
|---|---|
| `pi-claude-style-tools` | Claude-Code-artige Tool-Darstellung und Vorschauen in Pi |
| `context-mode` | Zusätzliche `ctx_*`-Tools für Kontextschonung, Analyse, Suche und Dokumenten-/Output-Verarbeitung |
| `pi-web-access` | Websuche, URL-Fetching, GitHub-Cloning, PDF- und Video-Analyse |
| `@juicesharp/rpiv-ask-user-question` | Strukturiertes Rückfrage-Tool `ask_user_question` mit auswählbaren Optionen |
| `@juicesharp/rpiv-todo` | `todo`-Tool plus `/todos`; kann vom Modell selbst für Mehrschritt-Aufgaben genutzt werden |
| `pi-subagents` | Delegation an Subagenten mit Chains, Parallel-Läufen und gespeicherten Workflows |
| `@dietrichgebert/ponytail` | Lazy-Senior-Dev-Modus mit `/ponytail`-Befehlen und Always-on-Regeln |

## Lokale Pi-Befehle

Diese Befehle ergänzen Pi um schnelle Alltagsfunktionen: planen, Kontext nachreichen, Modell wechseln und Limits prüfen.

| Befehl | Funktion | Quelle |
|---|---|---|
| `/btw` | Schneller Zusatzhinweis oder Kontext-Einwurf | [`extensions/btw.ts`](./extensions/btw.ts) |
| `/plan` | Erst planen, dann implementieren; `.pi/plan.md` wird nach Freigabe und dem nächsten Implementierungs-Lauf automatisch gelöscht | [`extensions/planmode.ts`](./extensions/planmode.ts) |
| `/reset` | Zeigt Reset-Zeiten des aktuellen Providers | [`extensions/usage-footer.ts`](./extensions/usage-footer.ts) |
| `/model` | Modellwechsel mit Auswahl der Denktiefe | [`extensions/model-selector.ts`](./extensions/model-selector.ts) |

## Wichtige Package-Tools und -Befehle

| Tool/Befehl | Funktion | Quelle |
|---|---|---|
| `ask_user_question` | Lässt Pi strukturierte Rückfragen mit Optionen und Freitext stellen | `@juicesharp/rpiv-ask-user-question` |
| `todo` | Aufgabenliste für Mehrschritt-Arbeit; kann vom Modell selbst gepflegt werden | `@juicesharp/rpiv-todo` |
| `/todos` | Zeigt die aktuelle Todo-Liste an | `@juicesharp/rpiv-todo` |
| `ctx_*` | Kontextsparende Analyse-, Such- und Ausführungs-Tools | `context-mode` |
| `web_search` | Websuche mit Fallback-Kette (Exa, OpenAI, Brave, …) | `pi-web-access` |
| `fetch_content` | URL-Fetch, GitHub-Clone, PDF- und Video-Analyse | `pi-web-access` |
| `subagent` | Aufgaben an fokussierte Child-Sessions delegieren | `pi-subagents` |
| `/ponytail` | Intensität des Ponytail-Modus setzen (`lite`, `full`, `ultra`, `off`) | `@dietrichgebert/ponytail` |
| `/ponytail-review` | Diff auf Over-Engineering prüfen | `@dietrichgebert/ponytail` |

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

Package-basierte Erweiterungen werden mit `pi install ...` installiert. Dadurch landen Abhängigkeiten und Befehle an der richtigen Stelle und bleiben über `/reload` nutzbar.

## Modell- und Denktiefen-Strategie

| Rolle | Modell | Denktiefe |
|---|---|---|
| GPT-Default | `gpt-5.6-sol` | `medium` — höher meist unnötig |
| Anthropic-Default | `claude-opus-4-8` | `medium` |
| Sehr komplex | aktuelles Opus oder GPT | `high` nur bei Bedarf |

Die Defaults stehen in [`settings.json`](./settings.json) und gehören nach `~/.pi/agent/settings.json`.
