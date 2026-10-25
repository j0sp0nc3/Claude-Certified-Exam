import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import worker from "../src/index.js";

// Execute the actual Worker SQL against SQLite, matching D1's statement API.
function database(simulationMigrated = true) {
  const sqlite = new DatabaseSync(":memory:");
  for (const filename of readdirSync(new URL("../migrations/", import.meta.url)).sort()) {
    if (filename.startsWith("0007") || (!simulationMigrated && filename > "0004z")) continue;
    sqlite.exec(readFileSync(new URL(`../migrations/${filename}`, import.meta.url), "utf8"));
  }
  const db = {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...params) { values = params; return statement; },
        async first() { return sqlite.prepare(sql).get(...values) || null; },
        async all() { return { results: sqlite.prepare(sql).all(...values) }; },
        async run() { return { meta: sqlite.prepare(sql).run(...values) }; },
      };
      return statement;
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try { const result = []; for (const statement of statements) result.push(await statement.run()); sqlite.exec("COMMIT"); return result; }
      catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
  return { sqlite, env: { DB: db, ADMIN_TOKEN: "test-only" } };
}

const record = overrides => ({
  attemptId: crypto.randomUUID(), examCode: "CCAO-F", participantName: "Test Participant",
  email: "test@nxtara.com", startedAt: new Date().toISOString(), status: "in_progress",
  questionCount: 60, answeredCount: 1, elapsedSeconds: 20, currentQuestion: 1,
  answers: { 0: 1 }, marked: [], areas: { prompting: { ok: 1, total: 1 } }, ...overrides,
});
const save = (body, env) => worker.fetch(new Request("https://example.test/api/attempts", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
}), env);
const admin = env => worker.fetch(new Request("https://example.test/api/admin/attempts", {
  headers: { Authorization: "Bearer test-only" },
}), env);

for (const migrated of [false, true]) {
  test(`Study saves, resumes and reports feedback with simulation migrations ${migrated ? "applied" : "pending"}`, async () => {
    const { sqlite, env } = database(migrated);
    const legacy = record();
    assert.equal((await save(legacy, env)).status, 200);
    const legacyAdmin = await admin(env);
    assert.equal(legacyAdmin.status, 200);
    assert.equal((await legacyAdmin.json()).attempts[0].feedback_mode, "legacy");
    const guided = record({ feedbackMode: "immediate", verified: [0] });
    assert.equal((await save(guided, env)).status, 200);
    assert.deepEqual(JSON.parse(sqlite.prepare("SELECT verified_json FROM practice_feedback WHERE attempt_id=?").get(guided.attemptId).verified_json), [0]);
    assert.equal((await save({ ...guided, feedbackMode: "none", verified: [] }, env)).status, 409);
    assert.equal((await save({ ...guided, status: "completed", correctCount: 1, scorePercent: 2 }, env)).status, 200);
    assert.equal((await save(guided, env)).status, 200);
    assert.equal(sqlite.prepare("SELECT status FROM attempts WHERE attempt_id=?").get(guided.attemptId).status, "completed");
    const silent = record({ feedbackMode: "none" });
    assert.equal((await save(silent, env)).status, 200);
    const response = await admin(env);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.deepEqual(new Set(data.attempts.map(a => a.feedback_mode)), new Set(["legacy", "immediate", "none"]));
    assert.ok(data.attempts.every(a => a.mode === "study" && !Object.hasOwn(a, "answers_json")));
    // Versioned migration remains safe after runtime provisioning.
    sqlite.exec(readFileSync(new URL("../migrations/0007_practice_feedback.sql", import.meta.url), "utf8"));
    sqlite.close();
  });
}

test("invalid feedback modes and verification indexes are rejected", async () => {
  const { sqlite, env } = database();
  for (const overrides of [
    { feedbackMode: "exam" }, { feedbackMode: "none", verified: [0] },
    { feedbackMode: "immediate", verified: [60] }, { feedbackMode: "immediate", verified: [0, 0] },
    { feedbackMode: "immediate", verified: [1] },
  ]) assert.equal((await save(record(overrides), env)).status, 400);
  assert.equal((await admin({ ...env, ADMIN_TOKEN: "different" })).status, 401);
  sqlite.close();
});

test("simulation start requires acceptance of closed-book conditions", async () => {
  const { sqlite, env } = database();
  const response = await worker.fetch(new Request("https://example.test/api/simulation/attempts", {
    method: "POST", body: JSON.stringify({ examCode: "CCAO-F", participantName: "Test Participant", email: "test@nxtara.com" }),
  }), env);
  assert.equal(response.status, 400);
  sqlite.close();
});
