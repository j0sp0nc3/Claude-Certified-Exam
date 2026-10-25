# Claude Certified Exam – Simulacros de práctica

Simulacros de examen en español e inglés para preparar al equipo en las cuatro certificaciones de Claude. El selector de idioma aparece en cada página y recuerda la preferencia en ese navegador:

| Archivo | Certificación | Banco | Por intento |
|---|---|---|---|
| `examenes/01-CCAO-F-Associate.html` | Claude Certified Associate, Foundations (CCAO-F) | 100 | 60 |
| `examenes/02-CCDV-F-Developer.html` | Claude Certified Developer, Foundations (CCDV-F) | 100 | 53 |
| `examenes/03-CCAR-F-Architect-Foundations.html` | Claude Certified Architect, Foundations (CCAR-F) | 100 | 60 |
| `examenes/04-CCAR-P-Architect-Professional.html` | Claude Certified Architect, Professional (CCAR-P) | 100 | 63 |

> Material de práctica para entrenamiento interno. **No es contenido oficial de Anthropic** ni reproduce preguntas del examen real.

## Cómo funciona

- El correo del participante se valida por formato y contra las reglas de admisión configuradas en el panel.
- Cada intento sortea la cantidad de preguntas configurada para el examen desde el banco de 100. La distribución usa las cuotas definidas en el generador.
- Dos tipos de pregunta:
  - **Alternativa única**: 4 opciones, una correcta.
  - **Selección múltiple**: 5 opciones, se indica cuántas elegir (2 o 3). Puntúa solo si se aciertan todas.
- Orden de preguntas y opciones aleatorio; navegación de una pregunta a la vez, botones anterior/siguiente y marca de preguntas para revisar.
- Tiempo límite de 120 minutos con envío automático al agotarse el tiempo. El 72 % es un umbral interno de práctica y no convierte el puntaje a la escala oficial 720/1000.
- Antes de comenzar se elige **Con feedback** (verificación inmediata, bloqueo de la respuesta, explicación y recurso oficial) o **Sin feedback** (solo puntaje global y por dominio al terminar, sin revisión individual). La práctica guiada también permite revisar explicaciones al finalizar. Preguntas, alternativas y explicaciones están disponibles en ambos idiomas; las fuentes oficiales de los recursos se indican en inglés.
- Tras recargar, **Reanudar práctica guardada** recupera el intento en la misma pestaña, conservando preguntas, respuestas, modalidad, verificaciones y reloj. Un resultado que no pudo guardarse se conserva para reintento. La copia usa `sessionStorage`: no es reanudación entre dispositivos o tras cerrar definitivamente la pestaña.
- Las traducciones al inglés se generaron automáticamente; revísalas antes de usarlas como material formal de evaluación.
- El avance se guarda mientras la persona responde y el resultado al terminar se conserva en Cloudflare D1.
- El panel privado `/admin.html` se actualiza cada cinco segundos y permite observar quién está conectado, la pregunta actual, el avance, las marcas y los tiempos. Muestra aciertos y porcentaje por área, destaca el área más débil y exporta ese desglose a CSV. Permite filtrar por dominio o correo exacto; no muestra las respuestas elegidas durante el examen.

## Estructura

```
build/
  template.html          # Motor del examen (HTML/CSS/JS)
  exam_*.py              # Preguntas 1-50 de cada examen (dominios, metadatos)
  exam_*_2.py            # Preguntas 51-100 de cada examen
  translations_en.json   # Traducciones inglesas del banco (identificadas por pregunta original)
  translate_banks_en.py  # Regenera traducciones si cambia el banco (con conexión a Internet)
  i18n.js                # Selector de idioma y traducciones de interfaz
  build.py               # Genera examenes/*.html
examenes/                # HTML generados (lo que se publica)
wrangler.jsonc           # Despliegue como Cloudflare Worker (assets estáticos)
src/index.js             # API de registro y consulta protegida
migrations/              # Esquema de la base D1
```

## Editar preguntas

Formato de cada pregunta en los archivos `build/exam_*.py`:

```python
# Alternativa única: correcta como texto + 3 distractores
(DOMINIO, "Pregunta", "Respuesta correcta", ["Distractor 1", "Distractor 2", "Distractor 3"], "Explicación")

# Selección múltiple: correctas como lista (2 o 3) + distractores (total 5 opciones)
(DOMINIO, "Selecciona las DOS …", ["Correcta 1", "Correcta 2"], ["Distractor 1", "Distractor 2", "Distractor 3"], "Explicación")
```

Las correctas se escriben primero; el orden se baraja al mostrarse. Texto entre backticks se muestra como código.

Regenerar los HTML (requiere Python 3):

```bash
python build/build.py
```

El script valida que haya 100 preguntas por examen, sin duplicados, y suficientes por dominio.

También valida que cada área de Estudio tenga recursos oficiales en `build/practice_resources.py`. La [rúbrica editorial](docs/rubrica-editorial-preguntas.md) describe los requisitos para nuevas preguntas y revisión técnica. La existencia de recursos no implica que el banco actual ya esté reclasificado al blueprint oficial.

