import { SIMULATION_PROFILES } from "./generated/simulation-profiles.js";
import { PRACTICE_FEEDBACK_SCHEMA, practiceSettings } from "./practice.mjs";
import {
  SIMULATION_EVENT_TYPES,
  answeredCount,
  gradeQuestionSet,
  isExpired,
  restorePublicQuestions,
  secondsRemaining,
  selectQuestionSet,
  validResponses,
} from "./simulation.mjs";

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
  const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return settings.emails.some(allowed => new RegExp("^" + escapeRegex(allowed) + "$", "i").test(normalized)) ||
    settings.domains.some(allowed => new RegExp("^[^\\s@]+@(?:[a-z0-9-]+\\.)*" + escapeRegex(allowed) + "$", "i").test(normalized));
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

  if (!r || typeof r !== "object" || Array.isArray(r)) return json({ error: "Registro no válido." }, 400);
  const feedback = practiceSettings(r);
  if (!feedback) return json({ error: "Modalidad o respuestas verificadas no válidas." }, 400);
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
  if (r.exitedAt != null && (typeof r.exitedAt !== "string" || Number.isNaN(Date.parse(r.exitedAt)))) return json({ error: "Hora de salida no válida." }, 400);
  if (r.status === "completed" && (!Number.isInteger(r.correctCount) || r.correctCount < 0 || r.correctCount > r.questionCount || !Number.isFinite(r.scorePercent) || r.scorePercent < 0 || r.scorePercent > 100)) return json({ error: "Puntaje no válido." }, 400);

  try {
    const finishedAt = r.status === "completed" ? new Date().toISOString() : null;
    const exitAt = finishedAt || r.exitedAt || null;
    if (feedback.mode !== "legacy") {
      await env.DB.prepare(PRACTICE_FEEDBACK_SCHEMA).run();
      const previous = await env.DB.prepare("SELECT feedback_mode FROM practice_feedback WHERE attempt_id = ?").bind(r.attemptId).first();
      if (previous && previous.feedback_mode !== feedback.mode) return json({ error: "La modalidad de feedback no puede cambiar durante el intento." }, 409);
    }
    const statement = env.DB.prepare(`
      INSERT INTO attempts (
        attempt_id, exam_code, participant_name, email, status, started_at, updated_at,
        finished_at, exit_at, question_count, answered_count, elapsed_seconds, current_question, marked_count, correct_count,
        score_percent, result_label, answers_json, marked_json, areas_json
      ) VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(attempt_id) DO UPDATE SET
        participant_name=excluded.participant_name, email=excluded.email, status=excluded.status,
        updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), finished_at=excluded.finished_at,
        exit_at=COALESCE(excluded.exit_at, attempts.exit_at),
        answered_count=excluded.answered_count, elapsed_seconds=excluded.elapsed_seconds,
        current_question=excluded.current_question, marked_count=excluded.marked_count,
        correct_count=excluded.correct_count, score_percent=excluded.score_percent,
        result_label=excluded.result_label, answers_json=excluded.answers_json,
        marked_json=excluded.marked_json, areas_json=excluded.areas_json
      WHERE attempts.status != 'completed' OR excluded.status = 'completed'
    `).bind(r.attemptId, r.examCode, r.participantName.trim(), r.email.trim(), r.status,
      r.startedAt, finishedAt, exitAt,
      r.questionCount, r.answeredCount, r.elapsedSeconds, currentQuestion, markedCount,
      r.status === "completed" ? r.correctCount : null,
      r.status === "completed" ? r.scorePercent : null,
      r.status === "completed" ? String(r.resultLabel || "") : null,
      JSON.stringify(r.answers || {}), JSON.stringify(r.marked || []), JSON.stringify(r.areas || {}));
    if (feedback.mode === "legacy") await statement.run();
    else await env.DB.batch([statement, env.DB.prepare(`INSERT INTO practice_feedback (attempt_id, feedback_mode, verified_json)
      VALUES (?, ?, ?) ON CONFLICT(attempt_id) DO UPDATE SET verified_json=excluded.verified_json`)
      .bind(r.attemptId, feedback.mode, JSON.stringify(feedback.verified))]);
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
    const baseColumns = `attempt_id, exam_code, participant_name, email, status,
      started_at, updated_at, finished_at, exit_at, question_count, answered_count, elapsed_seconds,
      current_question, marked_count, correct_count, score_percent, result_label, areas_json`;
    let rows;
    try { rows = await env.DB.prepare(`SELECT ${baseColumns}, mode, blueprint_version, deadline_at,
      completion_reason, integrity_event_count, last_event_at
      FROM attempts ORDER BY started_at DESC LIMIT 2000`).all(); }
    catch (error) {
      if (!/no such column/i.test(String(error?.message || error))) throw error;
      // Study results must remain readable while the separate simulation migration is pending.
      rows = await env.DB.prepare(`SELECT ${baseColumns}, 'study' AS mode FROM attempts ORDER BY started_at DESC LIMIT 2000`).all();
    }
    let settings = new Map();
    try {
      const feedback = await env.DB.prepare(`SELECT attempt_id, feedback_mode FROM practice_feedback
        WHERE attempt_id IN (SELECT attempt_id FROM attempts ORDER BY started_at DESC LIMIT 2000)`).all();
      settings = new Map((feedback.results || []).map(row => [row.attempt_id, row.feedback_mode]));
    } catch (error) { if (!/no such table: practice_feedback/i.test(String(error?.message || error))) throw error; }
    const attempts = (rows.results || []).map(row => {
      const profile = row.mode === "simulation" ? simulationProfile(row.exam_code) : null;
      return {
        ...row,
        feedback_mode: row.mode === "simulation" ? "none" : settings.get(row.attempt_id) || "legacy",
        areaNames: profile ? Object.fromEntries(profile.domains.map(domain => [domain.id, domain.name])) : undefined,
      };
    });
    return json({ attempts });
  } catch (error) {
    console.error("D1 read failed", error);
    return json({ error: "No se pudieron cargar los resultados. Verifica que la migración 0005 esté aplicada." }, 503);
  }
}

