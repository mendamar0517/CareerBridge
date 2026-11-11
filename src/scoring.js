// US-14 – Онлайн шалгалтын автомат оноо
// SINGLE_CHOICE: зөв хувилбарыг сонговол бүтэн оноо.
// MULTIPLE_CHOICE: сонгосон хувилбарууд зөв хувилбаруудтай яг ижил бол бүтэн оноо (хэсэгчилсэн оноогүй).
// TEXT: автоматаар үнэлэхгүй (null) — нийт оноонд 0-ээр тооцно.

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
    max += q.points;
    const answer = byQuestion.get(q.id);
    let awarded = 0;

    if (q.type === 'TEXT') {
      awarded = null;
    } else if (answer && Array.isArray(answer.optionIds)) {
      const correct = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort((a, b) => a - b);
      const chosen = [...new Set(answer.optionIds)].sort((a, b) => a - b);
      const single = q.type === 'SINGLE_CHOICE' && chosen.length === 1 && correct.includes(chosen[0]);
      const exact = chosen.length === correct.length && chosen.every((id, i) => id === correct.at(i));
      if (single || (q.type === 'MULTIPLE_CHOICE' && exact)) awarded = q.points;
    }

    if (awarded) earned += awarded;
    perQuestion.push({ questionId: q.id, awarded });
  }

  const percent = max === 0 ? 0 : Math.round((10000 * earned) / max) / 100;
  return { earned, max, percent, perQuestion };
}

module.exports = { scoreAttempt };
