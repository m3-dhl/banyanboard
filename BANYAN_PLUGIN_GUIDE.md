# Banyan Memory Bank (BMB) — Guía de Referencia

> Plugin analizado: **v1.8.4** | Proyecto de referencia: **BanyanBoard**  
> Audiencia: desarrolladores que llegan sin contexto previo sobre este plugin

---

## Mapa Mental en 30 Segundos

Si solo lees una cosa, que sea esto:

```
PROYECTO
  └── memory-bank/          ← cerebro del sistema (ficheros .md con contexto acumulado)
        ├── tasks.md         ← qué tareas existen y en qué estado
        ├── tasks/TASK-XXX.md← plan completo + estado en tiempo real de UNA tarea
        ├── productBrief.md  ← quién usa el producto, qué necesita, qué no puede fallar
        ├── techContext.md   ← stack real, comandos, variables de entorno
        ├── systemPatterns.md← convenciones de código que todos los agentes siguen
        └── roadmap.md       ← features planificadas por versión

FLUJO BÁSICO (L1, el más simple):
  /banyan-task → /banyan-build → /banyan-archive

FLUJO ESTÁNDAR (L2):
  /banyan-roadmap → /banyan-plan → /banyan-build → /banyan-reflect → /banyan-archive

FLUJO CON DISEÑO (L3-L4, tiene un bucle):
  /banyan-roadmap → /banyan-plan → /banyan-creative
    → [/banyan-build → revisar → repetir por cada fase]
    → /banyan-uat → /banyan-reflect → /banyan-archive
```

Los comandos no son sugerencias — el sistema bloquea si intentas saltarte un paso.

---

## La Tesis Central

BMB no es un copiloto que sugiere líneas. Es un **SDLC orquestado con memoria persistente**.

```
Augmented coding:   tú → prompt → Claude → código (inconsistente)
Agentic coding:     tú → contexto ingenierizado → proceso estructurado → agentes especializados → código consistente
```

La diferencia no está en el modelo — el modelo es idéntico. Está en lo que el modelo sabe cuando trabaja.

**Dos pilares sostienen el sistema:**

| Pilar | Qué es | Sin él |
|-------|--------|--------|
| **Context Engineering** | Dar al agente la información correcta en el momento correcto | Inventa convenciones. El error de respuesta del endpoint nuevo no coincide con el del health check |
| **Process Orchestration** | Ejecutar pasos en orden, con guardianes que bloquean los atajos | Tests opcionales, docs que nunca se escriben, contexto que se pierde entre tareas |

**El experimento que lo demuestra:** construir el mismo endpoint con y sin `systemPatterns.md` y `techContext.md` poblados. Con ellos: formato de error idéntico al health check, mismo número de tests que otras rutas, mismo estilo de validación. Sin ellos: el agente inventa todo desde cero — sin malos resultados, pero inconsistentes.

---

## Arquitectura del Plugin

Tres capas que interactúan:

```
Desarrollador → [Comando slash] → [Orchestrador] → [Sub-agentes] → [memory-bank/]
                    |                                                      |
                    └──────── lee estado + reglas ──────────────────────── ┘
```

### El memory-bank/ como fuente de verdad

| Fichero / Directorio | Rol | Quién lo escribe |
|---|---|---|
| `tasks.md` | Registro central de tareas (tabla de referencia rápida) | Comandos banyan |
| `tasks/TASK-XXX.md` | Plan completo + estado de ejecución en tiempo real | banyan-plan, banyan-build |
| `roadmap.md` | Versiones, features y complejidad asignada | banyan-roadmap |
| `productBrief.md` | Personas, NFRs, métricas, integraciones | Tú (seed) + Documentation Agent |
| `techContext.md` | Stack real, comandos dev, vars de entorno | Documentation Agent en cada build |
| `systemPatterns.md` | Principios guía, patrones de código con ejemplos | Documentation Agent en cada build |
| `projectConfig.md` | Versión del plugin, config UAT | Auto-gestionado |
| `creative/TASK-XXX-*.md` | Decisiones de diseño (L3-L4) | banyan-creative |
| `reflection/reflection-TASK-XXX.md` | Retrospectiva y aprendizajes | banyan-reflect |
| `archive/archive-TASK-XXX.md` | Historial definitivo de tareas completadas | banyan-archive |
| `agent-rules/` | Reglas personalizadas (manuales) | Desarrollador |
| `agent-rules/_learned/` | Reglas auto-generadas de reflexiones pasadas | banyan-reflect |
| `c4/` | Documentación de arquitectura C4 | banyan-c4 |

