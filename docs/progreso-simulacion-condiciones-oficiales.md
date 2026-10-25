# Progreso: simulación de condiciones oficiales

**Actualizado:** 2026-10-25  
**Porcentaje total ponderado:** **23.6%**  
**Último commit confirmado al iniciar este bloque:** `553594c` — Document official-conditions simulation specification  
**Tarea activa:** Banco seguro y claves privadas  
**Siguiente paso verificable:** importar el banco privado en el Worker y comprobar que el endpoint de inicio devuelve preguntas sin la propiedad `answer`.

## Regla de cálculo

El porcentaje total es la suma de `peso × avance de tarea`. Una tarea solo avanza cuando el repositorio contiene evidencia verificable: código, migración, prueba o despliegue. Los porcentajes no representan horas estimadas.

| Tarea | Peso | Avance | Estado | Evidencia versionada | Archivos afectados | Siguiente acción |
|---|---:|---:|---|---|---|---|
| Investigación y especificación oficial | 10% | 100% | Completada | `553594c`; fuentes, fecha y restricciones documentadas | `docs/especificacion-simulacion-condiciones-oficiales.md` | Revisar fuentes cuando Anthropic publique una guía nueva |
| Blueprint versionado y cuotas | 10% | 100% | Completada | Configuración y prueba de cuotas en este bloque | `build/official_profiles.py`, `tests/test_official_profiles.py` | Usar estos perfiles como única fuente de selección |
| Banco seguro y claves privadas | 18% | 20% | En curso | Generador separa el banco Worker de los HTML de Estudio en este bloque | `build/build.py`, `src/generated/simulation-data.js` | Exponer preguntas seguras desde el Worker y no las claves |
| Migración D1 y API de intentos | 12% | 0% | Pendiente | — | — | Crear esquema de intentos/eventos y endpoints de inicio, avance, envío y vencimiento |
| Interfaz de simulación | 14% | 0% | Pendiente | — | — | Crear pantalla de simulación en inglés, navegación y marcas |
| Integridad y panel administrativo | 10% | 0% | Pendiente | — | — | Registrar eventos mínimos y añadir vista privada de simulaciones |
| Contenido y revisión editorial | 16% | 0% | Bloqueada por cobertura editorial | La especificación documenta que el banco actual no alcanza tres formularios por dominio | `docs/especificacion-simulacion-condiciones-oficiales.md` | Clasificar y revisar contenido inglés; completar tres formularios por perfil |
| Pruebas automatizadas | 7% | 14% | En curso | Pruebas de cuotas ejecutadas correctamente: `python -m unittest tests/test_official_profiles.py` | `tests/test_official_profiles.py` | Añadir pruebas de selección, tiempo, corrección y ausencia de claves |
| Migración, despliegue y validación | 3% | 0% | Pendiente | — | — | Aplicar migraciones, desplegar y recorrer un intento real |

## Bloqueadores

1. **Cobertura editorial:** ningún perfil debe marcarse disponible hasta tener tres veces la cuota de cada dominio, preguntas originales y revisión en inglés. El banco actual tiene 100 preguntas por examen, pero todavía no está clasificado por toda la taxonomía oficial de CCAO-F, CCDV-F y CCAR-P.
2. **Despliegue D1:** las migraciones futuras requieren aplicarse en la base remota antes de habilitar los endpoints correspondientes.

## Bitácora de evidencia

| Fecha | Commit | Resultado comprobable |
|---|---|---|
| 2026-10-25 | `553594c` | Especificación con fuentes oficiales, perfiles, seguridad y puerta editorial. |
| 2026-10-25 | Pendiente al confirmar este bloque | Blueprints, cálculo de cuotas, separación inicial de banco privado y prueba de cuotas. |

## Protocolo de continuación

1. Leer este archivo y `docs/especificacion-simulacion-condiciones-oficiales.md`.
2. Ejecutar `git status --short` y `git log -1 --oneline`.
3. Retomar solo la **tarea activa** y comprobar su criterio de cierre.
4. Ejecutar las verificaciones relacionadas con el bloque.
5. Actualizar esta tabla, la bitácora, el porcentaje ponderado y el siguiente paso.
6. Crear un commit descriptivo y enviar a `main` antes de pasar a otra tarea.

No se marca una tarea como completa sin evidencia localizable en Git.
