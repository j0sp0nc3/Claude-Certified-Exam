/** Helpers shared by the Worker and unit tests. No browser code imports this module. */

export const SIMULATION_EVENT_TYPES = new Set([
  "visibility_hidden", "window_blur", "fullscreen_exit", "reload", "reconnect", "submission",
]);

function copyAndShuffle(values, random = Math.random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function equalNumberSets(left, right) {
  if (left.length !== right.length) return false;
  const a = [...new Set(left)].sort((x, y) => x - y);
  const b = [...new Set(right)].sort((x, y) => x - y);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function publicProfile(profile) {
  return {
    code: profile.code,
    title: profile.title,
    blueprintVersion: profile.blueprintVersion,
    questionCount: profile.questionCount,
    timeLimitSeconds: profile.timeLimitSeconds,
    language: profile.language,
    ready: profile.ready === true,
    reason: profile.reason,
    domains: profile.domains.map(({ id, name, weight, quota, available, required }) => ({
      id, name, weight, quota, available, required,
    })),
  };
}

export function publicProfiles(profiles) {
  return Object.values(profiles).map(publicProfile);
}

export function selectQuestionSet(profile, questions, random = Math.random) {
  const selected = [];
  for (const domain of profile.domains) {
    const candidates = questions.filter(question => question.officialDomainId === domain.id);
    if (candidates.length < domain.quota) {
      throw new Error(`Insufficient questions for ${domain.id}`);
    }
    selected.push(...copyAndShuffle(candidates, random).slice(0, domain.quota));
  }
  const shuffled = copyAndShuffle(selected, random);
  const privateSet = [];
  const publicQuestions = [];
  for (const question of shuffled) {
    const optionOrder = copyAndShuffle(question.options.map((_, index) => index), random);
    const answers = question.answer.map(correctIndex => optionOrder.indexOf(correctIndex)).sort((a, b) => a - b);
    privateSet.push({ id: question.id, domainId: question.officialDomainId, answers, optionOrder });
    publicQuestions.push({
      id: question.id,
      domainId: question.officialDomainId,
      question: question.question,
      options: optionOrder.map(index => question.options[index]),
      multiple: question.multiple === true,
    });
  }
  return { privateSet, publicQuestions };
}

export function restorePublicQuestions(privateSet, questions) {
  const byId = new Map(questions.map(question => [question.id, question]));
  return privateSet.map(saved => {
    const question = byId.get(saved.id);
    if (!question || !Array.isArray(saved.optionOrder)) throw new Error("Question set no longer matches the Worker bank");
    return {
      id: question.id,
      domainId: saved.domainId,
      question: question.question,
      options: saved.optionOrder.map(index => question.options[index]),
      multiple: question.multiple === true,
    };
  });
}

export function validResponses(value, privateSet, publicQuestions) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const privateById = new Map(privateSet.map(question => [question.id, question]));
  const publicById = new Map(publicQuestions.map(question => [question.id, question]));
  const clean = {};
  for (const [id, selected] of Object.entries(value)) {
    const privateQuestion = privateById.get(id);
    const publicQuestion = publicById.get(id);
    if (!privateQuestion || !publicQuestion || !Array.isArray(selected) || selected.length === 0) return null;
    if (selected.some(index => !Number.isInteger(index) || index < 0 || index >= publicQuestion.options.length)) return null;
    if (new Set(selected).size !== selected.length) return null;
    if (!publicQuestion.multiple && selected.length !== 1) return null;
    clean[id] = [...selected].sort((a, b) => a - b);
  }
  return clean;
}

export function gradeQuestionSet(privateSet, responses) {
  let correctCount = 0;
  const areas = {};
  for (const question of privateSet) {
    const area = areas[question.domainId] ||= { correct: 0, total: 0 };
    area.total += 1;
    const selected = Array.isArray(responses?.[question.id]) ? responses[question.id] : [];
    if (equalNumberSets(selected, question.answers)) {
      correctCount += 1;
      area.correct += 1;
    }
  }
  const total = privateSet.length;
  return {
    correctCount,
    total,
    preparationIndex: total ? Math.round((correctCount / total) * 100) : 0,
    areas,
  };
}

export function answeredCount(responses) {
  return Object.values(responses || {}).filter(value => Array.isArray(value) && value.length > 0).length;
}

export function isExpired(deadlineAt, now = Date.now()) {
  return !deadlineAt || Number.isNaN(Date.parse(deadlineAt)) || now >= Date.parse(deadlineAt);
}

export function secondsRemaining(deadlineAt, now = Date.now()) {
  return Math.max(0, Math.ceil((Date.parse(deadlineAt) - now) / 1000));
}