**Principio de carga progresiva:** no se cargan todos los ficheros a la vez. Cada comando carga solo lo que necesita. Esto mantiene el contexto de cada agente enfocado y barato.

---

## Inicialización (Una Sola Vez por Proyecto)

```bash
# Crear el proyecto
mkdir mi-proyecto && cd mi-proyecto
git init && npm init -y

# Abrir Claude Code
claude

# Instalar el plugin
claude plugin install banyan-memory-bank@banyan-memory-bank --scope project

# Inicializar (aceptar todos los permisos con "Yes, and always allow")
/banyan-init
```

**Qué pasa en `/banyan-init`:**
- Crea `memory-bank/` con +10 ficheros de contexto (vacíos o con plantillas)
- Detecta si es greenfield o brownfield
- Configura `.claude/settings.json` y permisos en `.claude/settings.local.json`
- El contexto empieza vacío — crece con cada tarea

### Sembrar el Product Brief (inmediatamente después del init)

```
BanyanBoard es un kanban board para equipos pequeños. Los usuarios crean
boards con columnas y mueven tarjetas entre ellas. Las tarjetas tienen
título, descripción, fecha límite y etiquetas.

Arquitectura: React frontend, TypeScript/Express backend, PostgreSQL.
Usa clean architecture pero favorece la simplicidad.
Ejecuta localmente con Docker Compose.

Por favor, rellena productBrief.md con este contexto e infiere personas
razonables, NFRs y métricas de éxito.
```

**Por qué:** 3 frases de entrada → documento rico con personas, NFRs, métricas, restricciones. Todo lo que los agentes usarán para tomar decisiones de diseño alineadas con el producto.

---

## El Flywheel de Contexto

Cada paso genera contexto que el siguiente consume. Esto es compuesto — cada tarea hace las siguientes más consistentes.

```
/banyan-init          → Estructura vacía, permisos configurados
       ↓
Seed product brief    → productBrief.md poblado con personas y NFRs
       ↓
/banyan-roadmap       → roadmap.md con features priorizadas y complejidad evaluada
       ↓
/banyan-plan          → tasks/TASK-XXX.md con spec aprobada por humano
       ↓
/banyan-build         → techContext.md + systemPatterns.md actualizados con el stack real
       ↓
/banyan-reflect       → agent-rules/_learned/ con patrones extraídos automáticamente
       ↓
/banyan-archive       → Reglas consolidadas, entorno limpio para la siguiente tarea
       ↓
Siguiente tarea       → Arranca con TODO el contexto acumulado de las anteriores
```

---

## Niveles de Complejidad

La complejidad se evalúa al crear una feature en el roadmap (o durante `/banyan-task` para L1). Las tareas heredan la complejidad de su feature vinculada.

| Nivel | Tipo de tarea | Cuándo usarlo |
|-------|---------------|---------------|
| **L1** | Bug fix, configuración, middleware, cambio simple | Una sola responsabilidad, sin ambigüedad |
| **L2** | Endpoint CRUD, módulo nuevo, feature pequeña | Multi-archivo, alguna decisión de diseño |
| **L3** | Feature compleja, múltiples fases, diseño no trivial | Cambios en arquitectura, requiere exploración |
| **L4** | Cambio arquitectónico, integración enterprise | Impacto sistémico, revisión humana crítica |

---

## Flujos de Desarrollo

### Level 1 — Flujo delgado

```
/banyan-task → /banyan-build → /banyan-archive
```

```bash
/banyan-task "Añadir CORS configuration con allowed origins, methods y headers"
/banyan-build TASK-003
/banyan-archive TASK-003
```

No tiene roadmap, planning, ni creative phase. **Sí tiene siempre:** TDD, Code Review, actualización de memoria.

**Cuándo es L1:** bug fix, añadir middleware, cambio de config, una sola responsabilidad clara.

---

### Level 2 — Flujo estándar

```
/banyan-roadmap feature create → /banyan-plan → /banyan-build → /banyan-reflect → /banyan-archive
```

```bash
/banyan-roadmap feature create "Board CRUD Endpoints con validación"
/banyan-plan FEAT-002       # Spec Writer redacta spec → tú la revisas y apruebas
/banyan-build TASK-002      # TDD + coding + review + docs
/banyan-reflect TASK-002    # (recomendado)
/banyan-archive TASK-002
```

