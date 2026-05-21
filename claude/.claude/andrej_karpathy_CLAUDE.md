<!-- Karpathy-inspirierte Referenz. Nicht als Standardvorlage kopieren. -->

# Andrej Karpathy inspired CLAUDE.md reference

## Zweck

Diese Datei ist bewusst **keine** 1:1-Kopiervorlage.

- Die eigentliche Projektvorlage liegt in [`../templates/CLAUDE.project.md`](../templates/CLAUDE.project.md)
- Diese Datei sammelt die zugrunde liegenden Arbeitsprinzipien in kompakter Referenzform
- Projektspezifische Regeln gehören in die Projekt-`CLAUDE.md`, nicht hier hinein

## Unterschied zur Template-Datei

| Datei | Einsatz |
|---|---|
| `../templates/CLAUDE.project.md` | Minimale Startvorlage zum Kopieren ins Projekt |
| `./andrej_karpathy_CLAUDE.md` | Referenz für Arbeitsweise, Review und Selbstkontrolle |

## Core operating principles

### 1. Think Before Coding
- State assumptions explicitly.
- Ask when something is unclear.
- Surface tradeoffs instead of guessing.
- Prefer the simpler path when it solves the task.

### 2. Simplicity First
- Write the minimum code that solves the problem.
- Avoid speculative abstractions.
- Don't add flexibility that was not requested.
- If the solution feels too large, shrink it.

### 3. Surgical Changes
- Touch only the lines required for the task.
- Match the surrounding style.
- Remove only the dead code your change created.
- Mention unrelated issues instead of fixing them opportunistically.

### 4. Goal-Driven Execution
- Define success before editing.
- Prefer tests or reproducible checks.
- For multi-step tasks, keep a short plan with a verification step per item.
- Iterate until the checks pass.

## Quick self-check
- Did I ask instead of assume?
- Is this the simplest solution that works?
- Can every changed line be justified by the request?
- Did I verify the result?
