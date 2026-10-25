# Progreso: simulación de condiciones oficiales

**Actualizado:** 2026-10-25  
**Porcentaje total ponderado:** **72.9%**  
**Último commit confirmado al iniciar este bloque:** `48777aa` — Add secure server-side simulation attempts  
**Tarea activa:** Migración, despliegue y validación  
**Siguiente paso verificable:** aplicar la migración `0005` en D1 remoto antes de publicar el Worker y comprobar `/api/simulation/profiles` y la administración en el sitio desplegado.

## Regla de cálculo

El porcentaje total es la suma de `peso × avance de tarea`. Una tarea solo avanza cuando el repositorio contiene evidencia verificable: código, migración, prueba o despliegue. Los porcentajes no representan horas estimadas.

| Tarea | Peso | Avance | Estado | Evidencia versionada | Archivos afectados | Siguiente acción |
|---|---:|---:|---|---|---|---|
| Investigación y especificación oficial | 10% | 100% | Completada | `553594c`; fuentes, fecha y restricciones documentadas | `docs/especificacion-simulacion-condiciones-oficiales.md` | Revisar fuentes cuando Anthropic publique una guía nueva |
| Blueprint versionado y cuotas | 10% | 100% | Completada | Configuración y prueba de cuotas en este bloque | `build/official_profiles.py`, `tests/test_official_profiles.py` | Usar estos perfiles como única fuente de selección |
| Banco seguro y claves privadas | 18% | 90% | En curso | Banco Worker generado con claves privadas; selector y prueba demuestran que la carga pública no contiene `answer` | `build/build.py`, `src/generated/simulation-data.js`, `src/simulation.mjs`, `tests/simulation.test.mjs` | Comprobar el endpoint real al habilitar el primer perfil editorial |
| Migración D1 y API de intentos | 12% | 85% | En curso | Migración 0005 y endpoints para inicio, avance, envío, vencimiento y corrección servidor; bundle validado en seco | `migrations/0005_simulation_attempts.sql`, `src/index.js`, `src/simulation.mjs` | Aplicar migración remota y recorrer un intento habilitado |
| Interfaz de simulación | 14% | 90% | En curso | Página inglesa de simulación, reloj según vencimiento, navegación, marcas, reanudación y resultado agregado; prueba verifica que el HTML no contiene campo de claves | `build/simulation.html`, `examenes/simulation.html`, `src/index.js`, `tests/simulation.test.mjs` | Recorrerla contra un perfil editorial habilitado |
| Integridad y panel administrativo | 10% | 90% | En curso | Eventos mínimos en D1; panel filtra por modo, muestra vencimiento, versión, índice, debilidad y detalle bajo demanda sin respuestas ni claves | `src/index.js`, `src/simulation.mjs`, `migrations/0005_simulation_attempts.sql`, `build/admin.html`, `examenes/admin.html` | Validar panel con D1 remoto migrado y un intento habilitado |
| Contenido y revisión editorial | 16% | 0% | Bloqueada por cobertura editorial | La especificación documenta que el banco actual no alcanza tres formularios por dominio | `docs/especificacion-simulacion-condiciones-oficiales.md` | Clasificar y revisar contenido inglés; completar tres formularios por perfil |
| Pruebas automatizadas | 7% | 70% | En curso | Cuotas Python; selección, ausencia de claves, corrección de múltiple respuesta, restauración, vencimiento y verificación del HTML público; `wrangler deploy --dry-run` válido | `tests/test_official_profiles.py`, `tests/simulation.test.mjs` | Añadir prueba de API D1 y recorrido navegador con un perfil habilitado |
| Migración, despliegue y validación | 3% | 0% | Pendiente | — | — | Aplicar migraciones, desplegar y recorrer un intento real |

## Bloqueadores

1. **Cobertura editorial:** ningún perfil debe marcarse disponible hasta tener tres veces la cuota de cada dominio, preguntas originales y revisión en inglés. El banco actual tiene 100 preguntas por examen, pero todavía no está clasificado por toda la taxonomía oficial de CCAO-F, CCDV-F y CCAR-P.
2. **Despliegue D1:** las migraciones futuras requieren aplicarse en la base remota antes de habilitar los endpoints correspondientes.

## Bitácora de evidencia

| Fecha | Commit | Resultado comprobable |
|---|---|---|
| 2026-10-25 | `553594c` | Especificación con fuentes oficiales, perfiles, seguridad y puerta editorial. |
| 2026-10-25 | `fe65692` | Blueprints, cálculo de cuotas, separación inicial de banco privado y prueba de cuotas. |
| 2026-10-25 | `48777aa` | Worker, migración D1, selección segura, corrección servidor y pruebas de unidad. |
| 2026-10-25 | Pendiente al confirmar este bloque | Interfaz inglesa, panel de simulación, detalles privados de integridad y pruebas del HTML público. |

## Protocolo de continuación

1. Leer este archivo y `docs/especificacion-simulacion-condiciones-oficiales.md`.
2. Ejecutar `git status --short` y `git log -1 --oneline`.
3. Retomar solo la **tarea activa** y comprobar su criterio de cierre.
4. Ejecutar las verificaciones relacionadas con el bloque.
5. Actualizar esta tabla, la bitácora, el porcentaje ponderado y el siguiente paso.
6. Crear un commit descriptivo y enviar a `main` antes de pasar a otra tarea.

No se marca una tarea como completa sin evidencia localizable en Git.