---

### Level 3 — Flujo con diseño + bucle de build

```
/banyan-roadmap feature create → /banyan-plan → /banyan-creative
        ↓
┌──── /banyan-build TASK-XXX  (implementa fase N, hace commit, se para)
│         ↓
│     Revisión humana del resultado
│         ↓
│     ¿Quedan fases en el plan?
│         │
│    SÍ ──┘  (vuelve al inicio del bucle con la siguiente fase)
│         │
│    NO ──┴──→ /banyan-uat → /banyan-reflect → /banyan-archive
└──────────────────────────────────────────────────────────────
```

`/banyan-creative` explora alternativas antes de construir y documenta la decisión elegida. El bucle de build termina cuando todas las fases del plan están marcadas como COMPLETE en `tasks/TASK-XXX.md`.

---

### Level 4 — Flujo completo con UAT obligatorio

Idéntico a L3. Diferencias: UAT es obligatorio (no opcional), Spec Writer usa Opus en vez de Sonnet, y `/banyan-c4` está recomendado para documentar la arquitectura resultante.

---

## Los Comandos en Detalle

### `/banyan-roadmap`

Gestiona features y versiones del producto. La complejidad se evalúa al crear la feature y las tareas la heredan.

```bash
/banyan-roadmap                              # Ver roadmap completo
/banyan-roadmap feature create [nombre]      # Crear feature (evalúa complejidad)
/banyan-roadmap feature move FEAT-001 v1.0.0 # Mover a versión
/banyan-roadmap version create v1.0.0        # Crear versión
/banyan-roadmap version activate v1.0.0      # Activar (feature list se congela)
/banyan-roadmap version release v1.0.0       # Liberar (bloqueo permanente, no reversible)
```

Ramas según roadmap link: `feature/FEAT-XXX-slug`. Sin link (L1): `task/XXX`.

---

### `/banyan-plan TASK-XXX`

El Spec Writer (Opus para L4, Sonnet para L2-L3) lee el codebase y el product brief, luego redacta una especificación con:
- Criterios de aceptación
- Estrategia de tests
- Roadmap de fases de implementación
- Nivel de confianza (HIGH / MEDIUM / LOW) por ítem

**Tú revisas y apruebas** — gate humano obligatorio. La especificación es el contrato que el build respetará.

**Por qué importa:** construir sin spec = el agente inventa el comportamiento esperado. Construir con spec = el agente ejecuta criterios claros.

---

### `/banyan-build TASK-XXX`

**Propósito:** implementar UNA fase del plan, hacer commit, parar. El humano revisa y decide si continuar.

> **¿Qué es una "fase"?** El plan en `tasks/TASK-XXX.md` divide el trabajo en bloques independientes y entregables. Ejemplo: Fase 1 = modelo de datos + migraciones, Fase 2 = endpoints REST, Fase 3 = tests de integración. Cada `/banyan-build` ejecuta exactamente una de estas fases.

Pipeline de sub-agentes en secuencia:

| Step | Sub-agente | Modelo | Qué hace |
|------|-----------|--------|----------|
| 1 | Test Writer | Sonnet | Escribe tests **antes** que el código de producción |
| 2 | Coding Agent | Sonnet | Lee `systemPatterns.md`, implementa código que pase los tests |
| 3 | Test Runner | Sonnet | Ejecuta suite → verifica N/N PASS |
| 4 | Integration Verifier | Sonnet | `tsc --noEmit`, build, lint → repo compila limpio |
| 5 | Code Reviewer | Sonnet | Verifica contra Guiding Principles — **bloquea el commit si hay violaciones** |
| 6 | Documentation Agent | Haiku | Actualiza `techContext.md` y `systemPatterns.md` |
| 7 | Memory Bank Update | Haiku | Marca fase complete en `TASK-XXX.md`, actualiza `tasks.md` |

**TDD-first es no negociable:** el Test Writer siempre va antes que el Coding Agent. Los tests son la especificación ejecutable. La ambigüedad sobre el comportamiento esperado se elimina antes de escribir código de producción.

**Bucle multi-fase (L3-L4):** ejecutar `/banyan-build` una vez por fase, revisar el resultado, repetir hasta que todas las fases estén COMPLETE. Entonces pasar a `/banyan-reflect`.

---

### `/banyan-creative TASK-XXX`

Solo para L3-L4. Explora alternativas de diseño y arquitectura, documenta la decisión elegida con sus trade-offs. Output: `creative/TASK-XXX-*.md`.

