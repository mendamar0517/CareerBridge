// US-08 – Ур чадварын тохироо
// v_job_match view-тэй ижил дүрэм: зөвхөн заавал (is_required) ур чадварыг тооцно.
// Шаардлагагүй бол 100%. Том/жижиг үсэг ялгахгүй (skills.js-тэй нийцнэ).

/**
 * @param {Array<{name: string, level?: number|null}>} seekerSkills
 * @param {Array<{name: string, isRequired?: boolean, minLevel?: number|null}>} jobSkills
 */
function computeMatch(seekerSkills, jobSkills) {
  const have = new Map(seekerSkills.map((s) => [s.name.toLowerCase(), s.level ?? null]));
  const matched = [];
  const missing = [];
  const optional = [];

  for (const js of jobSkills) {
    const key = js.name.toLowerCase();
    const owned = have.has(key);
    if (js.isRequired === false) {
      optional.push({ name: js.name, owned });
    } else if (owned) {
      matched.push(js.name);
    } else {
      missing.push(js.name);
    }
  }

  const required = matched.length + missing.length;
  const percent = required === 0 ? 100 : Math.round((1000 * matched.length) / required) / 10;
  return { percent, matched, missing, optional, required };
}

module.exports = { computeMatch };
