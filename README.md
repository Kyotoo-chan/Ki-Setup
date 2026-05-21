# Agentic Coding Setup

Dieses Repo ist in zwei Teile getrennt:

- [`pi/`](./pi/) für das allgemeine Pi-Setup
- [`claude/`](./claude/) für das Claude-only Setup

---

## Schnellstart

```bash
git clone https://github.com/Kyotoo-chan/Ki-Setup.git
cd Ki-Setup
```

---

## Installation je nach Bereich

### Pi

```bash
npm install -g @mariozechner/pi-coding-agent
pi
/login
```

Passenden Provider auswählen und dann **nicht** den Link per `strg+klick` **öffnen**.  
Stattdessen den Link kopieren und im Browser **händisch alle Leerzeichen entfernen**.

### Claude Code

PowerShell
```powershell
irm https://claude.ai/install.ps1 | iex
```

CMD
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

Danach je nach Bedarf weiter in:

- [`pi/README.md`](./pi/README.md)
- [`claude/README.md`](./claude/README.md)

---

## Repo-Struktur

```text
Ki-Setup/
├── agents/   ← Geteilte Agent-Profile
├── pi/       ← Allgemeines Pi-Setup
├── claude/   ← Eigenständiges Claude-only Setup
└── README.md
```

---

## Einstieg

| Bereich | Zweck |
|---|---|
| [`pi/README.md`](./pi/README.md) | Allgemeines Setup und Extensions |
| [`claude/README.md`](./claude/README.md) | Kompaktes Setup nur für Claude |
| [`agents/main.md`](./agents/main.md) | Geteilte Agent-Profile für beide Bereiche |
