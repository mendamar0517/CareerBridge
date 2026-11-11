// US-14 – Онлайн шалгалтын автомат оноо
// SINGLE_CHOICE: зөв хувилбарыг сонговол бүтэн оноо.
// MULTIPLE_CHOICE: сонгосон хувилбарууд зөв хувилбаруудтай яг ижил бол бүтэн оноо (хэсэгчилсэн оноогүй).
// TEXT: автоматаар үнэлэхгүй (null) — хувийг зөвхөн автоматаар үнэлэх асуултаар тооцно
//       (ажил олгогч текст хариултыг тусад нь үзнэ). Ингэснээр бүх сонголтоо зөв хийсэн горилогч 100% авна.

/** Сонголттой асуултад өгсөн хариулт зөв эсэх */
function isCorrectChoice(q, optionIds) {
  const correct = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort((a, b) => a - b);
  const chosen = [...new Set(optionIds)].sort((a, b) => a - b);
  if (q.type === 'SINGLE_CHOICE') return chosen.length === 1 && correct.includes(chosen[0]);
  return chosen.length === correct.length && chosen.every((id, i) => id === correct.at(i));
}

/**
 * @param {Array<{id: number, type: string, points: number, options: Array<{id: number, isCorrect: boolean}>}>} questions
 * @param {Array<{questionId: number, optionIds?: number[], text?: string}>} answers
 * @returns {{ earned: number, max: number, percent: number, perQuestion: Array<{questionId: number, awarded: number|null}> }}
 */
function scoreAttempt(questions, answers) {
  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));
  let earned = 0;
  let max = 0;
  const perQuestion = [];

  for (const q of questions) {
    if (q.type === 'TEXT') {
      perQuestion.push({ questionId: q.id, awarded: null });
      continue;
    }
    max += q.points;
    const optionIds = byQuestion.get(q.id)?.optionIds;
    const awarded = Array.isArray(optionIds) && isCorrectChoice(q, optionIds) ? q.points : 0;
    earned += awarded;
    perQuestion.push({ questionId: q.id, awarded });
  }

  const percent = max === 0 ? 0 : Math.round((10000 * earned) / max) / 100;
  return { earned, max, percent, perQuestion };
}

module.exports = { scoreAttempt };
