# Hooks — Referenz

## Events (relevanteste)
| Event | Trigger | Typischer Einsatz |
|---|---|---|
| `PostToolUse` | Nach erfolgreichem Tool | Formatter, Linter, Tests |
| `PreToolUse` | Vor Tool-Ausführung | Blockieren, Logging |
| `Stop` | Claude hört auf | Benachrichtigung, Cleanup |
| `PreCompact` | Vor Kontextkomprimierung | Wichtige Infos sichern |
| `SessionStart` | Session-Beginn | Env-Check, Welcome |

## Windows-Besonderheiten
```json
{
  "type": "command",
  "command": "bash.exe -c \"<befehl>\""
}
```
Oder Skript-Datei:
```json
{
  "type": "command",
  "command": "bash.exe C:\\Users\\benti\\.claude\\mein-hook.sh"
}
```
PowerShell als Alternative:
```json
{ "type": "command", "command": "pwsh -Command \"...\"", "shell": "powershell" }
```

## Stdin-JSON (PostToolUse)
```json
{
  "tool_name": "Write",
  "tool_input": { "file_path": "/pfad/zur/datei" },
  "tool_response": { "success": true }
}
```

## Kurzpattern: Datei nach Write formatieren
```json
{
  "PostToolUse": [{
    "matcher": "Write|Edit",
    "hooks": [{
      "type": "command",
      "command": "bash.exe -c \"jq -r '.tool_input.file_path // empty' | { read -r f; [ -n \\\"$f\\\" ] && prettier --write \\\"$f\\\"; } 2>/dev/null || true\""
    }]
  }]
}
```

## Scope
- Global (`~/.claude/settings.json`) → gilt für alle Projekte
- Projekt (`.claude/settings.json`) → nur dieses Repo, wird committed
- Lokal (`.claude/settings.local.json`) → persönlich, in .gitignore
