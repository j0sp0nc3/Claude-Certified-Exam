# Progreso: Práctica con feedback

**Actualizado:** 2026-10-25. **Avance ponderado:** 98%. **Último commit de implementación verificado:** `c79d52d`.
**Tarea activa:** Validación administrativa y de guardado D1 en producción.
**Siguiente paso verificable:** con acceso administrativo, realizar un intento autorizado en cada modalidad y confirmar su registro en `/admin.html`; aplicar las migraciones remotas pendientes con autenticación Cloudflare.

Este tablero cubre la ampliación de Práctica. El tablero de [simulación](progreso-simulacion-condiciones-oficiales.md) conserva sus pesos originales y su 70.8%; no se le atribuye cobertura editorial por esta ampliación.

| Tarea | Peso | Avance | Evidencia y archivos | Siguiente acción |
|---|---:|---:|---|---|
| Especificación y rúbrica | 15% | 100% | Especificación actualizada y `docs/rubrica-editorial-preguntas.md`; fuentes oficiales consultadas el 25-10-2026 | Aplicar la rúbrica al revisar contenido, no marcar bancos como revisados por existir el documento |
| Flujo bilingüe y reanudación | 25% | 100% | `build/template.html` y cuatro HTML generados: verificar, bloquear, ocultar revisión en modalidad sin feedback; snapshot de sesión con versión | Mantener la recuperación de resultados pendientes |
| Persistencia compatible | 20% | 100% | `src/index.js`, `src/practice.mjs`, migración 0007; lote transaccional y provisión idempotente de tabla independiente | Confirmar primer guardado remoto de la nueva modalidad |
| Recursos oficiales | 10% | 100% | `build/practice_resources.py` cubre las 20 áreas actuales; generador valida cobertura y publica títulos bilingües | Revalidar enlaces al cambiar fuentes o taxonomía |
| Administración y CSV | 10% | 100% | `build/admin.html`; modalidad actual e intentos anteriores; consulta compatible sin 0005 | Confirmar con clave administrativa en producción |
| Pruebas | 15% | 100% | `tests/practice.test.mjs`, `tests/practice.browser.cjs`; pruebas SQLite y navegador aislado, más regresión de simulación y cuotas | Ejecutar al modificar contratos de feedback |
| Publicación y comprobación remota | 5% | 60% | `c79d52d` enviado a `main`; Workers Builds exitoso, versión `9e9b0c32-fc34-4bee-8ffd-18ab9c2e6bfe`; HTML y contrato de validación API confirmados por HTTPS | Confirmar guardado y consulta administrativa con participante autorizado; no se insertaron registros ficticios en producción |

**Cálculo:** 15 + 25 + 20 + 10 + 10 + 15 + 3 = **98%**.

## Verificaciones de este bloque

- Generación de cuatro bancos de 100 y cobertura de recursos: correcta.
- Node: 9 pruebas de Worker/SQLite y simulación aprobadas. Python: 2 pruebas de cuotas aprobadas.
- Navegador aislado: 16 combinaciones de las cuatro certificaciones, ambas modalidades y ambos idiomas; pregunta múltiple en cada intento; bloqueo y reanudación; recuperación de envío fallido; ausencia de revisión sin feedback; aceptación de condiciones de simulación. Vista móvil inspeccionada visualmente.
- `wrangler deploy --dry-run`: bundle correcto, enlaces D1 y assets presentes.
- Wrangler `whoami`: falla al renovar token, devuelve “Not logged in”. Por ello no se afirma aplicación remota de 0005/0006 ni carga de banco privado.
- GitHub Check Run **Workers Builds: claude-certified-exam**: `completed/success` para `c79d52d`; build `d08ca092-d2ed-4bc3-806c-31e895840a15`.
- Producción: HTTP 200 y selector de feedback presente en las cuatro páginas de práctica; `/admin.html` incluye modalidad y CSV; `/simulation.html` incluye aceptación previa. El Worker rechaza con 400 una modalidad no válida antes de escribir datos, confirmando que también se publicó la nueva API.
- `/api/simulation/profiles` continúa indicando `Private question bank migration is pending.` en los cuatro perfiles. No se dispone de un archivo privado de contenido aprobado ni autenticación Cloudflare vigente para resolverlo en este bloque.

## Continuación

Leer este tablero y los dos documentos de simulación; comprobar `git status` y último commit. Retomar publicación. Versionar evidencia al terminar cada bloque y calcular siempre la suma ponderada. No habilitar simulaciones hasta completar su cobertura y revisiones privadas.