function simulationProfile(code) {
  return SIMULATION_PROFILES[code] || null;
}

function parseStoredJson(value, fallback) {
  try { return JSON.parse(value || ""); } catch { return fallback; }
}

function privateBankMissing(error) {
  return /no such table: simulation_question_bank/i.test(String(error?.message || error));
}

async function simulationQuestionCounts(env) {
  const rows = await env.DB.prepare(`SELECT exam_code, official_domain_id, COUNT(*) AS available
    FROM simulation_question_bank
    WHERE status = 'approved' AND editorial_reviewed_at IS NOT NULL AND technical_reviewed_at IS NOT NULL
    GROUP BY exam_code, official_domain_id`).all();
  return new Map((rows.results || []).map(row => [`${row.exam_code}:${row.official_domain_id}`, Number(row.available) || 0]));
}

function profileWithCoverage(profile, counts) {
  const domains = profile.domains.map(domain => ({
    ...domain,
    available: counts.get(`${profile.code}:${domain.id}`) || 0,
    required: domain.quota * profile.minimumForms,
  }));
  const ready = domains.every(domain => domain.available >= domain.required);
  return {
    ...profile,
    domains,
    ready,
    reason: ready ? "Ready" : "Editorial coverage is not ready for three reviewed forms.",
  };
}

function privateQuestionFromRow(row) {
  const content = parseStoredJson(row.question_json, null);
  const answer = parseStoredJson(row.answer_json, null);
  if (!content || typeof content.question !== "string" || !Array.isArray(content.options) ||
    !content.options.every(option => typeof option === "string") || !Array.isArray(answer) ||
    answer.length === 0 || answer.some(index => !Number.isInteger(index) || index < 0 || index >= content.options.length)) {
    throw new Error(`Private question ${row.question_id} is malformed`);
  }
  if (row.multiple_response !== 1 && answer.length !== 1) throw new Error(`Single-response question ${row.question_id} has multiple answers`);
  return {
    id: row.question_id,
    officialDomainId: row.official_domain_id,
    question: content.question,
    options: content.options,
    multiple: row.multiple_response === 1,
    answer,
  };
}

