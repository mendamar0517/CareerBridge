// US-04 – Ур чадвар бүртгэх
function addSkill(skills, skill) {
  if (typeof skill !== 'string' || skill.trim() === '') {
    throw new Error('Ур чадварын нэр хоосон байна');
  }
  const name = skill.trim();
  const exists = skills.some((s) => s.toLowerCase() === name.toLowerCase());
  return exists ? [...skills] : [...skills, name];
}

module.exports = { addSkill };
