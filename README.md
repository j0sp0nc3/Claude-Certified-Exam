# Claude Certified Exam – Simulacros de práctica

Simulacros de examen para preparar al equipo en las cuatro certificaciones de Claude:

| Archivo | Certificación | Banco | Por intento |
|---|---|---|---|
| `examenes/01-CCAO-F-Associate.html` | Claude Certified Associate, Foundations (CCAO-F) | 100 | 50 |
| `examenes/02-CCDV-F-Developer.html` | Claude Certified Developer, Foundations (CCDV-F) | 100 | 50 |
| `examenes/03-CCAR-F-Architect-Foundations.html` | Claude Certified Architect, Foundations (CCAR-F) | 100 | 50 |
| `examenes/04-CCAR-P-Architect-Professional.html` | Claude Certified Architect, Professional (CCAR-P) | 100 | 50 |

> Material de práctica para entrenamiento interno. **No es contenido oficial de Anthropic** ni reproduce preguntas del examen real.

## Cómo funciona

- Cada intento sortea **50 preguntas** del banco de 100, respetando la cuota de cada dominio (10 por dominio; en CCAR-F 13/9/10/10/8 según el peso oficial).
- Dos tipos de pregunta:
  - **Alternativa única**: 4 opciones, una correcta.
  - **Selección múltiple**: 5 opciones, se indica cuántas elegir (2 o 3). Puntúa solo si se aciertan todas.
- Orden de preguntas y opciones aleatorio, 90 minutos con envío automático al agotarse el tiempo, aprobación con 72 %.
- Al finalizar se muestra el puntaje, el resultado por dominio y la revisión con explicaciones.
- El resultado se envía por correo a `jponce@nxtara.com` mediante [FormSubmit](https://formsubmit.co). El primer envío dispara un correo de activación que debe confirmarse. Si el envío falla, la página ofrece enviarlo con el cliente de correo del usuario.

## Estructura

```
build/
  template.html          # Motor del examen (HTML/CSS/JS)
  exam_*.py              # Preguntas 1-50 de cada examen (dominios, metadatos)
  exam_*_2.py            # Preguntas 51-100 de cada examen
  build.py               # Genera examenes/*.html
examenes/                # HTML generados (lo que se publica)
wrangler.jsonc           # Despliegue como Cloudflare Worker (assets estáticos)
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

```bash
npx wrangler login
npx wrangler deploy
```

Publica `examenes/` como sitio estático en `https://simulacros-claude.<cuenta>.workers.dev/`. Para restringir el acceso al equipo, se puede proteger con Cloudflare Access.

## Limitaciones

Las respuestas viajan dentro del HTML (codificadas, no cifradas); una persona con conocimientos técnicos podría verlas. Es adecuado para práctica, no para evaluaciones con valor formal. Para eso conviene mover la corrección y el envío del correo a un Worker con lógica de servidor.
