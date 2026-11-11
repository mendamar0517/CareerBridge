// Дэлгэцэнд харуулах хэлбэржүүлэлт, шошго
export const EMPLOYMENT = { FULL_TIME: 'Бүтэн цаг', PART_TIME: 'Цагийн', INTERNSHIP: 'Дадлага', CONTRACT: 'Гэрээт' };
export const DEGREE = { DIPLOMA: 'Диплом', BACHELOR: 'Бакалавр', MASTER: 'Магистр', DOCTOR: 'Доктор' };
export const STATUS = {
  SUBMITTED: { label: 'Илгээсэн', tone: 'bg-zinc-100 text-zinc-700' },
  REVIEWING: { label: 'Хянаж байна', tone: 'bg-sky-50 text-sky-700' },
  ASSESSMENT: { label: 'Шалгалтын шат', tone: 'bg-violet-50 text-violet-700' },
  INTERVIEW: { label: 'Ярилцлага', tone: 'bg-amber-50 text-amber-700' },
  ACCEPTED: { label: 'Тэнцсэн', tone: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: 'Татгалзсан', tone: 'bg-rose-50 text-rose-700' },
  WITHDRAWN: { label: 'Буцаасан', tone: 'bg-zinc-100 text-zinc-500' },
};
export const JOB_STATUS = {
  DRAFT: { label: 'Ноорог', tone: 'bg-zinc-100 text-zinc-600' },
  PUBLISHED: { label: 'Нийтлэгдсэн', tone: 'bg-accent-soft text-accent' },
  CLOSED: { label: 'Хаагдсан', tone: 'bg-rose-50 text-rose-700' },
};
export const QUESTION_TYPE = { SINGLE_CHOICE: 'Нэг сонголттой', MULTIPLE_CHOICE: 'Олон сонголттой', TEXT: 'Текст хариулт' };

const million = (n) => {
  const v = n / 1_000_000;
  return `${Number.isInteger(v) ? v : v.toFixed(1).replace(/\.0$/, '')} сая`;
};

export function salary(min, max) {
  if (!min && !max) return 'Цалин тохиролцоно';
  if (min && max && min !== max) return `₮${million(min)} - ${million(max)}/сард`;
  return `₮${million(min || max)}/сард`;
}

export function timeAgo(value) {
  if (!value) return '';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Дөнгөж сая';
  if (m < 60) return `${m} минутын өмнө`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цагийн өмнө`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} өдрийн өмнө`;
  if (d < 30) return `${Math.floor(d / 7)} долоо хоногийн өмнө`;
  return `${Math.floor(d / 30)} сарын өмнө`;
}

export function date(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function month(value) {
  return value ? String(value).slice(0, 7).replace('-', '.') : '';
}

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
