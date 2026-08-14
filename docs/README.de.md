<div align="center">
  <img src="../assets/readme/hero.png" width="100%" alt="AgentsHub — ein local-first Workspace für Prompts, Skills und AI-Coding-Assets" />

# AgentsHub

Ein Local-First-Arbeitsbereich für Prompts, Skills und KI-Coding-Assets.

  <br/>

[![GitHub Stars](https://img.shields.io/github/stars/YZhuAndrew/AgentsHub?style=for-the-badge&logo=github&color=yellow)](https://github.com/YZhuAndrew/AgentsHub/stargazers)
[![Downloads](https://img.shields.io/github/downloads/YZhuAndrew/AgentsHub/total?style=for-the-badge&logo=github&color=blue)](https://github.com/YZhuAndrew/AgentsHub/releases)
[![Version](https://img.shields.io/badge/release-v0.7.2_stable-22C55E?style=for-the-badge)](https://github.com/YZhuAndrew/AgentsHub/releases/latest)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue?style=for-the-badge)](../LICENSE)

  <br/>

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)

  <br/>

![macOS](https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-0078D6?style=flat-square&logo=windows&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black)

  <br/>

[简体中文](../README.md) · [繁體中文](./README.zh-TW.md) · [English](./README.en.md) · [日本語](./README.ja.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md)

  <br/>

  <a href="https://github.com/YZhuAndrew/AgentsHub/releases/latest">
    <img src="https://img.shields.io/badge/📥_Herunterladen-Releases-blue?style=for-the-badge&logo=github" alt="Download"/>
  </a>
</div>

<br/>

AgentsHub bündelt deine Prompts, SKILL.md-Dateien und projektbezogenen KI-Coding-Assets in einem lokalen Arbeitsbereich. Es installiert dasselbe Skill in Claude Code, Cursor, Codex, Windsurf, Antigravity und einem Dutzend weiterer Werkzeuge, bietet Versionsverlauf und Multi-Modell-Tests für Prompts, synchronisiert per WebDAV und speichert vollständige Snapshots in selbst gehostetem Web.

Deine Daten bleiben auf deiner Maschine.

---

## Inhalt

- [Download](#install)
- [Screenshots](#screenshots)
- [Funktionen](#features)
- [Erste Schritte](#quick-start)
- [Selbst gehostetes Web](#self-hosted-web)
- [CLI](#cli)
- [Änderungsprotokoll](#changelog)
- [Roadmap](#roadmap)
- [Aus Quellcode](#dev)
- [Repository-Struktur](#project-structure)
- [Mitwirken & Docs](#contributing)
- [Lizenz / Feedback](#meta)

---

<div id="install"></div>

## 📥 Download

Desktop-Builds werden auf GitHub Releases für macOS / Windows / Linux veröffentlicht.

| Plattform | Installationspaket |
| ---- | ------ |
| macOS (Apple Silicon) | [arm64 DMG](https://github.com/YZhuAndrew/AgentsHub/releases/latest) |
| macOS (Apple Silicon) | [zip portabel](https://github.com/YZhuAndrew/AgentsHub/releases/latest) |
| Windows (x64) | [x64 Setup](https://github.com/YZhuAndrew/AgentsHub/releases/latest) |
| Linux | [Releases-Seite](https://github.com/YZhuAndrew/AgentsHub/releases) ansehen |

> **macOS?** Es werden nur Apple-Silicon-Builds (M1/M2/M3/M4) `arm64` veröffentlicht.

### macOS-Sicherheitsprüfung

AgentsHub ist ein Community-gepflegter Fork-Build ohne Apple-Developer-Signierung. Lade ihn über GitHub Releases herunter; macOS Gatekeeper blockiert möglicherweise den ersten Start.

Wenn macOS „AgentsHub ist beschädigt" oder „Entwickler kann nicht überprüft werden" meldet, führe aus:

```bash
sudo xattr -rd com.apple.quarantine /Applications/AgentsHub.app
```

Danach erneut öffnen. Pfad anpassen, wenn die App an einem anderen Ort installiert ist.

<div align="center">
  <img src="./imgs/install.png" width="60%" alt="macOS-Installationswarnung"/>
</div>

### Vorschau-Kanal

Nächste Entwicklungs-Vorschau testen? _Einstellungen → Über_ öffnen und den Vorschau-Kanal aktivieren. Die App prüft dann GitHub Prereleases. Ausschalten kehrt zur Stable zurück; AgentsHub macht keinen automatischen Downgrade von einer neueren Vorschau auf eine ältere Stable.

<div id="screenshots"></div>

## Screenshots

> Die folgenden Screenshots decken alle fünf Desktop-Workspaces ab: Prompt, Skill, MCP, Plugin und Rules.

<div align="center">
  <p><strong>Zwei-Spalten-Home</strong></p>
  <img src="./imgs/1-index.png" width="80%" alt="Hauptansicht"/>
  <br/><br/>
  <p><strong>Skill Store</strong></p>
  <img src="./imgs/10-skill-store.png" width="80%" alt="Skill Store"/>
  <br/><br/>
  <p><strong>Skill-Detail mit Ein-Klick-Installation auf Plattformen</strong></p>
  <img src="./imgs/11-skill-platform-install.png" width="80%" alt="Skill-Plattforminstallation"/>
  <br/><br/>
  <p><strong>MCP-Workspace</strong></p>
  <img src="./imgs/18-mcp-workspace.png" width="80%" alt="MCP-Workspace"/>
  <br/><br/>
  <p><strong>Plugin-Workspace</strong></p>
  <img src="./imgs/19-plugin-workspace.png" width="80%" alt="Plugin-Workspace"/>
  <br/><br/>
  <p><strong>Rules-Workspace</strong></p>
  <img src="./imgs/13-rules-workspace.png" width="80%" alt="Rules-Workspace"/>
  <br/><br/>
  <p><strong>Projekt-Skill-Workspace</strong></p>
  <img src="./imgs/14-skill-projects.png" width="80%" alt="Projekt-Skill-Workspace"/>
  <br/><br/>
  <p><strong>Quick Add (manuell / Analyse / KI-Generierung)</strong></p>
  <img src="./imgs/15-quick-add-ai.png" width="80%" alt="Quick Add"/>
  <br/><br/>
  <p><strong>Aussehen und Motion-Einstellungen</strong></p>
  <img src="./imgs/17-appearance-motion.png" width="80%" alt="Erscheinungseinstellungen"/>
</div>

<div id="features"></div>

## Funktionen

### 📝 Prompt-Verwaltung

- Ordner, Tags, Favoriten mit Drag-Sortierung; volle CRUD-Abdeckung
- Templating mit `{{variable}}`; Kopieren / Testen / Verteilen öffnet ein Formular für die Werte
- Volltextsuche (FTS5), Markdown-Rendering mit Code-Highlighting, Anhänge und Medienvorschau
- Kartenansicht im Desktop unterstützt Doppelklick-Inline-Bearbeitung von User- und System-Prompt

### 🧩 Skill Store und Ein-Klick-Verteilung

- **Skill Store** mit 20+ kuratierten Skills (Anthropic, OpenAI usw.) plus stapelbaren benutzerdefinierten Quellen (GitHub-Repo / skills.sh / lokaler Ordner)
- **Ein-Klick-Installation** für Claude Code, Cursor, Windsurf, Codex, Antigravity, Kiro, Kilo Code, Qoder, QoderWork, CodeBuddy, Trae, OpenCode und 15+ weitere; Gemini bleibt nur als Enterprise- und Paid-API-Kompatibilitätsziel erhalten
- **Lokaler Scan** erkennt vorhandene SKILL.md-Dateien, sodass du nicht mehr zwischen Werkzeugverzeichnissen kopieren musst
- **Symlink- / Copy-Modi** — Symlink für gemeinsame Bearbeitung, Copy für unabhängige Plattformkopien
- **Plattformbezogenes Skill-Verzeichnis-Override** hält Scan und Installation auf demselben Pfad
- **KI-Übersetzung & Politur** auf vollem SKILL.md-Niveau mit Sidecar-Speicherung, Side-by-Side- und Volltextübersetzung
- **Sicherheitsrichtlinie** steuert Inhalts- und KI-Scans bei Installation/Aktualisierung global, je Kanal oder je Store; Pfad-, Archiv-, Symlink-, Größen-, Pflichtdatei- und Fingerprint-Prüfungen bleiben immer aktiv
- **GitHub-Token** für Store- und Repo-Imports reduziert anonymes Rate-Limiting
- **Tag-Filter** für installierte Skills und beim Browsen im Store

### 📐 Rules (KI-Coding-Regeln)

- Ein Ort für `.cursor/rules`, `.claude/CLAUDE.md`, AGENTS.md und Verwandte
- Manuell hinzugefügte Projektregeln nach Verzeichnis gruppiert
- Verbunden mit ZIP-Export, WebDAV, selbst gehosteter Sicherung/Wiederherstellung sowie Web-Import/-Export

### 🤖 Projekt- und Agent-Asset-Workspace

- Scannt typische Projektorte: `.claude/skills`, `.agents/skills`, `skills`, `.gemini` usw.
- Projektbezogene Skill-Workspaces halten den Projektkontext getrennt von der globalen Bibliothek
- Persönliche Bibliothek, lokales Repo und Projekt-Assets in einem Umschalter — kein Hin und Her zwischen Werkzeugverzeichnissen mehr
- Globale Prompt-Tag-Verwaltung: Suchen, Umbenennen, Zusammenführen, Löschen mit Synchronisation zwischen Datenbank und Workspace-Dateien

### 🧪 KI-Test und Generierung

- Eingebauter KI-Test mit den großen globalen und chinesischen Anbietern (OpenAI, Anthropic, Gemini, Azure, eigene Endpoints)
- Gleicher Prompt parallel an mehrere Modelle, Text- und Bildmodelle
- KI-Skill-Generierung, KI-Politur, Quick Add erzeugt jetzt direkt strukturierte Prompt-Entwürfe
- Einheitliche Endpoint-Verwaltung und Verbindungstests; präzise Fehlermeldungen für 504 / Timeout / nicht konfiguriert

### 🕒 Versionierung und Verlauf

- Jede Speicherung eines Prompts erzeugt automatisch eine Version mit Diff-Hervorhebung und Ein-Klick-Rollback
- Skills besitzen einen eigenen Versionsverlauf mit benannten Versionen, Versions-Diff und versionsgenauem Rollback
- Rules-Snapshots können vorab angesehen und in einen Entwurf zurückgesetzt werden
- Vom Store installierte Skills tracken einen Inhalt-Hash, sodass entfernte SKILL.md-Änderungen erkannt und lokale Bearbeitungen vor Konflikten geschützt werden

### 💾 Daten, Sync und Backup

- Local-First: deine Daten liegen standardmäßig auf deiner Maschine
- Vollständige Sicherung / Wiederherstellung im komprimierten `.phub.gz`-Format
- WebDAV-Sync (Jianguoyun, Nextcloud usw.)
- WebDAV- / S3-Live-Sync verwendet genau eine ausgewählte Quelle, um Multi-Writer-Konflikte zu vermeiden
- Selbst gehostetes AgentsHub Web speichert unabhängig unveränderliche Snapshots; Start- und Zeitplan-Jobs laden nur hoch und ziehen oder überschreiben nie lokale Daten
- Desktop- und Web-Version müssen für Backups exakt übereinstimmen; Wiederherstellung erfolgt ausdrücklich und erstellt zuerst einen lokalen Sicherheitssnapshot

### 🔐 Datenschutz und Sicherheit

- Master-Passwort-Schutz für die App, AES-256-GCM-Verschlüsselung
- Private Ordner werden im Ruhezustand verschlüsselt (Beta)
- Plattformübergreifend offline nutzbar: macOS / Windows / Linux
- 7 Oberflächensprachen: 简体中文, 繁體中文, English, 日本語, Deutsch, Español, Français

<div id="quick-start"></div>

## Erste Schritte

1. **Ersten Prompt anlegen.** Auf **+ Neu** klicken, Titel, Beschreibung, System- und User-Prompt eintragen. `{{name}}` wird zur Variable; beim Kopieren oder Testen erscheint ein Formular.

2. **Skills hinzufügen.** Skills-Tab öffnen. Aus dem Store auswählen oder _Lokal scannen_ anklicken, um vorhandene SKILL.md-Dateien zu finden.

3. **In KI-Werkzeuge installieren.** Auf der Skill-Detailseite die Zielplattform wählen. AgentsHub installiert die SKILL.md ins erwartete Verzeichnis der Plattform — als Symlink (Live-Bearbeitung) oder als unabhängige Kopie.

4. **Sync oder Backup (optional).** _Einstellungen → Daten_ konfiguriert WebDAV / S3 für Live-Sync oder eine selbst gehostete AgentsHub-Web-Instanz für unabhängige Wiederherstellungs-Snapshots.

<div id="self-hosted-web"></div>

## Selbst gehostetes Web

AgentsHub Web ist ein leichtgewichtiger Browser-Begleiter, den du per Docker auf einem NAS, VPS oder LAN-Rechner betreiben kannst. Es ist **kein** Managed-Cloud-Service. Einsatzfälle:

- Auf AgentsHub-Daten via Browser zugreifen
- Unveränderliche Desktop-Wiederherstellungs-Snapshots speichern, ohne den aktiven Web-Workspace zu verändern
- Daten innerhalb des eigenen Netzwerks halten

```bash
cd apps/web
cp .env.example .env
docker compose up -d --build
```

In `.env` mindestens setzen:

- `JWT_SECRET`: ≥ 32 zufällige Zeichen
- `ALLOW_REGISTRATION=false`: nach Anlage des ersten Admins ausgeschaltet lassen
- `DATA_ROOT`: Datenwurzel; darunter werden `data/`, `config/`, `logs/`, `backups/` erstellt

Standard: `http://localhost:3871`. Der erste Aufruf landet auf `/setup`; der erste Nutzer wird Administrator.

Desktop verbinden: _Einstellungen → Daten → Self-Hosted AgentsHub_. Version und Backup-Fähigkeit prüfen, Remote-Snapshot erstellen, den neuesten Snapshot ausdrücklich wiederherstellen oder reine Upload-Backups beim Start / nach Zeitplan aktivieren. Automatische Jobs ziehen, mergen oder ersetzen keine lokalen Daten.

Detaillierte Deployment- / Upgrade- / Backup- / GHCR-Image- / Dev-Hinweise in [`web-self-hosted.md`](./web-self-hosted.md).

<div id="cli"></div>

## CLI

Die CLI ist für Scripting, Massen-Import/-Export und Automatisierung gedacht. Die Desktop-App installiert **kein** `prompthub`-Shell-Kommando automatisch; pack und installiere es aus dem Repo:

```bash
pnpm pack:cli
pnpm add -g ./apps/cli/prompthub-cli-*.tgz
prompthub --help
```

Oder ohne Installation aus dem Quellcode laufen lassen:

```bash
pnpm --filter @prompthub/cli dev -- prompt list
pnpm --filter @prompthub/cli dev -- skill scan
```

Ressourcen-Kommandos (jedes akzeptiert `--help`):

```text
prompt    list / get / create / update / delete / duplicate / search
          versions / create-version / delete-version / diff / rollback
          use / copy
          list-tags / rename-tag / delete-tag

folder    list / get / create / update / delete / reorder

agent     list / get / enable / disable
          add / update / configure / reset / delete
          config list|read (schreibgeschuetzt, mit Maskierung geheimer Werte)
          identity get|set

rules     list / scan / read / save / rewrite
          versions / version-read / version-restore / version-delete
          add-project / remove-project
          export / import

skill     list / get / import (Alias: install) / delete / remove
          versions / create-version / rollback / delete-version
          export / scan / scan-safety / sync-from-repo
          platforms / platform-status / distribute / undistribute
          (Aliase: install-md / uninstall-md)
          repo-files / repo-read / repo-write / repo-delete / repo-mkdir / repo-rename

ai        providers / provider-add / provider-delete
          models / model-add / model-delete
          routes / route-set / route-clear

workspace export / import

doctor    database-lock [--recover]
```

Skill-Import, Versions-Snapshots und Verteilung verwenden gemeinsam die eingebauten Ausschlussregeln sowie eine `.prompthubignore` im Paketstamm. Verdächtige private Schlüssel, Zugriffstoken und Passwörter werden vor dem Schreiben blockiert. Erfolgreiche Ausgaben sind standardmäßig begrenzte Zusammenfassungen; vollständige Skill-Inhalte und Datei-Snapshots werden nur mit `--full` ausgegeben.

Häufige globale Flags:

- `--output json|table` — Ausgabeformat
- `--summary` — begrenzte Zusammenfassung ausgeben (Standard)
- `--full` — vollständigen Ressourceninhalt ausgeben
- `--quiet` — stdout bei Erfolg unterdrücken, stderr-Fehler beibehalten
- `--data-dir <path>` — überschreibt das `userData`-Verzeichnis
- `--app-data-dir <path>` — überschreibt die App-Datenwurzel
- `--version|-v` — gibt die CLI-Version aus

<div id="changelog"></div>

## Änderungsprotokoll

Vollständiges Changelog: **[CHANGELOG.md](../CHANGELOG.md)**

### v0.7.2 (2026-08-13, Stable)

- Dauerhaftes Statusleistensymbol: ein neuer optionaler Schalter hält das Menüleisten-/Tray-Symbol auch bei geöffnetem Fenster sichtbar; kombinierbar mit „in Taskleiste minimieren", wirkt sofort

### v0.7.1 (2026-08-13, Stable)

- Upgrade-Backup-Fix: Das Pre-Upgrade-Backup bricht nicht mehr beim ersten symbolischen Link ab (z. B. im Symlink-Modus installierte Skills); interne Links werden bewahrt, austretende Links übersprungen und die /var-Pfadnormalisierung unter macOS korrekt behandelt

### v0.7.0 (2026-08-13, Stable)

- Stapel-Import von Skills: Ein neuer Modus "Stapelimport" installiert mehrere lokale ZIP-Archive (Drag & Drop oder Auswahl) und/oder mehrere GitHub/Git-URLs auf einmal; lokale ZIPs nutzen denselben atomaren Installations-Lebenszyklus wie Remote-Pakete; ZIPs auf My Skills ziehen öffnet den Stapelimport
- Plattformsichtbarkeit mit dem Settings-Schalter vereinheitlicht (Erkennung wird zum Hinweis; copilot/amp zur Reihenfolge hinzugefügt); QwenWork CN-Plattform hinzugefügt; trae-work-cn-Standardwurzel auf ~/.trae-cn korrigiert

### v0.6.2 (2026-08-11, Stable)

- Erweiterte Skill-Listenansicht: Die Listenansicht ist nun die Standardansicht mit einem Tabellenlayout und Spaltenüberschriften (Name + Beschreibung / Quelle / Autor / Version / erstellt / aktualisiert / Plattformstatus / Aktionen), einem Autor-Filter und einer Stapelaktion „alle Updates prüfen" mit Massenaktualisierung ausgewählter Skills
- Git-Import-Fortschritt: Die Installation von Skills aus einem Git-Repository zeigt detaillierten Fortschritt für die Scan- und Importphase (Phasenbezeichnung, `index/total` + Skill-Name, Live-Klon-Prozentsatz) und ersetzt den einzelnen starren Spinner

### v0.6.1 (2026-08-10, Stable)

- Eingebautes QwenWork-Agent-Plattformziel hinzugefügt, sodass Skills direkt dorthin verteilt werden können
- Startverhalten-Einstellungen: Das Hauptfenster öffnet sich beim Start standardmäßig, ein neuer „Startansicht"-Wähler (standardmäßig die zuletzt verwendete) und der automatische Start beim Systemstart

### v0.6.0 (2026-08-09, Stable)

- Erste AgentsHub-Fork-Baseline; Desktop-, CLI-, selbstgehostete Web-, Cloudflare-Worker- und Mobile-Build-Versionen abgestimmt

### v0.5.9 (2026-07-09, Stable)

- Plugin-Management stabilisiert: My Plugins / Plugin Store / Agent Plugin folgen jetzt dem Skill-Stil für Installation, Details, Versions-Snapshots, Source-Update-Prüfung, Batch-Aktionen, Agent-Verteilung und Child Skill / MCP Import
- MCP-Management und Sync erweitert: MCP-Workspace, offizieller Template-Store, Agent-Zielverteilung, Health Checks, selektiver .env-Import, CLI-MCP-Befehle und One-Click-Resync-Design sind konsolidiert
- Vollständiger Agent-Asset-Sync umfasst nun My Skills, My MCP, My Plugins, Rules und zugehörige Daten in Self-hosted Sync und Backup/Restore
- Skill-Source-Updates nutzen SHA-256-Package-Fingerprints und Drei-Wege-Abgleich, inklusive Fixes für Registry-Fingerprints, content-url Baselines und URL-Credential-Redaction
- Plugin-Source-Updates und Store-Batch-Updates zeigen nun Diffs und verlangen Bestätigung, bevor lokale Packages ersetzt werden
- Prompts unterstützen benutzerdefinierte Ausgabeformat-Sequenzen mit Sortierung, Persistenz und Backup
- macOS-Releases dokumentieren die Installation des unsignierten Forks, die DMG/ZIP-Verifikation und den Gatekeeper-Hinweis

### v0.5.9-beta.1 (2026-06-14, Preview)

- MCP-Management-Workspace als Preview: lokale MCP-Bibliothek, offizieller Template-Store, Agent-Zielverteilung, Health Checks, selektiver .env-Import und CLI-MCP-Befehle
- Prompt-Beziehungsbaum und semantische Beziehungen: Drag-to-group für Eltern/Kinder, Auf-/Zuklappen, Elternlabels, Kinderzähler und Beziehungsnavigation in der Detailansicht
- Git-Skill-Import korrigiert: SSH-GitHub-Scans klonen lokal, URL-Änderungen können neu gescannt werden, HTTPS-Rate-Limits empfehlen SSH
- Skill-Bildvorschau unterstützt Mausrad-Zoom, Greifen/Schieben, feste Steuerelemente unten rechts und Vollbildvorschau
- Skill-Versionen starten sichtbar bei v1, und ein Klick auf den Detailtitel kopiert den Skill-Namen

### v0.5.8 (2026-06-04)

- Dedizierter Image-Reverse-Prompt-Workflow mit Vision-Modellen, Vorschau/Kopieren vor dem Speichern und optionalem Referenzbild
- KI-Modellkonfiguration nach Anbietern, Modellfähigkeiten und Business-Routen neu strukturiert
- ClawHub und skill.sh Stores mit Remote-Suche, Kategorien, Paging/Laden, Cache und vollständiger Skill-Paketinstallation ergänzt
- Skill-Lifecycle über My Skills, Project Skills, Agent Skills, Plattformen, copy / symlink, eingebaute Skills und externe Symlinks gehärtet
- Update-Prüfungen für GitHub, Gitea und self-hosted Git sind genauer und ignorieren übliche Cache-Dateien

### v0.5.8-beta.3 (2026-06-02, Vorschau)

- Skill-Dateiansichten nutzen jetzt einen leichten Code-Editor mit Syntax-Highlighting, Zeilennummern, Zeilenumbruch und genaueren Datei-Icons
- Aus GitHub importierte My Skills können jetzt direkt auf der Detailseite Quell-Updates prüfen und vor dem Anwenden einen Versions-Snapshot erstellen
- Cherry Studio, Agent Skills, Project Skills, copy / symlink, built-in Skills und externe Symlink-Zustände wurden weiter gehärtet
- Prompt- / Skill-Versionshistorien nutzen jetzt eine besser durchsuchbare Tabellenansicht

### v0.5.7 (2026-05-29)

- Prompt AI Quick Rewrite ist jetzt als gemeinsamer Dialog in Detailseite, Detailmodal und Kontextmenü verfügbar
- Gleichnamige Skill-Varianten werden jetzt als eigenständige Varianten mit gemeinsamer Identity- und Containerlogik unterstützt
- Backup-Restore, Remote-Git-Scanning und persistente Verifizierungsanzeige im AI Workbench wurden weiter gehärtet

### v0.5.7-beta.2 (2026-05-28, Vorschau)

- Git-Store-Quellen unterstützen jetzt `branch / directory`, Remote-Branch-Vorschläge sowie GitHub / SSH / selbst gehostete Git-Repositories
- Der Import von Projekt-Skills unterstützt jetzt erweiterte `copy / symlink`-Modi mit projektbezogener Präferenzspeicherung
- Agent-Verwaltung und Skill-Plattform-Installation bringen jetzt eingebaute `Kilo Code`-Unterstützung statt `Roo Code`

### v0.5.7-beta.1 (2026-05-26, Vorschau)

- Vereinheitlichtes vollständiges Agent-Konfigurationsmodell für built-in und custom agents mit direkten Overrides für `root / skills / rules / agents / commands / config`
- Neue built-in Presets `Cline` und `Trae CN`; der Rules-Workspace aktualisiert sich sofort nach Agent-Änderungen
- Direkte projektlokale Skill-Verteilung in Agent-Ordner, standardmäßig `.agents/skills`, mit Multi-Target-Auswahl
- Wenn Symlink-Installationen auf Copy zurückfallen, zeigt AgentsHub jetzt explizite Warnungen statt einen normalen Erfolg vorzutäuschen
- Das Inline-Editing im Prompt-Detail öffnet jetzt exakt das doppelt angeklickte Feld und bleibt näher am normalen Detail-Layout

### v0.5.6 (2026-05-12)

**Funktionen**

- 🧭 **Rules-Workspace.** Eine eigenständige Rules-Seite im Desktop, die globale Regeln und manuell hinzugefügte Projektregeln verwaltet — Suche, Snapshot-Vorschau, Restore-to-Draft, ZIP-Export / WebDAV / selbst gehostete Sicherung-Wiederherstellung / Web-Import-Export.
- 📁 **Projekt-Skill-Workspace.** Skill-Workspaces je Projekt, scannt automatisch die üblichen Orte und erlaubt Vorschau / Import / Verteilung im Projektkontext.
- 🤖 **Quick Add erzeugt Prompts per KI.** Zusätzlich zur Analyse vorhandener Prompts kann Quick Add nun aus Zielen und Constraints einen strukturierten Prompt-Entwurf erzeugen.
- 🏷️ **Globale Prompt-Tag-Verwaltung.** Zentrales Suchen / Umbenennen / Zusammenführen / Löschen im Tag-Bereich der Sidebar, synchron mit Datenbank und Workspace-Dateien.
- 🔐 **GitHub-Token für den Skill Store.** Authentifiziertes GitHub-Kontingent reduziert anonyme Rate-Limit-Fehler beim Store- und Repo-Import.

**Korrekturen**

- ✍️ Karten-Detail unterstützt Doppelklick-Bearbeitung für User- und System-Prompts
- 🪟 Flackern des Update-Dialogs, instabiler Download-Button und `minimizeOnLaunch`, das Login-Autostart nicht respektierte
- ↔️ Drei-Spalten-Resize, Doppelklick-Reset, Titel-Umbruch und Store-Suche der Skills wieder geradegerückt
- 🔁 Konsistenz von Rules / Skill-Extras / verwalteten Kopien zwischen ZIP-Export, WebDAV, selbst gehosteter Sicherung-Wiederherstellung und Web-Import/-Export
- 🖼️ Self-hosted Web-Login nutzt jetzt einmalige Bild-CAPTCHAs

**Verbesserungen**

- 🏠 Zwei-Spalten-Home unterstützt stabil Modulsichtbarkeit, Drag-Sortierung und einen unabhängigen Hintergrund-Toggle
- ☁️ Nur eine aktive Sync-Quelle steuert die automatische Synchronisierung, vermeidet Multi-Provider-Schreibkonflikte
- ✨ Vollständiges Motion-System im Desktop-Renderer (duration / easing / scale-Tokens, vier Intent-Komponenten `<Reveal>` `<Collapsible>` `<ViewTransition>` `<Pressable>`, drei Nutzerstufen). framer-motion wurde durch `tailwindcss-animate` ersetzt; der `ui-vendor`-Chunk ging von 54 KB auf 16 KB gzip.
- 🪶 Lange Listen (Skill-Liste / Prompt-Galerie / Kanban / Inline-Prompt-Liste) nutzen jetzt `@tanstack/react-virtual`, der handgebaute `setTimeout`-Chunk-Renderer entfällt.

<div id="roadmap"></div>

## Roadmap

### v0.5.9

- Plugin / MCP Management folgt jetzt der Skill-Erfahrung über Stores, Agent-Verteilung, Details, Tag-Filter, Update-Prüfung und Safety Checks hinweg
- Agent-Asset-Sync, Netzwerkproxy, CLI-Projektinstallationen und Skill-Source-Update-Checks sind stabil
- Prompt-Beziehungsbäume, Windows-Agent-Pfade, Web-Captcha-Schalter, macOS-Signierung/Notarisierung und Release-Pipeline-Fixes erreichen Stable-Nutzer

### v0.5.8

- Image-Reverse-Prompts, Modellanbieter/Fähigkeiten/Routen und Bildtest-Flows sind stabil
- Skill-Lifecycle für Stores, Git, Agents, Projekte, Plattformen, copy / symlink und eingebaute Skills ist konsolidiert
- ClawHub / skill.sh Stores, Update-Prüfungen, Codeansicht, Dateiicons und Versionshistorie wurden verbessert

### v0.5.7

- Prompt AI Quick Edit, gleichnamige Skill-Varianten, Remote-Git-Scan und AI-Workbench-Verifizierung wurden gehärtet

### v0.5.6

Siehe Changelog oben.

### v0.5.5

- Skill-Store-Installation hält einen Inhalt-Hash; Erkennung entfernter SKILL.md-Änderungen mit Schutz vor lokalen Konflikten
- Vollständige Dokument-Übersetzung als Sidecar persistiert, mit Volltextübersetzung und immersivem Side-by-Side
- Daten-Pfadwechsel wirkt nun durch echten Relaunch
- Klarere KI-Test- / Übersetzungsfehler (504 / Timeout / nicht konfiguriert)
- Fix für Web/Docker-Medien-Upload; `local-image://` / `local-video://` werden automatisch aufgelöst
- Vorschau-Update-Linie gehärtet
- Issue-Formulare synchronisieren `version: x.y.z`-Labels automatisch

### v0.4.x

- KI-Workbench mit Modellverwaltung, Endpoint-Bearbeitung, Verbindungstests, Szenario-Defaults
- skills.sh-Community-Store mit Rankings, Installationszahlen und Stars
- skill-installer-Gott-Klasse aufgeteilt, SSRF-Schutz, URL-Protokoll-Validierung
- Skill-Ein-Klick-Installation auf ein Dutzend Plattformen (Claude Code, Cursor, Windsurf, Codex usw.)
- KI-Übersetzung, KI-Skill-Generierung, lokaler Batch-Scan

### Geplant / in Erwägung

- [ ] Browser-Erweiterung, die AgentsHub innerhalb von ChatGPT / Claude anzapft
- [ ] Mobile-Begleiter: ansehen, suchen, leichtes Bearbeiten und Synchronisieren
- [ ] Plugin-Schicht für lokale Modelle (Ollama) und eigene KI-Anbieter
- [ ] Prompt Store: Wiederverwendung community-validierter Prompts
- [ ] Reichhaltigere Variablentypen: Auswahlboxen, dynamische Daten
- [ ] Von Nutzern hochgeladene Skills

<div id="dev"></div>

## Aus Quellcode

Erfordert Node.js ≥ 24 und pnpm 9.

```bash
git clone https://github.com/YZhuAndrew/AgentsHub.git
cd AgentsHub
pnpm install

# Desktop-Dev
pnpm electron:dev

# Desktop-Build
pnpm build

# Self-hosted-Web-Build
pnpm build:web
```

`pnpm build` baut nur die Desktop-App. Das Web-Bundle erfordert `pnpm build:web`.

| Befehl                                           | Zweck                               |
| ------------------------------------------------ | ----------------------------------- |
| `pnpm electron:dev`                              | Vite + Electron Dev-Umgebung        |
| `pnpm dev:web`                                   | Web-Dev-Server                      |
| `pnpm lint` / `pnpm lint:web`                    | Lint                                |
| `pnpm typecheck` / `pnpm typecheck:web`          | TypeScript-Prüfung                  |
| `pnpm test -- --run`                             | Desktop Unit + Integration Tests    |
| `pnpm test:e2e`                                  | Playwright e2e                      |
| `pnpm verify:web`                                | Web lint + typecheck + test + build |
| `pnpm test:release`                              | Desktop-Pre-Release-Gate            |
| `pnpm --filter @prompthub/desktop bundle:budget` | Bundle-Budget-Prüfung Desktop       |

<div id="project-structure"></div>

## Repository-Struktur

```text
AgentsHub/
├── apps/
│   ├── desktop/   # Electron-Desktop-App
│   ├── cli/       # eigenständige CLI (auf packages/core)
│   └── web/       # Self-hosted Web
├── packages/
│   ├── core/      # CLI- und Desktop-gemeinsame Kernlogik
│   ├── db/        # gemeinsame Datenebene (SQLite-Schema, Queries)
│   └── shared/    # gemeinsame Typen, IPC-Konstanten, Protokolldefinitionen
├── docs/          # öffentlich zugängliche Dokumentation
├── spec/          # interne SSD / Design-Spec
├── website/       # Marketing-Site
├── README.md
├── CONTRIBUTING.md
└── package.json
```

<div id="contributing"></div>

## Mitwirken & Docs

- Einstieg: [CONTRIBUTING.md](../CONTRIBUTING.md)
- Vollständige Anleitung: [`docs/contributing.md`](./contributing.md)
- Docs-Index: [`docs/README.md`](./README.md)
- Interne SSD / Specs: [`spec/README.md`](../spec/README.md)

Für nicht-triviale Änderungen ein Change-Verzeichnis unter `spec/changes/active/<change-key>/` anlegen (`proposal.md` / `specs/<domain>/spec.md` / `design.md` / `tasks.md` / `implementation.md`). Nach dem Release haltbare Inhalte nach `spec/workflow/*`, `spec/knowledge/*`, `spec/releases/` oder `spec/adr/` zurückspielen und bei Bedarf `docs/` oder die Root-`README.md` aktualisieren.

<div id="meta"></div>

## Lizenz

[AGPL-3.0](../LICENSE)

## Feedback

- Issues: [GitHub Issues](https://github.com/YZhuAndrew/AgentsHub/issues)

## Gebaut mit

[Electron](https://www.electronjs.org/) · [React](https://react.dev/) · [TailwindCSS](https://tailwindcss.com/) · [Zustand](https://zustand-demo.pmnd.rs/) · [Lucide](https://lucide.dev/) · [@tanstack/react-virtual](https://tanstack.com/virtual) · [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)

## Mitwirkende

Danke an alle, die zu AgentsHub beigetragen haben.

<a href="https://github.com/YZhuAndrew/AgentsHub/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=YZhuAndrew/AgentsHub" alt="Contributors" />
</a>

## Star-Verlauf

<a href="https://star-history.com/#YZhuAndrew/AgentsHub&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=YZhuAndrew/AgentsHub&type=Date&theme=dark" />
    <img alt="Star-Verlauf" src="https://api.star-history.com/svg?repos=YZhuAndrew/AgentsHub&type=Date" />
  </picture>
</a>

## Sponsoring

Wenn AgentsHub dir hilft, lade den Maintainer auf einen Kaffee ein ☕

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="./imgs/donate/wechat.jpg" width="200" alt="WeChat Pay"/>
        <br/>
        <b>WeChat Pay</b>
      </td>
      <td align="center">
        <img src="./imgs/donate/alipay.jpg" width="200" alt="Alipay"/>
        <br/>
        <b>Alipay</b>
      </td>
    </tr>
  </table>
</div>

---

## Danksagung

AgentsHub ist ein Fork von [PromptHub](https://github.com/legeling/PromptHub) (AGPL-3.0). Vielen Dank an den ursprünglichen Autor [legeling](https://github.com/legeling) für den Open-Source-Beitrag. Dieses Projekt erweitert es um Verwaltung von Agent-Assets, CLI-Diagnose und Nutzungsmessung.

---

<div align="center">
  <p>Wenn AgentsHub dir nützlich ist, freut sich das Projekt über einen ⭐.</p>
</div>
