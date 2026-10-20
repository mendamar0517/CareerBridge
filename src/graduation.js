// US-02 – Төгсөлтийн мэдээлэл: сүүлийн 2 жилийн дотор төгссөн эсэх
const MAX_YEARS_SINCE_GRADUATION = 2;

function isEligibleGraduate(graduationDate, now = new Date()) {
  const grad = new Date(graduationDate);
  if (Number.isNaN(grad.getTime())) return false;
  if (grad > now) return false; // ирээдүйн огноо хүлээн авахгүй
  const limit = new Date(now);
  limit.setFullYear(limit.getFullYear() - MAX_YEARS_SINCE_GRADUATION);
  return grad >= limit;
}

module.exports = { isEligibleGraduate, MAX_YEARS_SINCE_GRADUATION };