async function approvedSimulationQuestions(env, profile) {
  const rows = await env.DB.prepare(`SELECT question_id, official_domain_id, question_json, answer_json, multiple_response
    FROM simulation_question_bank
    WHERE exam_code = ? AND blueprint_version = ? AND status = 'approved'
      AND editorial_reviewed_at IS NOT NULL AND technical_reviewed_at IS NOT NULL`)
    .bind(profile.code, profile.blueprintVersion).all();
  return (rows.results || []).map(privateQuestionFromRow);
}

async function questionsForAttempt(env, privateSet) {
  if (!privateSet.length) return [];
  const placeholders = privateSet.map(() => "?").join(", ");
  const rows = await env.DB.prepare(`SELECT question_id, official_domain_id, question_json, answer_json, multiple_response
    FROM simulation_question_bank WHERE question_id IN (${placeholders})`).bind(...privateSet.map(question => question.id)).all();
  const questions = (rows.results || []).map(privateQuestionFromRow);
  if (questions.length !== privateSet.length) throw new Error("A private question used by this attempt is no longer available");
  return questions;
}

function privateQuestionSet(row) {
  const value = parseStoredJson(row.question_set_json, null);
  if (!Array.isArray(value) || value.length !== Number(row.question_count)) return null;
  if (value.some(question => !question || typeof question.id !== "string" || typeof question.domainId !== "string" || !Array.isArray(question.answers) || !Array.isArray(question.optionOrder))) return null;
  return value;
}

function profileAreaResult(profile, areas) {
  const names = new Map(profile.domains.map(domain => [domain.id, domain.name]));
  return Object.entries(areas || {}).map(([domainId, values]) => ({
    domainId,
    name: names.get(domainId) || domainId,
    correct: Number(values?.correct) || 0,
    total: Number(values?.total) || 0,
    preparationIndex: values?.total ? Math.round((Number(values.correct) || 0) * 100 / Number(values.total)) : 0,
  })).sort((left, right) => left.preparationIndex - right.preparationIndex || left.name.localeCompare(right.name));
}

function storedSimulationResult(row, profile) {
  const areas = parseStoredJson(row.areas_json, {});
  return {
    preparationIndex: Math.round(Number(row.score_percent) || 0),
    correctCount: Number(row.correct_count) || 0,
    questionCount: Number(row.question_count),
    completionReason: row.completion_reason || "submitted",
    completedAt: row.finished_at || row.updated_at,
    areas: profileAreaResult(profile, areas),
  };
}

function simulationAttemptView(row, profile) {
  return {
    attemptId: row.attempt_id,
    examCode: row.exam_code,
    title: profile.title,
    blueprintVersion: row.blueprint_version,
    language: "en",
    status: row.status,
    questionCount: Number(row.question_count),
    deadlineAt: row.deadline_at,
    secondsRemaining: secondsRemaining(row.deadline_at),
    currentQuestion: Number(row.current_question) || 1,
    answeredCount: Number(row.answered_count) || 0,
    marked: parseStoredJson(row.marked_json, []),
    integrityEventCount: Number(row.integrity_event_count) || 0,
  };
}

async function readSimulationRequest(request, limit = MAX_BODY_BYTES) {
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > limit) return { error: json({ error: "Solicitud demasiado grande." }, 413) };
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) return { error: json({ error: "JSON no válido." }, 400) };
    return { body };
  } catch { return { error: json({ error: "JSON no válido." }, 400) }; }
}

function validParticipant(body) {
  const participantName = typeof body.participantName === "string" ? body.participantName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (participantName.length < 3 || participantName.length > 120) return null;
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;
  return { participantName, email };
}

