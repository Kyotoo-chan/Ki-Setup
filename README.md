# Agentic Coding Setup

Dieses Coding-Setup ist für **Windows 11** gedacht und benönigt eine [Node.js](https://nodejs.org/dist/v24.15.0/node-v24.15.0-x64.msi)-Installation.  
Seit April werden keine Claude-Subscription Verknüpfungen Drittanbieter bereitgestellt und es werden nur noch extra Api-Keys akzeptiert.

> Das Setup ist Modellunabhängig: alle wichtigen Projektregeln liegen in [`AGENTS.md`](./AGENTS.md) und können Projekt spezifisch erweitert werden.  

---

## Schnellstart

```bash
git clone https://github.com/Kyotoo-chan/Ki-Setup.git
```
```bash
cd Ki-Setup
```
```bash
npm install -g @mariozechner/pi-coding-agent
```
```bash
pi
```
```bash
/login
```
Passenden Provider auswählen und dann **nicht** den link per `strg+klick` **öffnen**!  
Stattdessen den Link kopieren und im Brower **händisch alle Leerzeichen entfernen**.

---

## Repo-Struktur

```
ai-setup/
├── README.md
├── AGENTS.md            ← Regelwerk des Repositorys
├── CLAUDE.md            ← Claude-Variante, verweist auf AGENTS.md
├── agents/              ← Spezialisierte Agent-Profile (backend-, frontend-architect ...)
├── skills/              ← Auto-invokierte Workflows
├── settings/            ← Globale Pi-Settings
└── claude/              ← Optionales Claude-only Kompakt-Setup (genaueres in internen README)
```
Jeder Unterordner hat eine eigene `README.md` mit genaueren Details.

---

## Kerndateien

| Datei | Zweck |
|-------|-------|
| [`AGENTS.md`](./AGENTS.md) | Regelwerk für **alle** Agent innerhalb des Repositorys. |
| [`CLAUDE.md`](./CLAUDE.md) | Claude benötigt eine spezifische Variante. Verweist dabei jedoch nur auf AGENTS.md, damit nichts doppelt gepflegt wird. |

---

## Verknüpfte Tools & Abos

Alle Tools/Abos werden über **Pi** als zentralen Coding-Agenten genutzt.

| Tool | Zweck | Link |
|------|-------|------|
| **Pi Coding Agent** | Haupt-Coding-Agent  | [pi.dev](https://pi.dev) |
| **Claude Modelle** | Anthropic Sonnet/Opus für Code & Reasoning | [claude.ai](https://claude.ai) |
| **ChatGPT Modelle** | OpenAI GPT-Modelle | [chatgpt.com](https://chatgpt.com) |
| **GitHub Copilot** | Zugriff auf alle auf GitHub verfügbaren Modellen  | [github.com/features/copilot](https://github.com/features/copilot) |
| **Awesome Design MD**| Bietet Markdownvorlagen für unterschiedlicheste Webdesigns | [github.com/VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)|

---
Claude oder Codex können auch mittels der folgenden Extensions in **Visual Studio Code**, anstatt eines Terminals, genutzt werden:
- Claude Code for VS Code
- Codex – OpenAI's coding agent
---

## Settings

Folgende Werte sind in meinem Pi-Setup gesetzt:

| Setting | Wert | Zweck |
|---------|------|-------|
| `autocompact_percentage_override` | `75` | Komprimierung bei 75 % Kontextauslastung, um eine bessere Performance des Modells zu gwährleisten und das Contextfenster zu verkleinern  |

Details → [`settings/pi.md`](./settings/pi.md)

---

## Eigene Befehle

Diese Befehle sind standartmäßig nicht Teil von Pi und wurden selbst hinzugefügt. In Claude existieren diese bereits.  

Pi kann, per Chatanfrage, die folgenden zusätzlichen Befehle welche unter [`extentions`](./extentions/) bereitgestellt werden permanent zu den User-Extensions hinzufügen.  
Wobei diese, mit Hilfe von Pi, jederzeit überarbeitet oder entfernt werden können. Diese sind in Claude bereits implementiert und Standard.

| Befehl | Funktion | Quelle |
|--------|----------|--------|
| `/btw` | Schneller Hinweis/Kontext-Einwurf |  [`extentions/btw.ts`](./extentions/btw.ts) |
| `/planmode` | Erst planen, dann implementieren | [`extentions/planmode.ts`](./extentions/planmode.ts) |
| `/model` | Modellwechsel **+ einstellen der Denktiefe** | [`extentions/model-selector.ts`](./extentions/model-selector.ts) |

---

### Modell- & Denktiefen-Strategie

- Als **Standard-Denktiefe** wird `medium` bis manchmal `high` verwendet
- Als **Standard-Modell** wird **Anthropic-Sonnet-(aktuellste Version)** für normales Coding genutzt
- **Anthropic-Opus-(aktuellste Version)** nur bei sehr komplexen Aufgaben wie Architektur-Entscheidungen, schwierige Bugfixes und großen Code-Reviews


## Hinweis zum Ordner `claude/`

[`claude/`](./claude) enthält ein **eigenständiges, kompaktes Setup** speziell für Claude.
Es ist **unabhängig** vom Rest des Repos und nur dann relevant, wenn man ausschließlich mit Claude arbeite möchte.
Eine ausführliche Beschreibung befindet sich unter [`claude/README.md`](./claude/README.md).
