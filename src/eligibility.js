// US-02 – Ажил горилогч платформд тэнцэх эсэх (сүүлийн 2 жилд төгссөн)
// Өгөгдлийн санд шууд хандахгүй: repository-г гаднаас дамжуулна (dependency injection).
// Ингэснээр тестэд repository-г mock-оор орлуулж, зөвхөн логикийг тусгаарлан шалгана.
const { isEligibleGraduate } = require('./graduation');

/**
 * @param {{ findLatestGraduationDate: (seekerId: number) => Promise<string|Date|null> }} repo
 * @param {number} seekerId
 * @param {Date} [now]
 * @returns {Promise<{ seekerId: number, eligible: boolean, reason: string }>}
 */
async function getSeekerEligibility(repo, seekerId, now = new Date()) {
  if (!Number.isInteger(seekerId) || seekerId <= 0) {
    throw new Error('seekerId буруу байна');
  }

  const graduationDate = await repo.findLatestGraduationDate(seekerId);
  if (!graduationDate) {
    return { seekerId, eligible: false, reason: 'NO_GRADUATION' };
  }

  const eligible = isEligibleGraduate(graduationDate, now);
  return { seekerId, eligible, reason: eligible ? 'WITHIN_2_YEARS' : 'OVER_2_YEARS' };
}

module.exports = { getSeekerEligibility };
