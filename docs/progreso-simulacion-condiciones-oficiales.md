# Progreso: simulación de condiciones oficiales

**Actualizado:** 2026-10-25  
**Porcentaje total ponderado:** **70.8%**
**Último commit confirmado al iniciar este bloque:** `42bd17d` — Show simulation bank coverage in admin  
**Tarea activa:** Migración, despliegue y validación  
**Siguiente paso verificable:** aplicar las migraciones `0005` y `0006` en D1 remoto, cargar el primer banco privado aprobado y comprobar `/api/simulation/profiles` y la administración en el sitio desplegado.

## Regla de cálculo

El porcentaje total es la suma de `peso × avance de tarea`. Una tarea solo avanza cuando el repositorio contiene evidencia verificable: código, migración, prueba o despliegue. Los porcentajes no representan horas estimadas.

| Tarea | Peso | Avance | Estado | Evidencia versionada | Archivos afectados | Siguiente acción |
|---|---:|---:|---|---|---|---|
| Investigación y especificación oficial | 10% | 100% | Completada | `553594c`; fuentes, fecha y restricciones documentadas | `docs/especificacion-simulacion-condiciones-oficiales.md` | Revisar fuentes cuando Anthropic publique una guía nueva |
| Blueprint versionado y cuotas | 10% | 100% | Completada | Configuración y prueba de cuotas en este bloque | `build/official_profiles.py`, `tests/test_official_profiles.py` | Usar estos perfiles como única fuente de selección |
| Banco seguro y claves privadas | 18% | 70% | En curso | El repositorio contiene solo metadata de blueprint; banco y claves pasarán a D1 privado. Pruebas verifican que ni HTML ni metadata versionada llevan claves | `build/build.py`, `src/generated/simulation-profiles.js`, `src/simulation.mjs`, `migrations/0006_private_simulation_bank.sql`, `tests/simulation.test.mjs` | Aplicar 0006 y cargar banco privado revisado |
| Migración D1 y API de intentos | 12% | 80% | En curso | Endpoints de inicio, avance, envío, vencimiento y corrección consultan banco D1 privado; bundle validado en seco | `migrations/0005_simulation_attempts.sql`, `migrations/0006_private_simulation_bank.sql`, `src/index.js`, `src/simulation.mjs` | Aplicar migraciones remotas y recorrer un intento habilitado |
| Interfaz de simulación | 14% | 90% | En curso | Página inglesa de simulación, reloj según vencimiento, navegación, marcas, reanudación y resultado agregado; prueba verifica que el HTML no contiene campo de claves | `build/simulation.html`, `examenes/simulation.html`, `src/index.js`, `tests/simulation.test.mjs` | Recorrerla contra un perfil editorial habilitado |
| Integridad y panel administrativo | 10% | 95% | En curso | Eventos mínimos en D1; panel filtra por modo, muestra vencimiento, versión, índice, debilidad y detalle bajo demanda sin respuestas ni claves. Además muestra la cobertura privada requerida por dominio | `src/index.js`, `src/simulation.mjs`, `migrations/0005_simulation_attempts.sql`, `build/admin.html`, `examenes/admin.html` | Validar panel con D1 remoto migrado y un intento habilitado |
| Contenido y revisión editorial | 16% | 0% | Bloqueada por cobertura editorial | La especificación documenta que el banco actual no alcanza tres formularios por dominio | `docs/especificacion-simulacion-condiciones-oficiales.md` | Clasificar y revisar contenido inglés; completar tres formularios por perfil |
| Pruebas automatizadas | 7% | 75% | En curso | Cuotas Python; selección, ausencia de claves en HTML y metadata; corrección de múltiple respuesta, restauración y vencimiento; `wrangler deploy --dry-run` válido | `tests/test_official_profiles.py`, `tests/simulation.test.mjs` | Añadir prueba de API D1 y recorrido navegador con un perfil habilitado |
| Migración, despliegue y validación | 3% | 40% | En curso | Workers Builds publicó interfaz, panel y endpoint de perfiles; ejecución remota de Wrangler bloqueada por token local inválido | `535751c`, comprobación HTTPS de `/simulation.html` y `/api/simulation/profiles` | Aplicar 0005/0006 con credencial Cloudflare y validar D1 |

## Bloqueadores

**Ampliación de Práctica:** seguimiento independiente en [progreso-practica-feedback.md](progreso-practica-feedback.md). Añade feedback inmediato opcional, reanudación y recursos; no aumenta la cobertura del banco privado ni el porcentaje de este tablero. La simulación incorpora aceptación previa de condiciones de libro cerrado.

1. **Cobertura editorial:** ningún perfil debe marcarse disponible hasta tener tres veces la cuota de cada dominio, preguntas originales y revisión en inglés. El banco actual tiene 100 preguntas por examen, pero todavía no está clasificado por toda la taxonomía oficial de CCAO-F, CCDV-F y CCAR-P.
2. **Despliegue D1:** `0005` y `0006` aún requieren aplicarse en la base remota. Wrangler no pudo autenticarse porque falta `CLOUDFLARE_API_TOKEN` válido en esta sesión.
3. **Banco privado:** no se debe cargar contenido ni claves de simulación en Git, assets estáticos o el banco de Estudio. La primera carga debe permanecer en un archivo privado y ser revisada antes de marcar filas como `approved`.

## Bitácora de evidencia

| Fecha | Commit | Resultado comprobable |
|---|---|---|
| 2026-10-25 | `553594c` | Especificación con fuentes oficiales, perfiles, seguridad y puerta editorial. |
| 2026-10-25 | `fe65692` | Blueprints, cálculo de cuotas, separación inicial de banco privado y prueba de cuotas. |
| 2026-10-25 | `48777aa` | Worker, migración D1, selección segura, corrección servidor y pruebas de unidad. |
| 2026-10-25 | `535751c` | Interfaz inglesa, panel de simulación, detalles privados de integridad y pruebas del HTML público. |
| 2026-10-25 | `5b4520f` | Banco privado D1, eliminación de claves versionadas, validación de metadata y migración 0006. |
| 2026-10-25 | Verificado en producción | Workers Builds publica `simulation.html`; `/api/simulation/profiles` responde cuatro perfiles y señala correctamente que el banco privado aún requiere migración. |
| 2026-10-25 | `42bd17d` | El panel administrativo incorpora la matriz de cobertura privada por certificación y dominio. |
| 2026-10-25 | Verificado en producción | `/admin.html` muestra la matriz de cobertura; `/api/simulation/profiles` responde 200 y mantiene los perfiles bloqueados hasta aplicar la migración privada. |
| 2026-10-25 | `c79d52d` | Práctica opcional con feedback, reanudación y recursos; nueva tabla 0007 compatible con Study; simulación exige aceptación de condiciones cerradas. Workers Builds completado y nueva interfaz/API confirmadas en producción. No se modificó el 70.8% de simulación: siguen pendientes migraciones y banco privado. |

## Protocolo de continuación

1. Leer este archivo y `docs/especificacion-simulacion-condiciones-oficiales.md`.
2. Ejecutar `git status --short` y `git log -1 --oneline`.
3. Retomar solo la **tarea activa** y comprobar su criterio de cierre.
4. Ejecutar las verificaciones relacionadas con el bloque.
5. Actualizar esta tabla, la bitácora, el porcentaje ponderado y el siguiente paso.
6. Crear un commit descriptivo y enviar a `main` antes de pasar a otra tarea.

No se marca una tarea como completa sin evidencia localizable en Git.