**Cuándo:** cuando la solución técnica no es obvia, cuando hay múltiples enfoques viables, cuando la decisión tendrá impacto arquitectónico.

---

### `/banyan-reflect TASK-XXX`

Genera `reflection/reflection-TASK-XXX.md` con:
- Calidad de implementación
- Efectividad del workflow
- Deuda técnica identificada
- Aprendizajes para el sistema

Extrae patrones automáticamente a `agent-rules/_learned/` organizados por tema.

---

### `/banyan-archive TASK-XXX`

Cierra la tarea según la estrategia en `projectbrief.md`:

| Estrategia | Qué hace | Cuándo usar |
|---|---|---|
| `local-merge` | Merge de rama feature a main en local | Repos sin CI/CD, proyectos personales |
| `push-and-pr` | Push de la rama + crea PR automáticamente | Proyectos con revisión en equipo |

También consolida reglas aprendidas y limpia el entorno.

---

## Phase Gates — Los Guardianes del Proceso

Prerequisitos duros: no hay skip. Si intentas saltarte un paso:

```
❌ /banyan-build TASK-002  (sin plan previo)
→ HARD BLOCK: "No plan found for TASK-002. Run /banyan-plan first."
```

| Comando | Prerequisito | Por qué existe |
|---------|-------------|----------------|
| `/banyan-build` | Plan existe (`tasks/TASK-XXX.md`) | Sin plan el agente inventa los criterios |
| `/banyan-creative` | Plan existe Y complejidad >= L2 | No explorar diseño sin scope definido |
| `/banyan-reflect` | Build completado | Sin build no hay nada que reflexionar |
| `/banyan-archive` | Reflection document existe | Impide cerrar sin capturar aprendizajes |
| `/banyan-uat` | journey doc + uat-config.md + build completo | Sin config el UAT no sabe a quién emular |

---

## Sistema de Aprendizaje Continuo

```
/banyan-reflect
       ↓
Extraction Agent analiza la reflexión
       ↓
¿Patrones accionables y generalizables?
       ↓
¿Fichero de tema ya existe en _learned/?
   NO → crea nuevo fichero
   SÍ → enmienda fichero existente (añade bullet, incrementa evidence_count)
       ↓
Se registra en learning-log.md
       ↓
En el próximo /banyan-build: sub-agentes cargan reglas según
globs/topics que coincidan con los ficheros que van a tocar
       ↓
¿La regla se confirma como efectiva?
   evidence_count >= umbral → candidata a promoción de prioridad
   90 días sin refuerzo → candidata a expiración
```

**Control humano:**
- Reglas auto-generadas nacen con `priority: low` — nunca sobreescriben las tuyas
- Promover una regla: cambiar su prioridad a `medium` o `high`
- Eliminar una regla: borrar el fichero o bullet + `/banyan-rules-index`
- Máximo 10 ficheros en `_learned/` — el sistema consolida agresivamente

---

## Reglas de Agentes Personalizadas

Puedes definir reglas propias en `memory-bank/agent-rules/` que los agentes cargan según el contexto:

```markdown
---
name: TypeScript Standards
globs: ["*.ts", "*.tsx"]
paths: ["src/"]
topics: ["typescript"]
priority: medium
---

- Nunca usar `any` explícito — usar `unknown` y type-guard
- Siempre exportar interfaces, nunca types inline en los controllers
```

```bash
/banyan-rules-index    # Regenerar el índice tras añadir/modificar reglas
```

Prioridades: `low` < `medium` < `high` < `critical`

---

## Comandos Opcionales (Alto Valor, No Siempre Necesarios)

### `/banyan-uat`

UAT automatizado en Chrome real (requiere Claude-in-Chrome MCP). Toma la persona de un usuario real, recorre los user journeys documentados y emite reporte categorizado:

- **Required** — fallo de criterio, bypass RBAC, data corruption → **FAIL**
- **Recommended** — violaciones UX, accesibilidad moderada → no bloquea
- **Optional** — polish → no bloquea

Setup único antes del primer uso:
```bash
/banyan-uat-init         # URL base, personas, estrategia de auth
/banyan-ux-ingest --scaffold  # Genera ux-patterns.md
```

### `/banyan-c4`

Documentación de arquitectura C4 generada desde el codebase real (no desde memoria de entrenamiento). Bottom-up: Code → Component → Container → Context.