async function getSimulationAttempt(env, attemptId, email) {
  if (!validId(attemptId)) return null;
  return env.DB.prepare(`SELECT attempt_id, exam_code, participant_name, email, status, started_at, updated_at,
    finished_at, exit_at, question_count, answered_count, elapsed_seconds, current_question, marked_count,
    correct_count, score_percent, result_label, answers_json, marked_json, areas_json, mode, blueprint_version,
    deadline_at, completion_reason, question_set_json, integrity_event_count, last_event_at
    FROM attempts WHERE attempt_id = ? AND mode = 'simulation' AND lower(email) = lower(?)`).bind(attemptId, email).first();
}

async function publicQuestionsForAttempt(env, row) {
  const privateSet = privateQuestionSet(row);
  if (!privateSet) throw new Error("El conjunto de preguntas del intento no es válido.");
  return { privateSet, questions: restorePublicQuestions(privateSet, await questionsForAttempt(env, privateSet)) };
}

function elapsedSeconds(row, now = Date.now()) {
  const started = Date.parse(row.started_at);
  const deadline = Date.parse(row.deadline_at);
  if (Number.isNaN(started) || Number.isNaN(deadline)) return 0;
  return Math.max(0, Math.min(Math.floor((deadline - started) / 1000), Math.floor((now - started) / 1000)));
}

async function recordIntegrityEvent(env, attemptId, eventType) {
  await env.DB.prepare(`INSERT INTO simulation_integrity_events (attempt_id, event_type) VALUES (?, ?)`)
    .bind(attemptId, eventType).run();
  await env.DB.prepare(`UPDATE attempts SET integrity_event_count = integrity_event_count + 1,
    last_event_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE attempt_id = ?`).bind(attemptId).run();
}

async function finishSimulationAttempt(env, row, profile, reason, answersOverride = null, markedOverride = null) {
  if (row.status === "completed") return storedSimulationResult(row, profile);
  const { privateSet, questions } = await publicQuestionsForAttempt(env, row);
  const rawAnswers = answersOverride === null ? parseStoredJson(row.answers_json, {}) : answersOverride;
  const responses = validResponses(rawAnswers, privateSet, questions);
  if (responses === null) throw new Error("Las respuestas almacenadas no son válidas.");
  const marked = markedOverride === null ? parseStoredJson(row.marked_json, []) : markedOverride;
  const grade = gradeQuestionSet(privateSet, responses);
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`UPDATE attempts SET status = 'completed', updated_at = ?, finished_at = ?, exit_at = ?,
    completion_reason = ?, answered_count = ?, elapsed_seconds = ?, correct_count = ?, score_percent = ?,
    result_label = 'Preparation index', answers_json = ?, marked_json = ?, areas_json = ?
    WHERE attempt_id = ? AND status = 'in_progress'`).bind(
      now, now, now, reason, answeredCount(responses), elapsedSeconds(row), grade.correctCount,
      grade.preparationIndex, JSON.stringify(responses), JSON.stringify(marked), JSON.stringify(grade.areas), row.attempt_id,
    ).run();
  if (!result.meta?.changes) {
    const latest = await getSimulationAttempt(env, row.attempt_id, row.email);
    if (latest) return storedSimulationResult(latest, profile);
  }
  return {
    preparationIndex: grade.preparationIndex,
    correctCount: grade.correctCount,
    questionCount: grade.total,
    completionReason: reason,
    completedAt: now,
    areas: profileAreaResult(profile, grade.areas),
  };
}

async function simulationProfiles(env) {
  if (!env.DB) return json({ error: "La base de resultados aún no está conectada." }, 503);
  try {
    const counts = await simulationQuestionCounts(env);
    return json({ profiles: Object.values(SIMULATION_PROFILES).map(profile => profileWithCoverage(profile, counts)), source: "internal-practice" });
  } catch (error) {
    if (privateBankMissing(error)) {
      const empty = new Map();
      return json({ profiles: Object.values(SIMULATION_PROFILES).map(profile => ({
        ...profileWithCoverage(profile, empty),
        reason: "Private question bank migration is pending.",
      })), source: "internal-practice" });
    }
    console.error("Simulation profile list failed", error);
    return json({ error: "No se pudo cargar la disponibilidad de simulaciones." }, 503);
  }
}

