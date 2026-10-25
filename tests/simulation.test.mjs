import assert from "node:assert/strict";
import test from "node:test";

import {
  gradeQuestionSet,
  isExpired,
  restorePublicQuestions,
  selectQuestionSet,
  validResponses,
} from "../src/simulation.mjs";

const profile = {
  domains: [{ id: "architecture", quota: 2 }, { id: "safety", quota: 1 }],
};
const bank = [
  { id: "a1", officialDomainId: "architecture", question: "One", options: ["correct", "wrong"], multiple: false, answer: [0] },
  { id: "a2", officialDomainId: "architecture", question: "Two", options: ["wrong", "correct"], multiple: false, answer: [1] },
  { id: "s1", officialDomainId: "safety", question: "Three", options: ["correct 1", "correct 2", "wrong"], multiple: true, answer: [0, 1] },
];

test("selection returns public questions without answer keys", () => {
  const result = selectQuestionSet(profile, bank, () => 0.5);
  assert.equal(result.publicQuestions.length, 3);
  assert.equal(JSON.stringify(result.publicQuestions).includes("answer"), false);
  assert.equal(result.privateSet.length, 3);
  assert.equal(JSON.stringify(result.privateSet).includes("answers"), true);
});

test("grading requires every correct option for multiple response", () => {
  const { privateSet, publicQuestions } = selectQuestionSet(profile, bank, () => 0.5);
  const responses = Object.fromEntries(privateSet.map(question => [question.id, question.answers]));
  const valid = validResponses(responses, privateSet, publicQuestions);
  assert.ok(valid);
  assert.deepEqual(gradeQuestionSet(privateSet, valid), {
    correctCount: 3,
    total: 3,
    preparationIndex: 100,
    areas: { architecture: { correct: 2, total: 2 }, safety: { correct: 1, total: 1 } },
  });
  const multiple = privateSet.find(question => question.id === "s1");
  responses.s1 = [multiple.answers[0]];
  assert.equal(gradeQuestionSet(privateSet, responses).correctCount, 2);
});

test("restored question order is stable and time expires at the deadline", () => {
  const { privateSet, publicQuestions } = selectQuestionSet(profile, bank, () => 0.5);
  assert.deepEqual(restorePublicQuestions(privateSet, bank), publicQuestions);
  assert.equal(isExpired("2026-10-25T10:00:00.000Z", Date.parse("2026-10-25T09:59:59.999Z")), false);
  assert.equal(isExpired("2026-10-25T10:00:00.000Z", Date.parse("2026-10-25T10:00:00.000Z")), true);
});