```bash
/banyan-c4                    # Incremental (solo lo que cambió)
/banyan-c4 --refresh          # Fuerza regeneración completa
/banyan-c4 --scope apps/api   # Solo un subtree
/banyan-c4 --dry-run          # Ver plan sin ejecutar
```

**Cuándo:** después de init en proyectos brownfield grandes, antes de planning arquitectónico L3-L4.

### `/banyan-verify TASK-XXX`

Verificación ad-hoc del código en cualquier momento. No requiere fase específica.

---

## Principios Enforced en Build

**12-Factor App:**
- Config en entorno: URLs, credentials, flags → siempre variables de entorno
- Dev/prod parity: mismo enfoque de configuración en todos los entornos

**Observability:**
- No `console.log` / `console.error` en producción — structured logging obligatorio
- Trazabilidad distribuida con W3C Trace Context

**Violaciones bloqueantes en Code Reviewer:**
- `console.log` en código de producción
- Valores hardcodeados (URLs, puertos, secrets)
- Datos sensibles en logs

---

## Referencia Rápida de Comandos

| Comando | Nivel | Cuándo | Salida principal |
|---|---|---|---|
| `/banyan-init` | Todos | Primera vez; re-ejecutar para actualizar | `memory-bank/` completo |
| `/banyan-task` | L1 | Bug fix, config, cambio simple sin planificación | `tasks.md` + `TASK-XXX.md` mínimo |
| `/banyan-roadmap` | L2-L4 | Gestionar versiones y features | `roadmap.md` actualizado |
| `/banyan-plan TASK-XXX` | L2-L4 | Antes de construir cualquier feature no trivial | `tasks/TASK-XXX.md` con plan completo |
| `/banyan-creative TASK-XXX` | L3-L4 | Decisiones de arquitectura no obvias | `creative/TASK-XXX-*.md` |
| `/banyan-build TASK-XXX` | Todos | Implementar una fase (repetir por fase) | Código en rama feature, commit |
| `/banyan-uat TASK-XXX` | L2-L4 | Después del build, antes de archivar | Informe de hallazgos, spec E2E |
| `/banyan-reflect TASK-XXX` | Todos | Después de completar todas las fases | `reflection/`, reglas en `_learned/` |
| `/banyan-archive TASK-XXX` | Todos | Después de la reflexión | merge o PR, `archive/` |
| `/banyan-verify TASK-XXX` | Ad-hoc | Verificación puntual en cualquier momento | Informe de verificación |
| `/banyan-c4` | L3-L4 | Init en brownfield; antes de planning arquitectónico | `memory-bank/c4/` |
| `/banyan-rules-index` | Ad-hoc | Después de crear/modificar `agent-rules/` | `agent-rules-index.md` |
| `/banyan-uat-init` | Una vez | Config inicial de UAT | `memory-bank/uat-config.md` |
| `/banyan-upgrade` | Mantenimiento | Al actualizar versión del plugin | `projectConfig.md` actualizado |

### Estados de una tarea

Cada tarea avanza linealmente por estos estados. El estado actual siempre está en `tasks.md` (columna Status) y en `tasks/TASK-XXX.md` (sección Execution State).

```
PLAN              → BUILD           → BUILD_COMPLETE    → REFLECT
 (/banyan-plan)     (/banyan-build,   (todas las fases    (/banyan-reflect)
                     en bucle por      COMPLETE)
                     cada fase)
    ↓
REFLECTION_COMPLETE → ARCHIVE → COMPLETE
 (/banyan-reflect)    (/banyan-archive)
```

> Los estados `BUILD` y `BUILD_COMPLETE` son los únicos que pueden repetirse — una vuelta por cada fase del plan. El resto son lineales.

---

## Lo Más Importante

**El memory bank no es documentación. Es memoria activa que cambia el output del agente.**

- `systemPatterns.md` → los agentes lo leen antes de escribir código → el código sigue los patrones del proyecto
- `productBrief.md` → los agentes lo leen antes de tomar decisiones de diseño → las features se alinean con el producto
- `agent-rules/` → los agentes cargan las reglas relevantes según los ficheros que tocan → consistencia automática

La inversión en contexto siempre paga más que la velocidad de saltarse pasos. El agente es idéntico con o sin contexto. Lo que cambia es lo que sabe cuando trabaja.

---

*Generado con análisis del repositorio BanyanBoard + workshop "Agentic Coding Week 1". Refleja BMB v1.8.4, 2026-06-15.*