Si se edita una pregunta, añade la traducción correspondiente a `build/translations_en.json` o vuelve a generarlas con `python build/translate_banks_en.py` antes de reconstruir los HTML.

## Despliegue en Cloudflare Workers

El repositorio está conectado a Cloudflare Workers Builds: cada push a `main` ejecuta `npx wrangler deploy` y publica automáticamente.

Sitio: https://claude-certified-exam.beroiza79.workers.dev/

### Registro y consulta de resultados

La base D1 `claude-exam-results` está enlazada en `wrangler.jsonc`. Aplica las migraciones desde una terminal autenticada con:

```bash
npx wrangler d1 migrations apply claude-exam-results --remote
```

También puedes abrir la base en Cloudflare Dashboard → **D1 SQL Database** → **Console** y ejecutar el contenido de los archivos de `migrations/` en orden.

La migración `0007_practice_feedback.sql` crea una tabla independiente para modalidad y preguntas verificadas, manteniendo `study` como modo principal. El primer guardado de una modalidad nueva también provisiona esa misma tabla de forma idempotente, para conservar compatibilidad con despliegues donde la migración administrativa siga pendiente. Los intentos anteriores se muestran como **Estudio anterior**. El panel y el CSV incluyen la modalidad elegida.

### Simulación de condiciones oficiales

`/simulation.html` es una experiencia separada de **Estudio**: funciona solo en inglés, dura 120 minutos, corrige en el Worker y entrega un Índice de preparación. Nunca calcula una equivalencia con un puntaje oficial.

Antes de iniciar se aceptan condiciones cerradas sin notas, documentación, traductor ni asistentes de IA. No ofrece feedback individual ni un selector de feedback.

Antes de habilitar una certificación, aplica las migraciones `0005` y `0006` y carga sus preguntas originales revisadas en el banco privado D1. Sus enunciados y claves no se versionan en Git ni se publican como assets. El modo Estudio mantiene sus explicaciones y claves visibles para aprendizaje, así que no se reutiliza como banco de simulación. Consulta [la guía de carga privada](docs/carga-banco-privado-simulacion.md).

Antes de consultar el panel, crea un secreto `ADMIN_TOKEN` en Workers & Pages → `claude-certified-exam` → **Settings** → **Variables and Secrets**. Usa una clave aleatoria privada y no la guardes en Git. Después abre `/admin.html` e ingresa esa clave para revisar intentos, exportarlos a CSV y configurar la admisión.

En el panel privado, **Admisión al examen** mantiene reglas individuales en una tabla: hasta 50 dominios y 100 correos exactos. Un participante puede iniciar si coincide con cualquiera de las reglas; el Worker genera una expresión regular segura para cada entrada y la evalúa antes de iniciar y al guardar el avance. El valor inicial es `nxtara.com`; modifica, agrega o quita reglas desde el panel y pulsa **Guardar reglas**. Un campo de correo no verifica quién es su dueño: para comprobar identidad, protege también el sitio con Cloudflare Access y One-time PIN.

Cada intento registra la hora de entrada al comenzar y la hora de salida al enviar el examen o abandonar la página. El panel y el CSV muestran ambas marcas; los intentos sin salida confirmada aparecen como tales.

Despliegue manual (opcional):

```bash
npx wrangler login
npx wrangler deploy
```

Publica `examenes/` como sitio estático en esa URL. Para restringir el acceso al equipo, se puede proteger con Cloudflare Access.

## Limitaciones

El permiso de admisión compara el correo ingresado con el dominio o la lista configurada; por sí solo no verifica la identidad de la persona. Para verificar identidad, activar Cloudflare Access con código de un solo uso (One-time PIN).

Las respuestas correctas viajan dentro del HTML y la puntuación se calcula en el navegador; una persona con conocimientos técnicos podría verlas o alterar un resultado. El panel sirve para seguimiento de práctica, no para una evaluación formal supervisada.

Esta limitación aplica al modo **Estudio**. La Simulación de condiciones oficiales permanece no disponible hasta que exista un banco privado D1 con cobertura revisada para tres formularios por dominio.

## Verificación y continuidad

Con Node 24 y Python 3:

```powershell
node --test tests/practice.test.mjs tests/simulation.test.mjs
python -m unittest tests/test_official_profiles.py
```

El recorrido local de navegador usa Playwright disponible en `node_modules` o `NODE_PATH`: `node --test tests/practice.browser.cjs`. Por defecto usa Edge en Windows; puede elegirse otro navegador instalado con `PLAYWRIGHT_CHANNEL`. Usa perfiles aislados y un servidor local; no crea participantes en producción.

El estado de ejecución está en [el tablero de Práctica](docs/progreso-practica-feedback.md) y [el tablero de Simulación](docs/progreso-simulacion-condiciones-oficiales.md). No se consideran completadas migraciones ni revisiones editoriales sin evidencia.
