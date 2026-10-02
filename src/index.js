const EXAM_CODES = new Set(["CCAO-F", "CCDV-F", "CCAR-F", "CCAR-P"]);
const MAX_BODY_BYTES = 100_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

async function admissionSettings(env) {
  let row;
  try {
    row = await env.DB.prepare("SELECT allowed_domain, allowed_emails_json FROM admission_settings WHERE id = 1").first();
  } catch (error) {
    // Conserva el acceso corporativo inicial si el Worker se publica antes que la migración D1.
    if (/no such table: admission_settings/i.test(String(error?.message || error))) return { domains: ["nxtara.com"], emails: [] };
    throw error;
  }
  return {
    domains: String(row?.allowed_domain || "").split(/[\s,;]+/).map(domain => domain.trim().toLowerCase().replace(/^@/, "")).filter(Boolean),
    emails: JSON.parse(row?.allowed_emails_json || "[]").map(email => String(email).trim().toLowerCase()),
  };
}

async function isAdmitted(email, env) {
  if (!env.DB) throw new Error("D1 no está conectada.");
  const settings = await admissionSettings(env);
  const normalized = email.trim().toLowerCase();
  const domain = normalized.slice(normalized.lastIndexOf("@") + 1);
  return settings.emails.includes(normalized) || settings.domains.some(allowed => domain === allowed || domain.endsWith("." + allowed));
}

async function checkAdmission(request, env) {
  if (!env.DB) return json({ error: "La admisión aún no está configurada." }, 503);
  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 2_000) return json({ error: "Solicitud demasiado grande." }, 413);
    body = JSON.parse(raw);
  } catch { return json({ error: "JSON no válido." }, 400); }
  const email = body && typeof body.email === "string" ? body.email.trim() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) return json({ error: "Ingresa un correo válido." }, 400);
  try {
    if (!(await isAdmitted(email, env))) return json({ error: "Este correo no está habilitado para rendir el examen. Contacta al administrador." }, 403);
    return json({ ok: true });
  } catch (error) {
    console.error("Admission check failed", error);
    return json({ error: "No se pudo validar la admisión. Intenta de nuevo más tarde." }, 503);
  }
}

function authorized(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return Boolean(env.ADMIN_TOKEN && timingSafeEqual(token, env.ADMIN_TOKEN));
}

async function adminAdmission(request, env) {
  if (!authorized(request, env)) return json({ error: "Acceso no autorizado." }, 401);
  if (!env.DB) return json({ error: "La base de resultados aún no está conectada." }, 503);
  if (request.method === "GET") {
    try { return json({ settings: await admissionSettings(env) }); }
    catch (error) { console.error("Admission settings read failed", error); return json({ error: "No se pudo cargar la configuración de admisión. Aplica la migración 0003." }, 503); }
  }
  if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 12_000) return json({ error: "Solicitud demasiado grande." }, 413);
    body = JSON.parse(raw);
  } catch { return json({ error: "JSON no válido." }, 400); }
  const domainValues = body && Array.isArray(body.domains) ? body.domains : body && typeof body.domain === "string" ? body.domain.split(/[\s,;]+/) : [];
  if (domainValues.length > 50 || domainValues.some(value => typeof value !== "string")) return json({ error: "La lista admite hasta 50 dominios." }, 400);
  const domains = [...new Set(domainValues.map(value => value.trim().toLowerCase().replace(/^@/, "")).filter(Boolean))];
  if (domains.some(domain => domain.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain))) return json({ error: "Hay un dominio no válido. Ejemplo: nxtara.com" }, 400);
  if (!body || !Array.isArray(body.emails) || body.emails.length > 100) return json({ error: "La lista admite hasta 100 correos exactos." }, 400);
  const emails = [...new Set(body.emails.map(value => typeof value === "string" ? value.trim().toLowerCase() : ""))];
  if (emails.some(email => email.length > 254 || !EMAIL_RE.test(email))) return json({ error: "Hay una dirección de correo no válida." }, 400);
  try {
    await env.DB.prepare(`INSERT INTO admission_settings (id, allowed_domain, allowed_emails_json, updated_at)
      VALUES (1, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(id) DO UPDATE SET allowed_domain=excluded.allowed_domain,
      allowed_emails_json=excluded.allowed_emails_json, updated_at=excluded.updated_at`).bind(domains.join(","), JSON.stringify(emails)).run();
    return json({ ok: true, settings: { domains, emails } });
  } catch (error) { console.error("Admission settings write failed", error); return json({ error: "No se pudo guardar. Verifica que la migración 0003 esté aplicada." }, 503); }
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
  try {
    if (!(await isAdmitted(r.email, env))) return json({ error: "El correo no está autorizado para rendir." }, 403);
  } catch (error) {
    console.error("Attempt admission check failed", error);
    return json({ error: "No se pudo validar la admisión." }, 503);
  }
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
  if (!authorized(request, env)) return json({ error: "Acceso no autorizado." }, 401);
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
    if (path === "/api/admission/check" && request.method === "POST") return checkAdmission(request, env);
    if (path === "/api/admin/admission") return adminAdmission(request, env);
    if (path === "/api/attempts" && request.method === "POST") return saveAttempt(request, env);
    if (path === "/api/admin/attempts" && request.method === "GET") return listAttempts(request, env);
    if (path === "/api/attempts" || path === "/api/admin/attempts" || path === "/api/admission/check") return json({ error: "Método no permitido." }, 405);
    return json({ error: "Ruta no encontrada." }, 404);
  }
  return env.ASSETS.fetch(request);
}};