async function startSimulation(request, env) {
  if (!env.DB) return json({ error: "La base de resultados aún no está conectada." }, 503);
  const parsed = await readSimulationRequest(request, 10_000);
  if (parsed.error) return parsed.error;
  if (parsed.body.conditionsAccepted !== true) return json({ error: "Accept the closed-book conditions before starting." }, 400);
  const participant = validParticipant(parsed.body);
  const baseProfile = simulationProfile(parsed.body.examCode);
  if (!participant || !baseProfile) return json({ error: "Participante o certificación no válida." }, 400);
  try {
    if (!(await isAdmitted(participant.email, env))) return json({ error: "El correo no está autorizado para rendir." }, 403);
    const profile = profileWithCoverage(baseProfile, await simulationQuestionCounts(env));
    if (!profile.ready) return json({ error: "Esta simulación aún no está disponible: " + profile.reason, code: "PROFILE_NOT_READY" }, 409);
    const selected = selectQuestionSet(profile, await approvedSimulationQuestions(env, profile));
    const attemptId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const deadlineAt = new Date(Date.now() + profile.timeLimitSeconds * 1000).toISOString();
    await env.DB.prepare(`INSERT INTO attempts (
      attempt_id, exam_code, participant_name, email, status, started_at, updated_at, finished_at, exit_at,
      question_count, answered_count, elapsed_seconds, current_question, marked_count, correct_count,
      score_percent, result_label, answers_json, marked_json, areas_json, mode, blueprint_version,
      deadline_at, completion_reason, question_set_json, integrity_event_count, last_event_at
    ) VALUES (?, ?, ?, ?, 'in_progress', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), NULL, NULL,
      ?, 0, 0, 1, 0, NULL, NULL, NULL, '{}', '[]', '{}', 'simulation', ?, ?, NULL, ?, 0, NULL)`)
      .bind(attemptId, profile.code, participant.participantName, participant.email, startedAt,
        profile.questionCount, profile.blueprintVersion, deadlineAt, JSON.stringify(selected.privateSet)).run();
    return json({
      attempt: { attemptId, examCode: profile.code, title: profile.title, blueprintVersion: profile.blueprintVersion,
        language: "en", status: "in_progress", questionCount: profile.questionCount, deadlineAt,
        secondsRemaining: profile.timeLimitSeconds, currentQuestion: 1, answeredCount: 0, marked: [], integrityEventCount: 0 },
      questions: selected.publicQuestions,
    }, 201);
  } catch (error) {
    console.error("Simulation start failed", error);
    return json({ error: "No se pudo iniciar la simulación. Verifica que las migraciones 0005 y 0006 estén aplicadas." }, 503);
  }
}

