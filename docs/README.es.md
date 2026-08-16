<div align="center">
  <img src="../assets/readme/hero.png" width="100%" alt="AgentsHub — un workspace local-first para prompts, skills y activos de programación con IA" />

# AgentsHub

Un espacio de trabajo local-first para prompts, skills y assets de codificación con IA.

  <br/>

[![GitHub Stars](https://img.shields.io/github/stars/YZhuAndrew/AgentsHub?style=for-the-badge&logo=github&color=yellow)](https://github.com/YZhuAndrew/AgentsHub/stargazers)
[![Downloads](https://img.shields.io/github/downloads/YZhuAndrew/AgentsHub/total?style=for-the-badge&logo=github&color=blue)](https://github.com/YZhuAndrew/AgentsHub/releases)
[![Version](https://img.shields.io/badge/release-v0.8.3_stable-22C55E?style=for-the-badge)](https://github.com/YZhuAndrew/AgentsHub/releases/latest)
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
    <img src="https://img.shields.io/badge/📥_Descargar-Releases-blue?style=for-the-badge&logo=github" alt="Descargar"/>
  </a>
</div>

<br/>

AgentsHub mantiene tus prompts, archivos SKILL.md y assets de codificación con IA a nivel proyecto en un único espacio de trabajo local. Permite instalar el mismo Skill en Claude Code, Cursor, Codex, Windsurf, Antigravity y una docena de herramientas más, ofrece historial de versiones y pruebas multi-modelo para los prompts, sincroniza vía WebDAV y guarda snapshots completos en una instancia Web auto-hospedada.

Tus datos se quedan en tu máquina.

---

## Contenido

- [Descarga](#install)
- [Capturas](#screenshots)
- [Funcionalidades](#features)
- [Inicio rápido](#quick-start)
- [Web auto-hospedado](#self-hosted-web)
- [CLI](#cli)
- [Registro de cambios](#changelog)
- [Hoja de ruta](#roadmap)
- [Desde el código fuente](#dev)
- [Estructura del repositorio](#project-structure)
- [Contribuir y docs](#contributing)
- [Licencia / créditos](#meta)

---

<div id="install"></div>

## 📥 Descarga

Las compilaciones de escritorio se publican en GitHub Releases para macOS / Windows / Linux.

| Plataforma | Instalador |
| ---- | ------ |
| macOS (Apple Silicon) | [arm64 DMG](https://github.com/YZhuAndrew/AgentsHub/releases/latest) |
| macOS (Apple Silicon) | [zip portátil](https://github.com/YZhuAndrew/AgentsHub/releases/latest) |
| Windows (x64) | [x64 Setup](https://github.com/YZhuAndrew/AgentsHub/releases/latest) |
| Linux | ver la [página Releases](https://github.com/YZhuAndrew/AgentsHub/releases) |

> **¿macOS?** Solo se publican compilaciones `arm64` de Apple Silicon (M1/M2/M3/M4). El zip portátil se descomprime y usa sin instalación.

### Verificación de seguridad en macOS

AgentsHub es un build fork mantenido por la comunidad, sin firma de Apple Developer. Descárgalo desde GitHub Releases; macOS Gatekeeper puede bloquear el primer inicio.

Si macOS indica que AgentsHub está dañado o que no se puede verificar al desarrollador, ejecuta:

```bash
sudo xattr -rd com.apple.quarantine /Applications/AgentsHub.app
```

Vuelve a abrir la app. Sustituye la ruta si la instalaste en otro sitio.

<div align="center">
  <img src="./imgs/install.png" width="60%" alt="Aviso de instalación macOS"/>
</div>

### Canal de vista previa

¿Quieres probar la próxima versión preliminar? Abre _Ajustes → Acerca de_ y activa el canal de vista previa. La app consultará entonces los Prereleases de GitHub. Al desactivarlo vuelve a la estable; AgentsHub no degrada automáticamente de una preview más nueva a una estable más antigua.

<div id="screenshots"></div>

## Capturas

> Las siguientes capturas cubren los espacios de trabajo de escritorio de la versión estable: Prompt, Skill, MCP, Plugin y Rules.

<div align="center">
  <p><strong>Home en dos columnas</strong></p>
  <img src="./imgs/1-index.png" width="80%" alt="Vista principal"/>
  <br/><br/>
  <p><strong>Skill store</strong></p>
  <img src="./imgs/10-skill-store.png" width="80%" alt="Skill store"/>
  <br/><br/>
  <p><strong>Detalle de Skill con instalación a plataformas con un clic</strong></p>
  <img src="./imgs/11-skill-platform-install.png" width="80%" alt="Instalación de Skill en plataforma"/>
  <br/><br/>
  <p><strong>Espacio MCP</strong></p>
  <img src="./imgs/18-mcp-workspace.png" width="80%" alt="Espacio MCP"/>
  <br/><br/>
  <p><strong>Espacio Plugin</strong></p>
  <img src="./imgs/19-plugin-workspace.png" width="80%" alt="Espacio Plugin"/>
  <br/><br/>
  <p><strong>Espacio Rules</strong></p>
  <img src="./imgs/13-rules-workspace.png" width="80%" alt="Espacio Rules"/>
  <br/><br/>
  <p><strong>Espacio de Skills por proyecto</strong></p>
  <img src="./imgs/14-skill-projects.png" width="80%" alt="Espacio de Skills por proyecto"/>
  <br/><br/>
  <p><strong>Quick Add (manual / análisis / generación IA)</strong></p>
  <img src="./imgs/15-quick-add-ai.png" width="80%" alt="Quick Add"/>
  <br/><br/>
  <p><strong>Apariencia y preferencias de motion</strong></p>
  <img src="./imgs/17-appearance-motion.png" width="80%" alt="Ajustes de apariencia"/>
</div>

<div id="features"></div>

## Funcionalidades

### 📝 Gestión de prompts

- Carpetas, etiquetas y favoritos con reordenación por arrastre; CRUD completo
- Plantillas con `{{variable}}`; copiar / probar / distribuir abre un formulario para los valores
- Búsqueda de texto completo (FTS5), renderizado Markdown con resaltado de código, adjuntos y vista previa multimedia
- La vista de tarjeta del escritorio admite edición inline con doble clic para el prompt de usuario y el de sistema

### 🧩 Skill store y distribución con un clic

- **Skill store** con 20+ skills curados (Anthropic, OpenAI, etc.) y fuentes personalizadas acumulables (repo GitHub / skills.sh / carpeta local)
- **Instalación con un clic** en Claude Code, Cursor, Windsurf, Codex, Antigravity, Kiro, Kilo Code, Qoder, QoderWork, CodeBuddy, Trae, OpenCode y 15+ más; Gemini se conserva solo como destino de compatibilidad empresarial y API de pago
- **Escaneo local** detecta los SKILL.md existentes para no copiar y pegar entre directorios de herramientas
- **Modos Symlink / Copy** — symlink para edición compartida, copy para copias independientes por plataforma
- **Sobrescritura del directorio Skills por plataforma** mantiene escaneo e instalación en la misma ruta
- **Traducción y revisión por IA** a nivel de SKILL.md completo con almacenamiento sidecar, modo lado a lado y traducción integral
- **Política de seguridad** controla el escaneo de contenido e IA al instalar/actualizar de forma global, por canal o por tienda; las validaciones de ruta, archivo, enlace simbólico, tamaño, fichero obligatorio y huella siguen siempre activas
- **Token de GitHub** para imports del store y de repos, reduce los fallos por límite de tasa anónimo
- **Filtrado por etiqueta** para skills instalados y para navegar el store

### 📐 Rules (reglas de codificación con IA)

- Un único lugar para gestionar `.cursor/rules`, `.claude/CLAUDE.md`, AGENTS.md y similares
- Reglas de proyecto añadidas manualmente, agrupadas por directorio
- Integradas con exportación ZIP, WebDAV, backup/restauración auto-hospedados e importación/exportación Web

### 🤖 Espacio de proyectos y assets de agente

- Escanea ubicaciones habituales del proyecto: `.claude/skills`, `.agents/skills`, `skills`, `.gemini`, etc.
- Espacios de Skills por proyecto que aíslan el contexto del proyecto de la biblioteca global
- Biblioteca personal, repo local y assets de proyecto en un mismo selector — sin saltar entre directorios de herramientas
- Gestión global de etiquetas de prompt: buscar, renombrar, fusionar y borrar etiquetas con sincronización entre la base de datos y los archivos del workspace

### 🧪 Pruebas y generación con IA

- Pruebas de IA integradas con los principales proveedores globales y chinos (OpenAI, Anthropic, Gemini, Azure, endpoints personalizados)
- Lanza el mismo prompt en múltiples modelos en paralelo, modelos de texto y de imagen
- Generación y mejora de Skills por IA, Quick Add ahora genera borradores estructurados directamente
- Gestión unificada de endpoints y pruebas de conexión; mensajes de error precisos para 504 / timeout / no configurado

### 🕒 Versionado e historial

- Cada guardado de prompt crea automáticamente una versión con resaltado de diferencias y rollback con un clic
- Los Skills mantienen su propio historial con versiones nombradas, diff por versión y rollback por versión
- El historial de snapshots de Rules puede previsualizarse y restaurarse a un borrador
- Los Skills instalados desde el store guardan un hash de contenido para detectar cambios remotos en SKILL.md y proteger contra conflictos con ediciones locales

### 💾 Datos, sincronización y copia de seguridad

- Local-first: por defecto tus datos viven en tu máquina
- Backup / restauración completa en formato comprimido `.phub.gz`
- Sincronización WebDAV (Jianguoyun, Nextcloud, etc.)
- La sincronización activa WebDAV / S3 usa una sola fuente seleccionada para evitar conflictos multiescritor
- AgentsHub Web auto-hospedado guarda snapshots inmutables de forma independiente; las tareas de inicio y programadas sólo suben y nunca descargan ni sobrescriben datos locales
- Desktop y Web deben tener exactamente la misma versión antes del backup; la restauración es explícita y crea primero un snapshot local de seguridad

### 🔐 Privacidad y seguridad

- Contraseña maestra para acceder a la app, cifrado AES-256-GCM
- Carpetas privadas cifradas en reposo (Beta)
- Multiplataforma y apto para uso offline: macOS / Windows / Linux
- 7 idiomas de interfaz: 简体中文, 繁體中文, English, 日本語, Deutsch, Español, Français

<div id="quick-start"></div>

## Inicio rápido

1. **Crea tu primer prompt.** Pulsa **+ Nuevo**, completa título, descripción, prompt de sistema y prompt de usuario. `{{nombre}}` crea una variable; copiar o probar abrirá un formulario.

2. **Trae Skills.** Abre la pestaña Skills. Elige algunos del store o pulsa _Escanear local_ para localizar SKILL.md ya presentes.

3. **Instala en herramientas IA.** Desde el detalle del Skill, elige la plataforma destino. AgentsHub instalará el SKILL.md en el directorio esperado por la plataforma, como symlink (edición compartida) o copia independiente.

4. **Sincronización o backup (opcional).** _Ajustes → Datos_ configura WebDAV / S3 para sync activo, o AgentsHub Web auto-hospedado para snapshots de recuperación independientes.

<div id="self-hosted-web"></div>

## Web auto-hospedado

AgentsHub Web es un compañero ligero orientado a navegador que puedes ejecutar con Docker en un NAS, VPS o máquina LAN. **No** es un servicio cloud gestionado. Útil para:

- Acceder a tus datos AgentsHub desde un navegador
- Guardar snapshots inmutables de recuperación del escritorio sin cambiar el workspace Web activo
- Mantener los datos en tu propia red

```bash
cd apps/web
cp .env.example .env
docker compose up -d --build
```

En `.env`, como mínimo:

- `JWT_SECRET`: ≥ 32 caracteres aleatorios
- `ALLOW_REGISTRATION=false`: déjalo desactivado tras crear el primer admin
- `DATA_ROOT`: raíz de datos; debajo se crearán `data/`, `config/`, `logs/`, `backups/`

Por defecto: `http://localhost:3871`. La primera visita lleva a `/setup`; el primer usuario será administrador.

Para conectar el escritorio: _Ajustes → Datos → Self-Hosted AgentsHub_. Comprueba versión y capacidad de backup, crea un snapshot remoto, restaura explícitamente el último snapshot o activa backups de sólo subida al iniciar / programados. Las tareas automáticas nunca descargan, fusionan ni sustituyen datos locales.

Notas detalladas de despliegue / actualización / backup / imagen GHCR / desarrollo en [`web-self-hosted.md`](./web-self-hosted.md).

<div id="cli"></div>

## CLI

La CLI sirve para scripts, importación/exportación masiva y automatización. La app de escritorio **no** instala automáticamente el comando `prompthub`; empaquétalo e instálalo desde el repo:

```bash
pnpm pack:cli
pnpm add -g ./apps/cli/prompthub-cli-*.tgz
prompthub --help
```

O ejecútalo desde el código fuente sin instalar:

```bash
pnpm --filter @prompthub/cli dev -- prompt list
pnpm --filter @prompthub/cli dev -- skill scan
```

Comandos por recurso (cada comando admite `--help`):

```text
prompt    list / get / create / update / delete / duplicate / search
          versions / create-version / delete-version / diff / rollback
          use / copy
          list-tags / rename-tag / delete-tag

folder    list / get / create / update / delete / reorder

agent     list / get / enable / disable
          add / update / configure / reset / delete
          config list|read (solo lectura con secretos ocultos)
          identity get|set

rules     list / scan / read / save / rewrite
          versions / version-read / version-restore / version-delete
          add-project / remove-project
          export / import

skill     list / get / import (alias: install) / delete / remove
          versions / create-version / rollback / delete-version
          export / scan / scan-safety / sync-from-repo
          platforms / platform-status / distribute / undistribute
          (alias: install-md / uninstall-md)
          repo-files / repo-read / repo-write / repo-delete / repo-mkdir / repo-rename

ai        providers / provider-add / provider-delete
          models / model-add / model-delete
          routes / route-set / route-clear

workspace export / import

doctor    database-lock [--recover]
```

La importación, los snapshots de versión y la distribución de Skills aplican las reglas de exclusión integradas y un `.prompthubignore` en la raíz. Las posibles claves privadas, tokens de acceso y contraseñas se bloquean antes de escribir. La salida correcta es un resumen acotado de forma predeterminada; usa `--full` explícitamente para obtener el contenido del Skill y snapshots completos de archivos.

Flags globales habituales:

- `--output json|table` — formato de salida
- `--summary` — devuelve un resumen acotado (predeterminado)
- `--full` — devuelve el contenido completo del recurso
- `--quiet` — suprime stdout en caso de éxito y conserva los errores en stderr
- `--data-dir <path>` — sobrescribe el directorio `userData` de AgentsHub
- `--app-data-dir <path>` — sobrescribe la raíz de datos de la app
- `--version|-v` — imprime la versión de la CLI

<div id="changelog"></div>

## Registro de cambios

Changelog completo: **[CHANGELOG.md](../CHANGELOG.md)**

### v0.8.3 (2026-08-16, estable)

- Correcciones urgentes de ventana en blanco al iniciar: los archivos `.DS_Store` que crea Finder al abrir el directorio de datos local ya no rompen el arranque, y la inicialización circular entre chunks que mataba al renderizador del paquete quedó resuelta — el instalador vuelve a abrirse con normalidad
- Rendimiento: las mutaciones de prompts ahora sincronizan solo los archivos afectados del workspace en lugar de reescribir todo, copiar/favoritar ya no reescribe silenciosamente el índice de texto completo, los escaneos de integridad al iniciar se reducen a la mitad, las vistas markdown calientes omiten reparses sin cambios, el streaming de pruebas de IA se limita, la pila markdown sale del primer pintado y el web autoalojado gana caché estática con gzip


### v0.8.2 (2026-08-15, estable)

- Corregido: las selecciones de distribución de la página de detalle de skills se reiniciaban de inmediato — la elección de plataformas ya no se borra con las actualizaciones de estado de instalación en segundo plano; la distribución global/por proyecto se completa con normalidad
- Corregido: el tartamudeo al desplazar la vista previa de skills — el análisis de seguridad automático ya no entra en un bucle de analizar → guardar → reanalizar, y las re-renderizaciones no relacionadas vuelven a analizar toda la vista previa de markdown

### v0.8.1 (2026-08-15, estable)

- Corregida la regresión de rendimiento de v0.8.0: la reconciliación de espacios de trabajo canónicos ya no reconstruye todos los espacios de trabajo de skills en cada inicialización de la base de datos; el arranque vuelve a ser rápido y la página de Skills ya se se congela
- Corregida la regresión de v0.8.0 que bloqueaba el arranque con skills importadas que contenían enlaces simbólicos relativos dentro del paquete (p. ej. el alias `AGENTS.md -> CLAUDE.md`); los enlaces contenidos se materializan en proyecciones o se recrean con destinos relativos en snapshots, y los enlaces que escapan siguen rechazándose

### v0.8.0 (2026-08-14, estable)

- Configuraciones MCP de proyecto y destinos compatibles con Pi: My MCP fusiona la proyección de destinos globales/proyecto; las variables de entorno y cabeceras aceptan valores directos o referenciados, con avisos de salud de referencias y enmascaramiento de valores literales (#200 / #201 / #202)
- Cierre del banco de trabajo de Agent: banco de proveedor/modelo unificado; importación en un clic de proveedores de PromptHub a los `models.json`/`auth.json` nativos de Pi; edición del catálogo de modelos de Pi con pruebas conscientes de cuota; popover de cuota (con renovación Kimi) y paginación de sesiones mejorada
- Destinos verificados ampliados: descubrimiento MCP compatible con Pi, reglas Cursor/Qoder por proyecto y proyecciones MCP de OpenClaw/Qoder/Grok/Antigravity/Reasonix
- Rediseño del banco de generación de imágenes: revisión de una sola obra, paneles de ajustes/historio fijados, selección explícita de imágenes de referencia
- Autoridad de datos local basada en archivos y carga bajo demanda de la lista de prompts (rendimiento)
- Experiencia de escritorio: persistencia de la geometría de la ventana; vista previa con formato de archivos Markdown de skills; las actualizaciones macOS sin firmar en instalación directa dirigen a la descarga manual del DMG

### v0.7.2 (2026-08-13, estable)

- Icono persistente en la barra de estado: un nuevo conmutador opcional mantiene visible el icono de la barra de menús / bandeja incluso con la ventana abierta; compatible con minimizar a la bandeja y se aplica al instante

### v0.7.1 (2026-08-13, estable)

- Corrección del backup de actualización: el backup previo a la actualización ya no aborta al encontrar el primer enlace simbólico (p. ej. skill instalado en modo symlink); conserva los enlaces internos, omite los que salen hacia fuera y gestiona la normalización /var de macOS

### v0.7.0 (2026-08-13, estable)

- Import de habilidades por lotes: un nuevo modo de importación por lotes instala varios archivos ZIP locales (arrastrar/soltar o selector) y/o varias URLs de GitHub/Git a la vez; los ZIP locales reutilizan el mismo ciclo de instalación atómica que los paquetes remotos; soltar ZIP en My Skills abre la importación por lotes
- Visibilidad de plataformas unificada con el botón de Settings (la detección pasa a ser una pista; copilot/amp añadidos al orden); añadida la plataforma QwenWork CN; corregida la raíz por defecto de trae-work-cn a ~/.trae-cn

### v0.6.2 (2026-08-11, estable)

- Mejora de la vista de lista de Skills: la vista de lista pasa a ser la predeterminada, con un diseño tabular con encabezados de columna (nombre + descripción / origen / autor / versión / creado / actualizado / estado de plataforma / acciones), un filtro por autor y una acción por lotes «comprobar todas las actualizaciones» con actualización masiva de los Skills seleccionados
- Progreso de importación desde Git: la instalación de Skills desde un repositorio Git muestra el progreso detallado de las fases de escaneo e importación (etiqueta de fase, `index/total` + nombre del Skill, porcentaje de clonación en vivo), reemplazando el único indicador congelado

### v0.6.1 (2026-08-10, estable)

- Se añadió el objetivo de plataforma Agent integrada QwenWork, permitiendo distribuir Skills directamente
- Ajustes de comportamiento de inicio: la ventana principal se abre por defecto al iniciar, un nuevo selector de «vista de inicio» (por defecto la última usada) y el inicio automático al arrancar el sistema

### v0.6.0 (2026-08-09, estable)

- Primera versión base del fork de AgentsHub; se alinearon las versiones de build de Desktop, CLI, Web autoalojado, Cloudflare Worker y Mobile

### v0.5.9 (2026-07-09, estable)

- Gestión de Plugins estabilizada: My Plugins / Plugin Store / Agent Plugin siguen el estilo Skill para instalación, detalle, snapshots de versión, revisión de actualización de origen, acciones batch, distribución Agent e importación de Skill / MCP hijos
- Gestión y sincronización MCP ampliadas: workspace MCP, tienda oficial de plantillas, distribución a targets Agent, health checks, importación selectiva de .env, comandos CLI MCP y diseño de resincronización en un clic quedan consolidados
- La copia completa de assets Agent incluye My Skills, My MCP, My Plugins, Rules y datos relacionados en backup/restauración auto-hospedados
- Las actualizaciones de origen Skill usan fingerprints SHA-256 de package y conciliación de tres vías, con correcciones para registry fingerprints, content-url baselines y redacción de credenciales en URL
- Las actualizaciones de origen Plugin y batch store ahora muestran diferencias y requieren confirmación antes de reemplazar packages locales
- Los Prompts permiten componer, ordenar, persistir y respaldar secuencias de formato de salida personalizadas
- El flujo macOS documenta la instalación del fork sin firmar, la verificación DMG/ZIP y el manejo de Gatekeeper

### v0.5.9-beta.1 (2026-06-14, vista previa)

- Preview del workspace MCP: biblioteca MCP local, tienda oficial de plantillas, distribución a agentes, health checks, importación selectiva de .env y comandos MCP en CLI
- Árbol de relaciones de Prompt y relaciones semánticas: agrupar por arrastre, expandir/contraer, etiquetas de padre, contador de hijos y navegación de relaciones en el detalle
- Importación Git de Skills corregida: los escaneos SSH de GitHub clonan en local, los cambios de URL se pueden reescanear y los límites HTTPS recomiendan SSH
- La vista previa de imágenes de Skill admite zoom con rueda, arrastre para desplazar, controles fijos abajo a la derecha y pantalla completa
- Las versiones de Skill empiezan visualmente en v1 y hacer clic en el título del detalle copia el nombre del Skill

### v0.5.8 (2026-06-04)

- Nuevo flujo dedicado para invertir prompts de imagen con modelos de visión, vista previa/copia antes de guardar y referencia de imagen opcional
- Configuración de modelos de IA reorganizada por proveedores, capacidades del modelo y rutas de negocio
- Soporte para tiendas ClawHub y skill.sh con búsqueda remota, categorías, paginación/carga, caché e instalación completa de paquetes Skill
- Ciclo de vida de Skills reforzado en My Skills, Project Skills, Agent Skills, plataformas, copy / symlink, Skills integradas y symlinks externos
- Comprobaciones de actualización más precisas para GitHub, Gitea y Git autoalojado, ignorando archivos de caché comunes

### v0.5.8-beta.3 (2026-06-02, vista previa)

- Las vistas de archivos Skill ahora usan un editor de codigo ligero con resaltado de sintaxis, numeros de linea, ajuste de linea e iconos de archivo mas precisos
- Los Skills importados desde GitHub a My Skills pueden comprobar actualizaciones de origen desde el detalle y crear un snapshot antes de aplicarlas
- Se reforzaron los estados de Cherry Studio, Agent Skill, Project Skill, copy / symlink, Skills integrados y symlinks externos
- Los dialogos de historial de versiones de Prompt / Skill ahora usan una presentacion tipo tabla mas facil de revisar

### v0.5.7 (2026-05-29)

- La edición rápida con IA para Prompt ahora usa un único diálogo compartido entre detalle, modal y menú contextual
- Las variantes de Skill con el mismo nombre ya se tratan como identidades coexistentes de primera clase
- Se reforzaron la restauración desde copias, el escaneo remoto Git y la persistencia del estado verificado en AI Workbench

### v0.5.7-beta.2 (2026-05-28, vista previa)

- Las fuentes Git del store ahora admiten `branch / directory`, sugerencias de ramas remotas y repos GitHub / SSH / autoalojados
- La importación de Skills de proyecto ahora admite modos avanzados `copy / symlink` con memoria de preferencias por proyecto
- La gestión de agentes y la instalación a plataformas ahora incluyen `Kilo Code` integrado en lugar de `Roo Code`

### v0.5.7-beta.1 (2026-05-26, vista previa)

- Modelo unificado de configuración completa para agentes built-in y custom, con overrides directos de `root / skills / rules / agents / commands / config`
- Nuevos presets built-in `Cline` y `Trae CN`, y refresco inmediato del workspace Rules cuando cambia la configuración de agentes
- Despliegue directo de Skills a carpetas locales de agentes dentro del proyecto, con `.agents/skills` por defecto y selección multiobjetivo
- Cuando una instalación symlink cae a copy, AgentsHub ahora muestra warnings explícitos en lugar de parecer un éxito normal
- La edición inline del detalle del Prompt abre exactamente el campo sobre el que haces doble clic y mantiene una apariencia más cercana al layout normal

### v0.5.6 (2026-05-12)

**Funcionalidades**

- 🧭 **Espacio Rules.** Una página Rules dedicada en el escritorio que gestiona reglas globales y reglas de proyecto añadidas manualmente — búsqueda, vista previa de snapshots, restaurar a borrador, exportación ZIP / WebDAV / backup-restauración auto-hospedados / import-export Web.
- 📁 **Espacio Skill por proyecto.** Espacios de Skills por proyecto, escaneo automático de las ubicaciones habituales y previsualización / importación / distribución en contexto de proyecto.
- 🤖 **Quick Add genera prompts con IA.** Además de analizar un prompt existente, Quick Add ahora puede generar borradores estructurados a partir de objetivos y restricciones.
- 🏷️ **Gestión global de etiquetas de prompt.** Búsqueda / renombrado / fusión / borrado centralizados en la zona de etiquetas de la barra lateral, sincronizados con la base y los archivos del workspace.
- 🔐 **Token de GitHub para el Skill Store.** Cuota autenticada de GitHub para reducir los fallos por límite de tasa anónimo durante imports del store y de repos.

**Correcciones**

- ✍️ El detalle de tarjeta admite edición con doble clic para los prompts de usuario y de sistema
- 🪟 Parpadeo del diálogo de actualización, botón de descarga inestable y `minimizeOnLaunch` que no respetaba el inicio automático
- ↔️ Regresiones de redimensionado en tres columnas de Skills, doble clic para reset, ajuste de títulos y búsqueda en el store
- 🔁 Consistencia de Rules / extras de Skill / copias gestionadas entre exportación ZIP, WebDAV, backup-restauración auto-hospedados e import/export Web
- 🖼️ Inicio de sesión en Web auto-hospedado migrado a desafíos CAPTCHA de imagen de un solo uso

**Mejoras**

- 🏠 La home de dos columnas admite de forma estable visibilidad de módulos, ordenación por arrastre y un toggle de fondo independiente
- ☁️ Sólo una fuente de sync activa controla la sincronización automática, evitando conflictos de escritura entre proveedores
- ✨ Sistema de motion completo en el renderer de escritorio (tokens de duration / easing / scale, cuatro componentes de intención `<Reveal>` `<Collapsible>` `<ViewTransition>` `<Pressable>`, tres niveles de usuario). framer-motion fue reemplazado por `tailwindcss-animate`; el chunk `ui-vendor` pasó de 54 KB a 16 KB gzip.
- 🪶 Las listas largas (lista de Skills / galería de Prompts / kanban / lista de prompts inline) usan ahora `@tanstack/react-virtual`, retirando el render por chunks basado en `setTimeout`.

<div id="roadmap"></div>

## Hoja de ruta

### v0.5.9

- Plugin / MCP se alinean con la experiencia Skill en tiendas, distribución Agent, detalles, filtros de etiquetas, revisión de actualización y safety checks
- Sync de assets Agent, proxy de red, instalaciones CLI de proyecto y checks de actualización de origen Skill pasan a estable
- Árboles de relaciones de Prompt, rutas Windows Agent, toggle de captcha Web, la instalación macOS del fork sin firmar y fixes de release pipeline llegan a usuarios estables

### v0.5.8

- Prompts inversos de imagen, configuración de proveedores/capacidades/rutas y pruebas de imagen ya son estables
- Ciclo de vida de Skills consolidado para tiendas, Git, agentes, proyectos, plataformas, copy / symlink y Skills integradas
- Tiendas ClawHub / skill.sh, comprobaciones de actualización, vista de código, iconos de archivo e historial de versiones refinados

### v0.5.7

- Prompt AI quick edit, variantes Skill con el mismo nombre, escaneo Git remoto y verificación de AI Workbench fueron reforzados

### v0.5.6

Ver el changelog arriba.

### v0.5.5

- La instalación de Skills desde el store guarda un hash de contenido; detección de cambios remotos en SKILL.md con protección frente a conflictos locales
- Traducción IA del documento completo persistida como sidecar, con traducción integral y modo lado a lado inmersivo
- El cambio de ruta de datos se aplica con un relaunch real
- Mensajes de error de prueba / traducción IA más claros (504 / timeout / no configurado)
- Corrección de subida de medios en Web/Docker; `local-image://` / `local-video://` se resuelven automáticamente
- Línea de actualización de la canal de vista previa reforzada
- Los formularios de Issues sincronizan automáticamente etiquetas `version: x.y.z`

### v0.4.x

- Workbench IA con gestión de modelos, edición de endpoints, pruebas de conexión y modelos por defecto por escenario
- Integración con el store comunitario skills.sh: rankings, instalaciones y stars
- Desmenuzado de la god-class skill-installer, protección SSRF, validación de protocolos URL
- Instalación de Skills con un clic en una docena de plataformas (Claude Code, Cursor, Windsurf, Codex, etc.)
- Traducción IA, generación de Skills por IA, escaneo local en lote

### En estudio / planificado

- [ ] Extensión de navegador que invoque AgentsHub dentro de ChatGPT / Claude
- [ ] Compañero móvil: ver, buscar, edición ligera y sincronización
- [ ] Superficie de plugin para modelos locales (Ollama) y proveedores IA personalizados
- [ ] Prompt Store: reutilizar prompts validados por la comunidad
- [ ] Tipos de variable más ricos: selectores, fechas dinámicas
- [ ] Skills subidos por usuarios

<div id="dev"></div>

## Desde el código fuente

Requiere Node.js ≥ 24 y pnpm 9.

```bash
git clone https://github.com/YZhuAndrew/AgentsHub.git
cd AgentsHub
pnpm install

# desarrollo desktop
pnpm electron:dev

# build desktop
pnpm build

# build Web auto-hospedado
pnpm build:web
```

`pnpm build` solo compila la app de escritorio. El bundle Web requiere `pnpm build:web`.

| Comando                                          | Uso                                                  |
| ------------------------------------------------ | ---------------------------------------------------- |
| `pnpm electron:dev`                              | Entorno de desarrollo Vite + Electron                |
| `pnpm dev:web`                                   | Servidor de desarrollo Web                           |
| `pnpm lint` / `pnpm lint:web`                    | Lint                                                 |
| `pnpm typecheck` / `pnpm typecheck:web`          | Comprobaciones de TypeScript                         |
| `pnpm test -- --run`                             | Tests unitarios + integración del escritorio         |
| `pnpm test:e2e`                                  | Playwright e2e                                       |
| `pnpm verify:web`                                | Web lint + typecheck + test + build                  |
| `pnpm test:release`                              | Compuerta previa a release del escritorio            |
| `pnpm --filter @prompthub/desktop bundle:budget` | Verificación de presupuesto del bundle de escritorio |

<div id="project-structure"></div>

## Estructura del repositorio

```text
AgentsHub/
├── apps/
│   ├── desktop/   # app de escritorio Electron
│   ├── cli/       # CLI independiente (sobre packages/core)
│   └── web/       # Web auto-hospedado
├── packages/
│   ├── core/      # lógica compartida CLI y desktop
│   ├── db/        # capa de datos compartida (esquema SQLite, queries)
│   └── shared/    # tipos compartidos, constantes IPC, definiciones de protocolo
├── docs/          # documentación pública
├── spec/          # SSD interna / spec de diseño
├── website/       # sitio de marketing
├── README.md
├── CONTRIBUTING.md
└── package.json
```

<div id="contributing"></div>

## Contribuir y docs

- Punto de entrada: [CONTRIBUTING.md](../CONTRIBUTING.md)
- Guía completa: [`docs/contributing.md`](./contributing.md)
- Índice de docs públicas: [`docs/README.md`](./README.md)
- SSD / specs internas: [`spec/README.md`](../spec/README.md)

Para cambios no triviales, crea una carpeta de cambio en `spec/changes/active/<change-key>/` (`proposal.md` / `specs/<domain>/spec.md` / `design.md` / `tasks.md` / `implementation.md`). Tras el lanzamiento, sincroniza lo perdurable a `spec/workflow/*`, `spec/knowledge/*`, `spec/releases/` o `spec/adr/`, y actualiza `docs/` o el `README.md` raíz si cambian los contratos hacia el usuario.

<div id="meta"></div>

## Licencia

[AGPL-3.0](../LICENSE)

## Comentarios

- Issues: [GitHub Issues](https://github.com/YZhuAndrew/AgentsHub/issues)

## Construido con

[Electron](https://www.electronjs.org/) · [React](https://react.dev/) · [TailwindCSS](https://tailwindcss.com/) · [Zustand](https://zustand-demo.pmnd.rs/) · [Lucide](https://lucide.dev/) · [@tanstack/react-virtual](https://tanstack.com/virtual) · [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)

## Colaboradores

Gracias a todas las personas que han contribuido a AgentsHub.

<a href="https://github.com/YZhuAndrew/AgentsHub/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=YZhuAndrew/AgentsHub" alt="Contributors" />
</a>

## Historial de stars

<a href="https://star-history.com/#YZhuAndrew/AgentsHub&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=YZhuAndrew/AgentsHub&type=Date&theme=dark" />
    <img alt="Historial de stars" src="https://api.star-history.com/svg?repos=YZhuAndrew/AgentsHub&type=Date" />
  </picture>
</a>

## Patrocinar

Si AgentsHub te resulta útil, invita al mantenedor a un café ☕

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

## Agradecimientos

AgentsHub es un fork de [PromptHub](https://github.com/legeling/PromptHub) (AGPL-3.0). Gracias al autor original [legeling](https://github.com/legeling) por su contribución de código abierto. Este proyecto lo amplía con gestión de activos de Agent, diagnóstico CLI y seguimiento de uso.

---

<div align="center">
  <p>Si AgentsHub te resulta útil, una ⭐ siempre se agradece.</p>
</div>
