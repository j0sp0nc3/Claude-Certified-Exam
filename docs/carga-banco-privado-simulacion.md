# Operación: carga del banco privado de simulación

Este procedimiento carga preguntas de **Simulación de condiciones oficiales** sin exponer claves en GitHub ni en los assets publicados.

## 1. Preparar D1

Aplica las migraciones `0005` y `0006` en la base remota `claude-exam-results` desde Cloudflare Dashboard → **Workers & Pages** → **D1** → **claude-exam-results** → **Console**, ejecutando el contenido de cada archivo en orden.

También se puede usar Wrangler desde una sesión con `CLOUDFLARE_API_TOKEN` válido:

```powershell
npx wrangler d1 migrations apply claude-exam-results --remote
```

El token requiere permisos para modificar la base D1 de esta cuenta. No se agrega al repositorio, a `wrangler.jsonc` ni a una página web.

## 2. Crear un archivo privado

Fuera del repositorio, crea un archivo SQL, por ejemplo `private-simulation-bank.sql`. El archivo debe quedar fuera de Git mediante una ubicación privada o una regla local de ignore.

Ejemplo de una pregunta de alternativa única:

```sql
INSERT INTO simulation_question_bank (
  question_id, exam_code, blueprint_version, official_domain_id,
  question_json, answer_json, multiple_response, status,
  editorial_reviewed_at, technical_reviewed_at
) VALUES (
  'CCAR-F-2026-001',
  'CCAR-F',
  '2026.07-v1',
  'agentic-architecture-orchestration',
  '{"question":"An original scenario question in English?","options":["Option A","Option B","Option C","Option D"]}',
  '[1]',
  0,
  'approved',
  '2026-10-25T00:00:00Z',
  '2026-10-25T00:00:00Z'
);
```

Para una pregunta de selección múltiple, `multiple_response` es `1` y `answer_json` contiene todos los índices correctos, por ejemplo `[0, 2]`. Los índices corresponden al orden de `options` antes de que el Worker lo aleatorice.

## 3. Revisión y disponibilidad

Una fila solo puede participar en una simulación si cumple las tres condiciones:

- `status = 'approved'`
- `editorial_reviewed_at` tiene fecha
- `technical_reviewed_at` tiene fecha

Cada dominio requiere tres veces su cuota del blueprint. Por ejemplo, CCAR-F necesita 48 preguntas revisadas en **Agentic Architecture and Orchestration**, porque cada formulario toma 16. La página `/simulation.html` calcula y expone la cobertura por perfil, sin revelar preguntas ni claves.

## 4. Carga y comprobación

Con un token de Cloudflare válido, ejecuta el archivo privado:

```powershell
npx wrangler d1 execute claude-exam-results --remote --file C:\ruta-privada\private-simulation-bank.sql
```

Después, abre:

```text
https://claude-certified-exam.beroiza79.workers.dev/api/simulation/profiles
```

El perfil cambia a `ready: true` únicamente cuando cada dominio tiene la cobertura requerida. Inicia un intento de prueba con un correo admitido, confirma que el panel privado muestra avance/eventos y revisa que la respuesta del endpoint de inicio no contiene `answer` ni `answer_json`.
