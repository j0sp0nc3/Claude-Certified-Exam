// The same idempotent DDL as migration 0007. Provision only when a new Study
// client supplies feedback settings; legacy clients keep their existing path.
export const PRACTICE_FEEDBACK_SCHEMA = `CREATE TABLE IF NOT EXISTS practice_feedback (
  attempt_id TEXT PRIMARY KEY REFERENCES attempts(attempt_id),
  feedback_mode TEXT NOT NULL CHECK (feedback_mode IN ('immediate', 'none')),
  verified_json TEXT NOT NULL DEFAULT '[]'
)`;

export function practiceSettings(body) {
  const mode = body.feedbackMode ?? "legacy";
  const verified = body.verified ?? [];
  if (!["legacy", "immediate", "none"].includes(mode) || !Array.isArray(verified) ||
      verified.length > body.questionCount || new Set(verified).size !== verified.length ||
      verified.some(index => !Number.isInteger(index) || index < 0 || index >= body.questionCount || body.answers?.[index] === undefined) ||
      (mode !== "immediate" && verified.length)) return null;
  return { mode, verified };
}
