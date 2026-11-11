// US-10 – Хүсэлтийн төлөвийн шилжилт
const FINAL = new Set(['ACCEPTED', 'REJECTED', 'WITHDRAWN']);
const EMPLOYER_TARGETS = new Set(['REVIEWING', 'ASSESSMENT', 'INTERVIEW', 'ACCEPTED', 'REJECTED']);

const LABELS = Object.freeze({
  SUBMITTED: 'Илгээсэн',
  REVIEWING: 'Хянаж байна',
  ASSESSMENT: 'Шалгалтын шат',
  INTERVIEW: 'Ярилцлага',
  ACCEPTED: 'Тэнцсэн',
  REJECTED: 'Татгалзсан',
  WITHDRAWN: 'Буцаасан',
});

/** Ажил олгогч төлөвийг солих боломжтой эсэх */
function canEmployerSet(current, next) {
  return !FINAL.has(current) && EMPLOYER_TARGETS.has(next) && current !== next;
}

/** Ажил горилогч хүсэлтээ буцаах боломжтой эсэх */
function canWithdraw(current) {
  return !FINAL.has(current);
}

const isFinal = (status) => FINAL.has(status);

module.exports = { canEmployerSet, canWithdraw, isFinal, LABELS };