async function loadSimulation(request, env, attemptId) {
  if (!env.DB) return json({ error: "La base de resultados aún no está conectada." }, 503);
  const email = String(request.headers.get("X-Participant-Email") || "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return json({ error: "Se requiere el correo del participante." }, 400);
  try {
    const row = await getSimulationAttempt(env, attemptId, email);
    if (!row) return json({ error: "Intento no encontrado." }, 404);
    const profile = simulationProfile(row.exam_code);
    if (!profile) return json({ error: "El perfil de este intento ya no está disponible." }, 409);
    if (row.status === "in_progress" && isExpired(row.deadline_at)) {
      const result = await finishSimulationAttempt(env, row, profile, "time_expired");
      return json({ attempt: simulationAttemptView({ ...row, status: "completed" }, profile), result });
    }
    if (row.status === "completed") return json({ attempt: simulationAttemptView(row, profile), result: storedSimulationResult(row, profile) });
    const { questions } = await publicQuestionsForAttempt(env, row);
    return json({ attempt: simulationAttemptView(row, profile), questions, responses: parseStoredJson(row.answers_json, {}) });
  } catch (error) {
    console.error("Simulation load failed", error);
    return json({ error: "No se pudo recuperar la simulación. Verifica que la migración 0005 esté aplicada." }, 503);
  }
}

async function saveSimulationProgress(request, env, attemptId) {
  if (!env.DB) return json({ error: "La base de resultados aún no está conectada." }, 503);
  const parsed = await readSimulationRequest(request);
  if (parsed.error) return parsed.error;
  const email = typeof parsed.body.email === "string" ? parsed.body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) return json({ error: "Correo no válido." }, 400);
  try {
    const row = await getSimulationAttempt(env, attemptId, email);
    if (!row) return json({ error: "Intento no encontrado." }, 404);
    const profile = simulationProfile(row.exam_code);
    if (!profile) return json({ error: "El perfil de este intento ya no está disponible." }, 409);
    if (row.status === "in_progress" && isExpired(row.deadline_at)) {
      const result = await finishSimulationAttempt(env, row, profile, "time_expired");
      return json({ error: "El tiempo de la simulación terminó.", code: "TIME_EXPIRED", result }, 409);
    }
    if (row.status !== "in_progress") return json({ error: "Este intento ya fue finalizado.", result: storedSimulationResult(row, profile) }, 409);
    const { privateSet, questions } = await publicQuestionsForAttempt(env, row);
    const responses = validResponses(parsed.body.answers || {}, privateSet, questions);
    const marked = Array.isArray(parsed.body.marked) ? [...new Set(parsed.body.marked)] : null;
    const questionIds = new Set(privateSet.map(question => question.id));
    const currentQuestion = Number(parsed.body.currentQuestion);
    if (responses === null || !marked || marked.some(id => typeof id !== "string" || !questionIds.has(id)) ||
      !Number.isInteger(currentQuestion) || currentQuestion < 1 || currentQuestion > privateSet.length) {
      return json({ error: "El avance no es válido." }, 400);
    }
    await env.DB.prepare(`UPDATE attempts SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      answered_count = ?, elapsed_seconds = ?, current_question = ?, marked_count = ?, answers_json = ?, marked_json = ?
      WHERE attempt_id = ? AND status = 'in_progress'`).bind(
        answeredCount(responses), elapsedSeconds(row), currentQuestion, marked.length,
        JSON.stringify(responses), JSON.stringify(marked), row.attempt_id,
      ).run();
    return json({ ok: true, attempt: { ...simulationAttemptView(row, profile), currentQuestion, answeredCount: answeredCount(responses), marked } });
  } catch (error) {
    console.error("Simulation progress save failed", error);
    return json({ error: "No se pudo guardar el avance." }, 503);
  }
}

async function submitSimulation(request, env, attemptId) {
  if (!env.DB) return json({ error: "La base de resultados aún no está conectada." }, 503);
  const parsed = await readSimulationRequest(request);
  if (parsed.error) return parsed.error;
  const email = typeof parsed.body.email === "string" ? parsed.body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) return json({ error: "Correo no válido." }, 400);
  try {
    const row = await getSimulationAttempt(env, attemptId, email);
    if (!row) return json({ error: "Intento no encontrado." }, 404);
    const profile = simulationProfile(row.exam_code);
    if (!profile) return json({ error: "El perfil de este intento ya no está disponible." }, 409);
    if (row.status === "completed") return json({ result: storedSimulationResult(row, profile) });
    const { privateSet, questions } = await publicQuestionsForAttempt(env, row);
    const responses = validResponses(parsed.body.answers || {}, privateSet, questions);
    const marked = Array.isArray(parsed.body.marked) ? [...new Set(parsed.body.marked)] : null;
    const questionIds = new Set(privateSet.map(question => question.id));
    if (responses === null || !marked || marked.some(id => typeof id !== "string" || !questionIds.has(id))) return json({ error: "Las respuestas no son válidas." }, 400);
    const reason = isExpired(row.deadline_at) ? "time_expired" : "submitted";
    const result = await finishSimulationAttempt(env, row, profile, reason, responses, marked);
    await recordIntegrityEvent(env, row.attempt_id, "submission");
    return json({ result });
  } catch (error) {
    console.error("Simulation submission failed", error);
    return json({ error: "No se pudo finalizar la simulación." }, 503);
  }
}

