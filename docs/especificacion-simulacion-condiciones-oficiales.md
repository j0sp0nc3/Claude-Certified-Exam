# Especificación: simulación de condiciones oficiales

**Estado:** base de implementación  
**Revisado:** 2026-10-25  
**Alcance:** simulaciones internas de preparación para las cuatro certificaciones de Anthropic. No son exámenes oficiales, no están afiliadas a Pearson VUE y no predicen un puntaje oficial.

## 1. Investigación y fuentes

La información pública vigente se revisó el 25 de octubre de 2026. Las fuentes de referencia son:

- [FAQ oficial de certificaciones](https://anthropic-partners.skilljar.com/page/faq-certifications): entrega mediante Pearson VUE, verificación de identidad y supervisión para el examen oficial; preguntas de selección múltiple y de selección múltiple con varias respuestas; 120 minutos; inglés; sin examen práctico oficial disponible en este momento.
- [Artículo oficial: Four role-based Claude certifications](https://claude.com/resources/articles/four-role-based-claude-certifications): describe las cuatro certificaciones y su público objetivo.
- [Catálogo oficial y páginas de cada certificación](https://anthropic-partners.skilljar.com/page/partner-certifications): enlaza guías, preparación y registro. La FAQ confirma libro cerrado, sin notas, documentación, traducción ni asistentes de IA; el reporte final oficial incluye porcentaje de aciertos por sección. La escala 100–1.000 y su corte 720 no se reproducen como porcentaje de aprobación interno.
- Guías públicas de examen: [CCAO-F](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542847%2FClaude%2BCertified%2BAssociate%2B%E2%80%93%2BFoundations%2BExam%2BGuide.pdf), [CCDV-F](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542875%2FClaude%2BCertified%2BDeveloper%2B%E2%80%93%2BFoundations%2BExam%2BGuide.pdf), [CCAR-F](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude%2BCertified%2BArchitect%2B%E2%80%93%2BFoundations%2BExam%2BGuide.pdf) y [CCAR-P](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542810%2FClaude%2BCertified%2BArchitect%2B%E2%80%93%2BProfessional%2BExam%2BGuide.pdf).

Las guías y la FAQ son la autoridad para duración, idioma, dominios y ponderaciones. Las preguntas del repositorio son originales y no proceden de exámenes de Anthropic ni de Pearson VUE.

## 2. Perfiles publicados

La distribución aplica el método de **resto mayor** para convertir ponderaciones públicas a preguntas enteras. Los conteos se mantienen versionados; si Anthropic actualiza una guía, se crea una nueva versión de blueprint, sin modificar intentos ya iniciados.

| Código | Certificación | Preguntas | Tiempo | Idioma | Blueprint |
|---|---|---:|---:|---|---|
| CCAO-F | Claude Certified Associate – Foundations | 60 | 120 min | English | 2026.07-v1 |
| CCDV-F | Claude Certified Developer – Foundations | 53 | 120 min | English | 2026.07-v1 |
| CCAR-F | Claude Certified Architect – Foundations | 60 | 120 min | English | 2026.07-v1 |
| CCAR-P | Claude Certified Architect – Professional | 63 | 120 min | English | 2026.07-v1 |

### CCAO-F

| Dominio | Peso | Cuota (60) |
|---|---:|---:|
| Prompting and Task Execution | 14% | 8 |
| Output Evaluation and Validation | 21% | 13 |
| Product and Model Selection | 12% | 7 |
| Workflow Integration and Solution Design | 16% | 10 |
| Configuration and Knowledge Management | 12% | 7 |
| Governance, Risk, and Responsible Use | 15% | 9 |
| Troubleshooting and Optimization | 10% | 6 |

### CCDV-F

| Dominio | Peso | Cuota (53) |
|---|---:|---:|
| Agents and Workflows | 14.7% | 8 |
| Applications and Integration | 33.1% | 17 |
| Claude Code | 3.1% | 2 |
| Eval, Testing, and Debugging | 2.6% | 1 |
| Model Selection and Optimization | 16.8% | 9 |
| Prompt and Context Engineering | 11.0% | 6 |
| Security and Safety | 8.1% | 4 |
| Tools and MCPs | 10.6% | 6 |

### CCAR-F

| Dominio | Peso | Cuota (60) |
|---|---:|---:|
| Agentic Architecture and Orchestration | 27% | 16 |
| Tool Design and MCP Integration | 18% | 11 |
| Claude Code Configuration and Workflows | 20% | 12 |
| Prompt Engineering and Structured Output | 20% | 12 |
| Context Management and Reliability | 15% | 9 |

### CCAR-P

| Dominio | Peso | Cuota (63) |
|---|---:|---:|
| Solution Design and Architecture | 17% | 11 |
| Claude Models, Prompting and Context Engineering | 13% | 8 |
| Integration | 19% | 12 |
| Evaluation, Testing and Optimization | 16% | 10 |
| Governance, Safety and Risk Management | 14% | 9 |
| Stakeholder Communication and Lifecycle Management | 14% | 9 |
| Developer Productivity and Operational Enablement | 7% | 4 |

## 3. Modos de producto

### Estudio

- Dos modalidades bilingües seleccionables antes de comenzar; la elección queda fija por intento.
- **Práctica guiada (`feedbackMode: immediate`)**: tras seleccionar la cantidad de opciones indicada, el participante pulsa **Verificar respuesta**. La selección se bloquea y se muestra acierto/error, respuesta correcta, explicación editorial, dominio del banco y recurso oficial de aprendizaje. La revisión completa también está disponible al finalizar.
- **Práctica sin feedback (`feedbackMode: none`)**: no muestra corrección, claves, recursos ni explicaciones individuales durante o después del intento. Entrega resultado global y porcentaje de aciertos por dominio al finalizar.
- Las etiquetas, preguntas y explicaciones siguen el idioma elegido. Los recursos de `build/practice_resources.py` tienen títulos bilingües e indican explícitamente que las fuentes son inglesas. La cobertura usa la taxonomía actual del banco de Estudio, sin afirmar que ya esté reclasificado al blueprint oficial.
- El mismo intento se puede reanudar en la misma pestaña tras recargar: conserva preguntas, orden de alternativas, respuestas, marcas, modalidad, verificaciones y vencimiento. El reloj continúa. Un resultado pendiente de guardado permanece recuperable hasta confirmación del Worker.
- El estado local usa `sessionStorage` y una versión de contenido: no permite reanudar en otro dispositivo o después de cerrar definitivamente la pestaña. Una actualización que cambie el banco requiere iniciar otro intento; no altera el JavaScript de participantes que ya lo tengan abierto.
- Sigue siendo aprendizaje con claves en el navegador; “sin feedback” describe la interfaz, no un banco seguro.

### Persistencia y compatibilidad de Práctica

- `POST /api/attempts` acepta `feedbackMode` (`immediate`, `none`, o ausencia para clientes anteriores) y `verified` (índices únicos de preguntas verificadas). El modo principal continúa siendo `study`.
- La migración `0007_practice_feedback.sql` agrega la tabla independiente `practice_feedback`, relacionada por `attempt_id`. Conserva modalidad y verificaciones sin reinterpretar intentos históricos.
- Para permitir publicar sin interrumpir el guardado de Estudio, el Worker crea esa misma tabla idempotente al recibir el primer guardado de una modalidad nueva. Guarda intento y metadata en un lote transaccional; si falla, informa error y el navegador conserva la copia pendiente. La migración versionada puede aplicarse después sin eliminar datos.
- Los clientes previos siguen el camino existente, sin exigir 0007. Los resultados históricos se etiquetan “Estudio anterior” (`legacy`); no se les atribuye una modalidad que nunca seleccionaron.
- `GET /api/admin/attempts` añade `feedback_mode`; nunca devuelve las verificaciones ni respuestas seleccionadas. El panel y el CSV muestran la modalidad. El panel puede consultar resultados de Estudio aunque 0005 siga pendiente.

### Simulación de condiciones oficiales

- Solo inglés, 120 minutos y cantidad de preguntas del perfil seleccionado.
- Antes de iniciar exige aceptar condiciones de libro cerrado, sin notas, documentación, traducción ni asistentes de IA. La API de inicio exige `conditionsAccepted: true`. La declaración no representa supervisión ni verificación de identidad.
- Una versión de blueprint y un conjunto de preguntas se fijan al inicio del intento.
- Ofrece navegación, lista de preguntas y marcas para revisión, pero no muestra explicación, clave ni corrección individual antes del envío.
- La pantalla final muestra un **Índice de preparación** de 0 a 100 y fortalezas/debilidades por dominio. No muestra ni calcula equivalencia con el puntaje oficial 720.
- Su disponibilidad exige banco editorialmente aprobado para cada dominio y al menos tres formularios sin repetir preguntas. Mientras un perfil no cumpla esta puerta, se presenta como “en preparación”.

## 4. Diseño de seguridad y flujo del intento

1. El navegador solicita `POST /api/simulation/attempts` con certificación e identidad admitida.
2. El Worker valida admisión, toma una versión de blueprint, selecciona preguntas por cuota desde el banco privado D1 y crea un intento con vencimiento de 120 minutos.
3. El Worker responde solamente con identificadores, texto, alternativas y tipo de pregunta. Las claves no se publican en HTML, JSON estático ni respuestas de API.
4. El navegador guarda respuestas mediante `PATCH /api/simulation/attempts/:id/progress` y reporta eventos mínimos de integridad.
5. Al enviar o vencer, `POST /api/simulation/attempts/:id/submit` corrige en el Worker usando claves privadas, persiste el resultado y devuelve el Índice de preparación.
6. Las consultas administrativas entregan resúmenes y detalle privado. Nunca devuelven claves correctas a un participante.

El tiempo se calcula con el vencimiento emitido por el servidor. El reloj local es una visualización y nunca una autoridad para corregir.

### Banco privado de simulación

Las preguntas de **Simulación de condiciones oficiales** se almacenan en la tabla D1 `simulation_question_bank`. Cada fila contiene el identificador, certificación, versión de blueprint, dominio oficial, enunciado y alternativas (`question_json`), clave (`answer_json`), tipo de respuesta y las marcas de revisión editorial y técnica.

- El repositorio solo versiona metadatos de blueprint en `src/generated/simulation-profiles.js`; no versiona enunciados ni claves de este banco.
- Los archivos estáticos, incluido `simulation.html`, nunca incluyen el banco ni una propiedad de respuesta correcta.
- El Worker solo selecciona filas `approved` con ambas marcas de revisión. Las preguntas retiradas se conservan en D1 para restaurar intentos ya iniciados, pero no entran en nuevos conjuntos.
- La carga se realiza desde un archivo privado fuera de Git mediante una operación D1 restringida. No se deben reutilizar las preguntas del modo Estudio: sus claves son visibles por diseño para facilitar el aprendizaje.

Estructura de contenido por fila:

```json
{
  "question_id": "CCAR-F-2026-001",
  "exam_code": "CCAR-F",
  "blueprint_version": "2026.07-v1",
  "official_domain_id": "agentic-architecture-orchestration",
  "question_json": {"question": "…", "options": ["…", "…", "…", "…"]},
  "answer_json": [1],
  "multiple_response": 0,
  "status": "approved",
  "editorial_reviewed_at": "2026-10-25T00:00:00Z",
  "technical_reviewed_at": "2026-10-25T00:00:00Z"
}
```

`answer_json` usa índices de alternativa antes de la aleatorización. Para selección múltiple contiene todos los índices correctos. La API no devuelve ese campo al participante.

## 5. Datos y auditoría mínima

Cada intento de simulación registra: modo, código de certificación, versión de blueprint, cantidad de preguntas, inicio, vencimiento, envío, causa de finalización, progreso, respuestas, resultado agregado y resultados por dominio.

Eventos permitidos:

- pérdida de visibilidad de pestaña;
- pérdida de foco de ventana;
- salida de pantalla completa si el participante la había activado;
- recarga o reconexión;
- envío del examen.

No se solicitarán ni almacenarán cámara, micrófono, imágenes de pantalla, pulsaciones de teclado ni contenido de otras aplicaciones. Los eventos sirven para una conversación de seguimiento, no para sancionar automáticamente.

## 6. Administración

El panel administrativo debe permitir:

- consultar quién está activo, qué certificación y modo realiza, su avance, tiempo restante y última actividad;
- filtrar por certificación, estado, modo, correo y rango de fecha;
- revisar resultados por dominio, preguntas marcadas y resumen de eventos;
- exportar resultados; y
- administrar reglas de admisión por correo o dominio sin exponerlas al participante.

El acceso del participante se valida en el Worker. Las expresiones derivadas de dominios/correos se generan y evalúan en el servidor.

## 7. Puerta editorial y limitaciones conocidas

La [rúbrica editorial versionada](rubrica-editorial-preguntas.md) fija requisitos de escenarios, distractores, trazabilidad y revisión. Publicar esa rúbrica o enlazar recursos no implica que las 400 preguntas existentes ya hayan sido revisadas con ella.

El banco actual contiene 100 preguntas originales por certificación, agrupadas según categorías previas. No tiene todavía tres formularios completos por dominio con la taxonomía pública de CCAO-F, CCDV-F y CCAR-P. Por ello no se debe afirmar que una simulación actual replica plenamente esos planos oficiales.

Para habilitar un perfil se requiere, como mínimo:

1. mapa trazable de cada pregunta a un dominio del blueprint;
2. al menos tres veces la cuota de preguntas por dominio;
3. revisión editorial en inglés de claridad, una única interpretación y distractores;
4. revisión técnica de exactitud y vigencia; y
5. prueba de que tres formularios consecutivos no reutilizan preguntas.

El código debe rechazar el inicio de una simulación marcada no disponible en su configuración. Esta restricción evita presentar una aproximación de estudio como experiencia oficial.

## 8. Criterios de aceptación

- El HTML público de simulación no contiene respuestas correctas ni explicaciones.
- El Worker rechaza avances o envíos vencidos y recalcula toda corrección en servidor.
- Una simulación siempre usa inglés y 120 minutos.
- Cada respuesta múltiple se corrige como conjunto completo, sin crédito parcial salvo que una versión de blueprint lo documente explícitamente.
- El administrador ve datos de avance y eventos mínimos sin claves de respuesta.
- Los intentos existentes de modo Estudio no cambian de datos ni se invalidan al desplegar esta funcionalidad.
- Cada bloque entregado actualiza el tablero de progreso con evidencia Git verificable.
- Práctica guiada mantiene bloqueadas las preguntas verificadas después de recargar y cambiar de idioma.
- Práctica sin feedback deja vacía la revisión individual, incluso al recuperar un resultado que no pudo guardarse.
