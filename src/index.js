const EXAM_CODES = new Set(["CCAO-F", "CCDV-F", "CCAR-F", "CCAR-P"]);
const MAX_BODY_BYTES = 100_000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  }});
}

function validId(value) { return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value); }

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

async function saveAttempt(request, env) {
  if (!env.DB) return json({ error: "La base de resultados aún no está conectada." }, 503);
  let r;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: "Registro demasiado grande." }, 413);
    r = JSON.parse(raw);
  } catch { return json({ error: "JSON no válido." }, 400); }

  const currentQuestion = Number.isInteger(r.currentQuestion) ? r.currentQuestion : 1;
  const markedCount = Number.isInteger(r.markedCount) ? r.markedCount : (Array.isArray(r.marked) ? r.marked.length : 0);
  if (!validId(r.attemptId) || !EXAM_CODES.has(r.examCode)) return json({ error: "Intento o examen no válido." }, 400);
  if (typeof r.participantName !== "string" || r.participantName.trim().length < 3 || r.participantName.length > 120) return json({ error: "Nombre no válido." }, 400);
  if (typeof r.email !== "string" || r.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) return json({ error: "Correo no válido." }, 400);
  if (typeof r.startedAt !== "string" || Number.isNaN(Date.parse(r.startedAt))) return json({ error: "Fecha no válida." }, 400);
  if (!["in_progress", "completed"].includes(r.status)) return json({ error: "Estado no válido." }, 400);
  if (!Number.isInteger(r.questionCount) || r.questionCount < 1 || r.questionCount > 100 || !Number.isInteger(r.answeredCount) || r.answeredCount < 0 || r.answeredCount > r.questionCount) return json({ error: "Avance no válido." }, 400);
  if (currentQuestion < 1 || currentQuestion > r.questionCount || markedCount < 0 || markedCount > r.questionCount) return json({ error: "Estado de navegación no válido." }, 400);
  if (!Number.isInteger(r.elapsedSeconds) || r.elapsedSeconds < 0 || r.elapsedSeconds > 86400) return json({ error: "Tiempo no válido." }, 400);
  if (r.status === "completed" && (!Number.isInteger(r.correctCount) || r.correctCount < 0 || r.correctCount > r.questionCount || !Number.isFinite(r.scorePercent) || r.scorePercent < 0 || r.scorePercent > 100)) return json({ error: "Puntaje no válido." }, 400);

  try {
    await env.DB.prepare(`
      INSERT INTO attempts (
        attempt_id, exam_code, participant_name, email, status, started_at, updated_at,
        finished_at, question_count, answered_count, elapsed_seconds, current_question, marked_count, correct_count,
        score_percent, result_label, answers_json, marked_json, areas_json
      ) VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(attempt_id) DO UPDATE SET
        participant_name=excluded.participant_name, email=excluded.email, status=excluded.status,
        updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), finished_at=excluded.finished_at,
        answered_count=excluded.answered_count, elapsed_seconds=excluded.elapsed_seconds,
        current_question=excluded.current_question, marked_count=excluded.marked_count,
        correct_count=excluded.correct_count, score_percent=excluded.score_percent,
        result_label=excluded.result_label, answers_json=excluded.answers_json,
        marked_json=excluded.marked_json, areas_json=excluded.areas_json
      WHERE attempts.status != 'completed' OR excluded.status = 'completed'
    `).bind(r.attemptId, r.examCode, r.participantName.trim(), r.email.trim(), r.status,
      r.startedAt, r.status === "completed" ? new Date().toISOString() : null,
      r.questionCount, r.answeredCount, r.elapsedSeconds, currentQuestion, markedCount,
      r.status === "completed" ? r.correctCount : null,
      r.status === "completed" ? r.scorePercent : null,
      r.status === "completed" ? String(r.resultLabel || "") : null,
      JSON.stringify(r.answers || {}), JSON.stringify(r.marked || []), JSON.stringify(r.areas || {})).run();
    return json({ ok: true });
  } catch (error) {
    console.error("D1 write failed", error);
    return json({ error: "No se pudo guardar el intento." }, 503);
  }
}

async function listAttempts(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!env.ADMIN_TOKEN || !timingSafeEqual(token, env.ADMIN_TOKEN)) return json({ error: "Acceso no autorizado." }, 401);
  if (!env.DB) return json({ error: "La base de resultados aún no está conectada." }, 503);
  try {
    const rows = await env.DB.prepare(`SELECT attempt_id, exam_code, participant_name, email, status,
      started_at, updated_at, finished_at, question_count, answered_count, elapsed_seconds,
      current_question, marked_count,
      correct_count, score_percent, result_label, areas_json FROM attempts ORDER BY started_at DESC LIMIT 2000`).all();
    return json({ attempts: rows.results || [] });
  } catch (error) {
    console.error("D1 read failed", error);
    return json({ error: "No se pudieron cargar los resultados." }, 503);
  }
}

export default { async fetch(request, env) {
  const path = new URL(request.url).pathname;
  if (path.startsWith("/api/")) {
    if (path === "/api/attempts" && request.method === "POST") return saveAttempt(request, env);
    if (path === "/api/admin/attempts" && request.method === "GET") return listAttempts(request, env);
    if (path === "/api/attempts" || path === "/api/admin/attempts") return json({ error: "Método no permitido." }, 405);
    return json({ error: "Ruta no encontrada." }, 404);
  }
  return env.ASSETS.fetch(request);
}};