async function saveSimulationEvent(request, env, attemptId) {
  if (!env.DB) return json({ error: "La base de resultados aún no está conectada." }, 503);
  const parsed = await readSimulationRequest(request, 4_000);
  if (parsed.error) return parsed.error;
  const email = typeof parsed.body.email === "string" ? parsed.body.email.trim().toLowerCase() : "";
  const eventType = parsed.body.eventType;
  if (email.length > 254 || !EMAIL_RE.test(email) || !SIMULATION_EVENT_TYPES.has(eventType)) return json({ error: "Evento no válido." }, 400);
  try {
    const row = await getSimulationAttempt(env, attemptId, email);
    if (!row) return json({ error: "Intento no encontrado." }, 404);
    const profile = simulationProfile(row.exam_code);
    if (row.status === "in_progress" && isExpired(row.deadline_at)) {
      const result = await finishSimulationAttempt(env, row, profile, "time_expired");
      return json({ error: "El tiempo de la simulación terminó.", code: "TIME_EXPIRED", result }, 409);
    }
    if (row.status !== "in_progress") return json({ ok: true });
    await recordIntegrityEvent(env, row.attempt_id, eventType);
    return json({ ok: true });
  } catch (error) {
    console.error("Simulation integrity event failed", error);
    return json({ error: "No se pudo registrar el evento." }, 503);
  }
}

async function listSimulationEvents(request, env, attemptId) {
  if (!authorized(request, env)) return json({ error: "Acceso no autorizado." }, 401);
  if (!env.DB) return json({ error: "La base de resultados aún no está conectada." }, 503);
  if (!validId(attemptId)) return json({ error: "Intento no válido." }, 400);
  try {
    const rows = await env.DB.prepare(`SELECT event_type, occurred_at FROM simulation_integrity_events
      WHERE attempt_id = ? ORDER BY occurred_at DESC LIMIT 500`).bind(attemptId).all();
    return json({ events: rows.results || [] });
  } catch (error) {
    console.error("Simulation event list failed", error);
    return json({ error: "No se pudieron cargar los eventos. Verifica que la migración 0005 esté aplicada." }, 503);
  }
}

export default { async fetch(request, env) {
  const path = new URL(request.url).pathname;
  if (path.startsWith("/api/")) {
    const simulationPath = path.match(/^\/api\/simulation\/attempts\/([0-9a-f-]{36})(?:\/(progress|submit|events))?$/i);
    const simulationAdminPath = path.match(/^\/api\/admin\/simulation\/attempts\/([0-9a-f-]{36})\/events$/i);
    if (path === "/api/simulation/profiles" && request.method === "GET") return simulationProfiles(env);
    if (path === "/api/simulation/attempts" && request.method === "POST") return startSimulation(request, env);
    if (simulationAdminPath && request.method === "GET") return listSimulationEvents(request, env, simulationAdminPath[1]);
    if (simulationPath) {
      const [, attemptId, action] = simulationPath;
      if (!action && request.method === "GET") return loadSimulation(request, env, attemptId);
      if (action === "progress" && request.method === "PATCH") return saveSimulationProgress(request, env, attemptId);
      if (action === "submit" && request.method === "POST") return submitSimulation(request, env, attemptId);
      if (action === "events" && request.method === "POST") return saveSimulationEvent(request, env, attemptId);
      return json({ error: "Método no permitido." }, 405);
    }
    if (path === "/api/admission/check" && request.method === "POST") return checkAdmission(request, env);
    if (path === "/api/admin/admission") return adminAdmission(request, env);
    if (path === "/api/attempts" && request.method === "POST") return saveAttempt(request, env);
    if (path === "/api/admin/attempts" && request.method === "GET") return listAttempts(request, env);
    if (path === "/api/attempts" || path === "/api/admin/attempts" || path === "/api/admission/check" ||
      path === "/api/simulation/profiles" || path === "/api/simulation/attempts") return json({ error: "Método no permitido." }, 405);
    return json({ error: "Ruta no encontrada." }, 404);
  }
  return env.ASSETS.fetch(request);
}};
