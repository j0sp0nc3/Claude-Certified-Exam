# Rúbrica editorial de preguntas originales

**Versión:** 2026-10-25-v1. **Estado:** criterio para revisión; no certifica el banco existente.

## Fuentes y realismo

El alcance de cada pregunta deriva de la guía oficial vigente enlazada en la [especificación](especificacion-simulacion-condiciones-oficiales.md). Las muestras públicas de las guías orientan formato y estilo; no se usarán preguntas filtradas ni se copiarán bancos de terceros.

La dificultad objetivo se basa en razonamiento aplicado: elegir una solución dadas restricciones explícitas, diagnosticar un problema o evaluar una decisión. No se afirmará equivalencia psicométrica con el examen oficial: no se dispone de su calibración, dificultad de ítems ni conversión a puntaje escalado.

## Requisitos por pregunta

| Aspecto | Criterio de aprobación |
|---|---|
| Identidad | ID estable, certificación, versión de blueprint, dominio oficial y objetivo o task statement trazable. |
| Escenario | Rol, situación y decisión concreta; restricciones de costo, latencia, seguridad, calidad o proceso cuando sean relevantes. Evitar texto decorativo. |
| Razonamiento | Associate: decisiones de uso y validación; Developer: integración, API y diagnóstico; Architect Foundations: diseño y orquestación; Professional: decisiones empresariales y sus compensaciones. |
| Opciones | Distractores plausibles que fallan por una restricción explicable; misma precisión y nivel de detalle que la respuesta correcta. Evitar pistas de longitud, absolutos y opciones absurdas. |
| Respuesta | Una mejor respuesta inequívoca en selección única; conjunto completo justificado en múltiple. El enunciado especifica cuántas elegir. No usar matrices, laboratorios o formatos no confirmados como exigencia oficial. |
| Explicación | Describe el principio y su aplicación al escenario. Explica por qué la solución satisface las restricciones. No repetir solamente el texto correcto. |
| Fuente | Documentación o curso oficial aplicable, URL, sección y fecha de consulta. Identificar versión si el comportamiento puede cambiar. |
| Idioma | Original inglés revisado en simulación; equivalencia semántica español/inglés en Estudio, conservando APIs e identificadores técnicos. |
| Revisión | Revisor editorial y técnico, fechas reales, observaciones y decisión. Si falta alguno, el estado continúa `draft`. |

## Publicación y mejora con resultados

1. Crear una pregunta original y registrar las fuentes y la solución en un archivo privado para simulación.
2. Realizar revisión editorial: claridad, ambigüedad, pistas y plausibilidad de distractores.
3. Contrastar técnicamente la clave con documentación vigente. Resolver desacuerdos antes de aprobar.
4. Verificar traducción, cardinalidad y asociación al dominio. En Estudio, el catálogo de recursos por área no sustituye esta trazabilidad individual.
5. Aprobar con fechas e identidad de revisores reales; cargar en D1 privado sin publicar claves en Git o assets.
6. Revisar preguntas con resultados inesperados, discriminación baja o distractores nunca elegidos cuando exista una muestra suficiente. No ajustar dificultad a partir de un solo participante.

No hay una proporción pública confirmada entre selección única/múltiple ni entre niveles de dificultad. Cualquier mezcla local debe identificarse como decisión editorial, no como dato oficial.

## Registro mínimo de revisión

`question_id`, `exam_code`, `blueprint_version`, `official_domain_id`, `task_statement`, `cognitive_skill`, `source_url`, `source_section`, `source_reviewed_at`, `editorial_reviewer`, `editorial_reviewed_at`, `technical_reviewer`, `technical_reviewed_at`, `review_notes`, `status`.

Las marcas de revisión no se rellenan automáticamente. El esquema D1 actual guarda estado y fechas; el registro ampliado permanece junto al archivo privado de autoría hasta que exista un mantenedor editorial.
