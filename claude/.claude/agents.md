# Agenten und Workflows

Diese Datei beschreibt die bevorzugte Arbeitsaufteilung im Claude-only-Teil dieses Repos.

Wenn deine konkrete Claude-Umgebung andere Namen für Agenten, Skills oder Kommandos nutzt, übernimm die Intention statt blind die Bezeichnung.

| Aufgabe | Bevorzugter Workflow |
|---|---|
| Codebase erkunden, Dateien finden | Erst direkt lesen oder suchen; nur bei breiter, unklarer Suche einen separaten Explore-Workflow nutzen |
| Nicht-triviale Änderungen planen | Vor der Umsetzung erst eine saubere Plan-/Entwurfsphase machen |
| Root-Cause bei festgefahrenen Tasks | Einen zweiten Diagnose-/Review-Pass getrennt vom ersten Versuch fahren |
| Fragen zu Claude-Konfiguration | Zuerst `settings.json`, `hooks.md` und diese Paketdoku lesen |
| Hooks oder Settings ändern | Kleiner Scope, klarer Testpfad, keine unnötigen Nebenänderungen |

## Wann kein separater Workflow nötig ist

- Wenn die Zieldatei bekannt ist
- Für einfache Ein-Datei-Änderungen
- Für direkte Lese-/Suchschritte ohne zusätzliche Rollenlogik

## Trennung zum Rest des Repos

- Das allgemeine Pi-Setup steht in [`../../pi/README.md`](../../pi/README.md).
- Die geteilten Agent-Profile liegen in [`../../agents/`](../../agents/).
- Dieser Ordner bleibt Claude-only.
