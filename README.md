# Claude Certified Exam – Simulacros de práctica

Simulacros de examen para preparar al equipo en las cuatro certificaciones de Claude:

| Archivo | Certificación | Banco | Por intento |
|---|---|---|---|
| `examenes/01-CCAO-F-Associate.html` | Claude Certified Associate, Foundations (CCAO-F) | 100 | 60 |
| `examenes/02-CCDV-F-Developer.html` | Claude Certified Developer, Foundations (CCDV-F) | 100 | 53 |
| `examenes/03-CCAR-F-Architect-Foundations.html` | Claude Certified Architect, Foundations (CCAR-F) | 100 | 60 |
| `examenes/04-CCAR-P-Architect-Professional.html` | Claude Certified Architect, Professional (CCAR-P) | 100 | 63 |

> Material de práctica para entrenamiento interno. **No es contenido oficial de Anthropic** ni reproduce preguntas del examen real.

## Cómo funciona

- El correo del participante se valida por formato; acepta cualquier dominio.
- Cada intento sortea la cantidad de preguntas configurada para el examen desde el banco de 100. La distribución usa las cuotas definidas en el generador.
- Dos tipos de pregunta:
  - **Alternativa única**: 4 opciones, una correcta.
  - **Selección múltiple**: 5 opciones, se indica cuántas elegir (2 o 3). Puntúa solo si se aciertan todas.
- Orden de preguntas y opciones aleatorio; navegación de una pregunta a la vez, botones anterior/siguiente y marca de preguntas para revisar.
- Tiempo límite de 120 minutos con envío automático al agotarse el tiempo. El 72 % es un umbral interno de práctica y no convierte el puntaje a la escala oficial 720/1000.
- Al finalizar se muestra el puntaje, el resultado por área del banco y la revisión con explicaciones. El examen oficial es en inglés y a libro cerrado; este simulacro está en español y no está supervisado.
- El avance se guarda mientras la persona responde y el resultado al terminar se conserva en Cloudflare D1.
- El panel privado en `/admin.html` permite revisar avances y resultados, filtrar y descargar CSV.

## Estructura

```
build/
  template.html          # Motor del examen (HTML/CSS/JS)
  exam_*.py              # Preguntas 1-50 de cada examen (dominios, metadatos)
  exam_*_2.py            # Preguntas 51-100 de cada examen
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

## Despliegue en Cloudflare Workers

El repositorio está conectado a Cloudflare Workers Builds: cada push a `main` ejecuta `npx wrangler deploy` y publica automáticamente.

Sitio: https://claude-certified-exam.beroiza79.workers.dev/

### Registro y consulta de resultados

La base D1 `claude-exam-results` está enlazada en `wrangler.jsonc`. Inicializa sus tablas desde una terminal autenticada con:

```bash
npx wrangler d1 migrations apply claude-exam-results --remote
```

También puedes abrir la base en Cloudflare Dashboard → **D1 SQL Database** → **Console** y ejecutar el contenido de `migrations/0001_attempts.sql`.

Antes de consultar el panel, crea un secreto `ADMIN_TOKEN` en Workers & Pages → `claude-certified-exam` → **Settings** → **Variables and Secrets**. Usa una clave aleatoria privada y no la guardes en Git. Después abre `/admin.html` e ingresa esa clave para revisar intentos o exportarlos a CSV.

Despliegue manual (opcional):

```bash
npx wrangler login
npx wrangler deploy
```

Publica `examenes/` como sitio estático en esa URL. Para restringir el acceso al equipo, se puede proteger con Cloudflare Access.

## Limitaciones

La validación del correo es solo de formato en el navegador. Para restringir quién accede, activar Cloudflare Access con código de un solo uso (One-time PIN).

Las respuestas viajan dentro del HTML (codificadas, no cifradas); una persona con conocimientos técnicos podría verlas. Es adecuado para práctica, no para evaluaciones con valor formal. Para eso conviene mover la corrección y el envío del correo a un Worker con lógica de servidor.
