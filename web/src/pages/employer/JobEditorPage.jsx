// US-12 ажлын байр үүсгэх/нийтлэх, US-13 шаардлагатай ур чадвар, US-14 онлайн шалгалт үүсгэх
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { EMPLOYMENT, JOB_STATUS, QUESTION_TYPE } from '../../format';
import { Badge, Field, FormError, Icon, Loading, useLoad, useToast } from '../../ui';

const EMPTY_JOB = { title: '', description: '', profession: '', location: '', employmentType: 'FULL_TIME', salaryMin: '', salaryMax: '', deadline: '', skills: [] };

function SkillsEditor({ skills, onChange }) {
  const [name, setName] = useState('');
  const suggestions = useLoad(() => api(`/skills?q=${encodeURIComponent(name)}`), [name]);
  const add = () => {
    const n = name.trim();
    if (!n || skills.some((s) => s.name.toLowerCase() === n.toLowerCase())) return setName('');
    onChange([...skills, { name: n, isRequired: true, minLevel: null }]);
    return setName('');
  };
  const update = (i, patch) => onChange(skills.map((s, j) => (i === j ? { ...s, ...patch } : s)));
  return (
    <div>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="skill-add">Ур чадвар нэмэх</label>
        <input id="skill-add" className="input" list="job-skill-options" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ур чадвар бичээд Enter дарна уу"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <datalist id="job-skill-options">{(suggestions.data || []).map((s) => <option key={s.id} value={s.name} />)}</datalist>
        <button type="button" className="btn-dark" onClick={add}><Icon name="plus" />Нэмэх</button>
      </div>
      {skills.length === 0 ? <p className="mt-3 text-sm text-zinc-500">Нийтлэхийн өмнө дор хаяж нэг ур чадвар тодорхойлно.</p> : (
        <ul className="mt-3 divide-y divide-zinc-100 rounded-xl border border-line">
          {skills.map((s, i) => (
            <li key={s.name} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <span className="flex-1 font-medium">{s.name}</span>
              <label className="sr-only" htmlFor={`req-${i}`}>Шаардлагын төрөл</label>
              <select id={`req-${i}`} className="input h-8 w-36 text-[13px]" value={s.isRequired ? 'req' : 'opt'} onChange={(e) => update(i, { isRequired: e.target.value === 'req' })}>
                <option value="req">Заавал</option><option value="opt">Давуу тал</option>
              </select>
              <label className="sr-only" htmlFor={`lvl-${i}`}>Доод түвшин</label>
              <select id={`lvl-${i}`} className="input h-8 w-36 text-[13px]" value={s.minLevel ?? ''} onChange={(e) => update(i, { minLevel: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Түвшин заахгүй</option>{[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>Доод түвшин {l}</option>)}
              </select>
              <button type="button" className="btn-ghost btn-sm" onClick={() => onChange(skills.filter((_, j) => j !== i))} aria-label={`${s.name} хасах`}><Icon name="trash" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JobForm({ job, onSaved }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(() => ({ ...EMPTY_JOB, ...job, salaryMin: job?.salaryMin ?? '', salaryMax: job?.salaryMax ?? '', deadline: job?.deadline ?? '', location: job?.location ?? '' }));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const closed = job?.status === 'CLOSED';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      ...form,
      salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
      salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax),
      skills: form.skills.map(({ name, isRequired, minLevel }) => ({ name, isRequired, minLevel })),
    };
    try {
      if (job?.id) {
        await api(`/employer/jobs/${job.id}`, { method: 'PUT', body });
        toast('Хадгалагдлаа');
        onSaved();
      } else {
        const r = await api('/employer/jobs', { method: 'POST', body });
        toast(r.message);
        navigate(`/employer/jobs/${r.id}`, { replace: true });
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={submit}>
      <fieldset disabled={closed} className="space-y-6">
        <section className="card space-y-4 p-6 sm:p-7">
          <h2 className="font-semibold">Үндсэн мэдээлэл</h2>
          <Field label="Ажлын байрны нэр"><input className="input" value={form.title} onChange={set('title')} placeholder="Junior Backend хөгжүүлэгч" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Мэргэжил" hint="Ажил горилогч мэргэжлээр хайхад ашиглагдана"><input className="input" value={form.profession} onChange={set('profession')} placeholder="Программ хангамжийн инженер" /></Field>
            <Field label="Ажлын төрөл"><select className="input" value={form.employmentType} onChange={set('employmentType')}>{Object.entries(EMPLOYMENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Байршил"><input className="input" value={form.location} onChange={set('location')} placeholder="Улаанбаатар" /></Field>
            <Field label="Хүсэлт хүлээн авах эцсийн огноо"><input className="input" type="date" value={form.deadline} onChange={set('deadline')} /></Field>
            <Field label="Цалин (доод), ₮"><input className="input" type="number" min="0" step="50000" value={form.salaryMin} onChange={set('salaryMin')} /></Field>
            <Field label="Цалин (дээд), ₮"><input className="input" type="number" min="0" step="50000" value={form.salaryMax} onChange={set('salaryMax')} /></Field>
          </div>
          <Field label="Тодорхойлолт" hint="Үүрэг, шаардлага, санал болгох нөхцөл"><textarea className="input" rows={9} value={form.description} onChange={set('description')} /></Field>
        </section>
        <section className="card p-6 sm:p-7">
          <h2 className="font-semibold">Шаардлагатай ур чадвар</h2>
          <p className="mb-4 mt-1 text-sm text-zinc-500">«Заавал» ур чадварууд тохирооны хувийг тооцоход ашиглагдана. «Давуу тал» нь тооцоонд орохгүй.</p>
          <SkillsEditor skills={form.skills} onChange={(skills) => setForm({ ...form, skills })} />
        </section>
      </fieldset>
      <FormError error={error} />
      {!closed && <button type="submit" className="btn-dark h-11 px-6" disabled={busy}>{job?.id ? 'Өөрчлөлт хадгалах' : 'Ноорог хадгалах'}</button>}
    </form>
  );
}

const newQuestion = (type = 'SINGLE_CHOICE') => ({ body: '', type, points: 1, options: type === 'TEXT' ? [] : [{ body: '', isCorrect: true }, { body: '', isCorrect: false }] });

function AssessmentBuilder({ jobId }) {
  const toast = useToast();
  const existing = useLoad(() => api(`/employer/jobs/${jobId}/assessment`), [jobId]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (existing.loading) return;
    const a = existing.data;
    setForm(a
      ? { title: a.title, timeLimitMinutes: a.timeLimitMinutes ?? '', passScore: a.passScore ?? '', questions: a.questions.map((q) => ({ body: q.body, type: q.type, points: q.points, options: q.options.map((o) => ({ body: o.body, isCorrect: o.isCorrect })) })) }
      : { title: 'Мэргэжлийн шалгалт', timeLimitMinutes: 15, passScore: 60, questions: [newQuestion()] });
  }, [existing.loading, existing.data]);

  if (existing.loading || !form) return <Loading />;
  const locked = existing.data?.attemptCount > 0;
  const setQ = (i, patch) => setForm({ ...form, questions: form.questions.map((q, j) => (i === j ? { ...q, ...patch } : q)) });
  const setOpt = (qi, oi, patch) => {
    const q = form.questions[qi];
    const options = q.options.map((o, j) => {
      if (j === oi) return { ...o, ...patch };
      if (patch.isCorrect && q.type === 'SINGLE_CHOICE') return { ...o, isCorrect: false };
      return o;
    });
    setQ(qi, { options });
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/employer/jobs/${jobId}/assessment`, { method: 'PUT', body: {
        ...form,
        timeLimitMinutes: form.timeLimitMinutes === '' ? null : Number(form.timeLimitMinutes),
        passScore: form.passScore === '' ? null : Number(form.passScore),
        questions: form.questions.map((q) => ({ ...q, points: Number(q.points) || 1 })),
      } });
      toast('Шалгалт хадгалагдлаа');
      existing.reload();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!window.confirm('Шалгалтыг устгах уу?')) return;
    try {
      await api(`/employer/jobs/${jobId}/assessment`, { method: 'DELETE' });
      toast('Шалгалт устгагдлаа');
      existing.reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const total = form.questions.reduce((s, q) => s + (Number(q.points) || 0), 0);

  return (
    <div className="space-y-5">
      {locked && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{existing.data.attemptCount} горилогч шалгалт өгсөн тул асуултыг өөрчлөх боломжгүй.</div>}
      <fieldset disabled={locked} className="space-y-5">
        <section className="card grid gap-4 p-6 sm:grid-cols-3 sm:p-7">
          <Field label="Шалгалтын нэр" className="sm:col-span-3"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Хугацаа (минут)" hint="Хоосон бол хязгааргүй"><input className="input" type="number" min="1" max="300" value={form.timeLimitMinutes} onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })} /></Field>
          <Field label="Тэнцэх оноо (%)"><input className="input" type="number" min="0" max="100" value={form.passScore} onChange={(e) => setForm({ ...form, passScore: e.target.value })} /></Field>
          <div className="flex items-end text-sm text-zinc-500">{form.questions.length} асуулт · нийт {total} оноо</div>
        </section>
        {form.questions.map((q, qi) => (
          <section key={qi} className="card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">{qi + 1}</span>
              <label className="sr-only" htmlFor={`qt-${qi}`}>Асуултын төрөл</label>
              <select id={`qt-${qi}`} className="input h-9 w-48" value={q.type} onChange={(e) => setQ(qi, { type: e.target.value, options: e.target.value === 'TEXT' ? [] : (q.options.length ? q.options : newQuestion().options) })}>
                {Object.entries(QUESTION_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">Оноо<input className="input h-9 w-20" type="number" min="1" max="100" value={q.points} onChange={(e) => setQ(qi, { points: e.target.value })} /></label>
              <button type="button" className="btn-ghost btn-sm ml-auto" disabled={form.questions.length === 1} onClick={() => setForm({ ...form, questions: form.questions.filter((_, j) => j !== qi) })}><Icon name="trash" />Устгах</button>
            </div>
            <label className="sr-only" htmlFor={`qb-${qi}`}>Асуулт</label>
            <textarea id={`qb-${qi}`} className="input mt-3" rows={2} value={q.body} onChange={(e) => setQ(qi, { body: e.target.value })} placeholder="Асуултаа бичнэ үү" />
            {q.type === 'TEXT' ? <p className="mt-2 text-xs text-zinc-500">Текст хариултыг автоматаар үнэлэхгүй — та горилогчийн хариултыг өөрөө үзнэ.</p> : (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-zinc-500">Зөв хариултыг тэмдэглэнэ үү{q.type === 'MULTIPLE_CHOICE' ? ' (нэгээс олон байж болно)' : ''}.</p>
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type={q.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'} name={`correct-${qi}`} checked={o.isCorrect} onChange={(e) => setOpt(qi, oi, { isCorrect: e.target.checked })} className="accent-[rgb(var(--accent))]" aria-label="Зөв хариулт" />
                    <input className="input h-9" value={o.body} onChange={(e) => setOpt(qi, oi, { body: e.target.value })} placeholder={`Хувилбар ${oi + 1}`} />
                    <button type="button" className="btn-ghost btn-sm" disabled={q.options.length <= 2} onClick={() => setQ(qi, { options: q.options.filter((_, j) => j !== oi) })} aria-label="Хувилбар хасах"><Icon name="x" /></button>
                  </div>
                ))}
                {q.options.length < 10 && <button type="button" className="btn-ghost btn-sm" onClick={() => setQ(qi, { options: [...q.options, { body: '', isCorrect: false }] })}><Icon name="plus" />Хувилбар нэмэх</button>}
              </div>
            )}
          </section>
        ))}
        <button type="button" className="btn-outline w-full" onClick={() => setForm({ ...form, questions: [...form.questions, newQuestion()] })}><Icon name="plus" />Асуулт нэмэх</button>
      </fieldset>
      <FormError error={error} />
      {!locked && (
        <div className="flex gap-2">
          <button type="button" className="btn-dark h-11 px-6" onClick={save} disabled={busy}>Шалгалт хадгалах</button>
          {existing.data && <button type="button" className="btn-ghost h-11 text-rose-600" onClick={remove}>Шалгалт устгах</button>}
        </div>
      )}
    </div>
  );
}

export default function JobEditorPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const job = useLoad(() => (id ? api(`/employer/jobs/${id}`) : Promise.resolve(null)), [id]);
  const tab = params.get('tab') === 'assessment' && id ? 'assessment' : 'info';

  if (job.loading) return <Loading />;
  if (job.error) return <FormError error={job.error} />;
  const j = job.data;

  const transition = async (kind) => {
    if (kind === 'close' && !window.confirm('Ажлын байрыг хаах уу?')) return;
    try {
      const r = await api(`/employer/jobs/${id}/${kind}`, { method: 'POST' });
      toast(r.message || 'Ажлын байр хаагдлаа');
      job.reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/employer" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-ink"><Icon name="arrowLeft" />Миний ажлын байр</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{j ? j.title : 'Шинэ ажлын байр'}</h1>
            {j && <Badge className={JOB_STATUS[j.status].tone}>{JOB_STATUS[j.status].label}</Badge>}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{j ? 'Ноорог ажлын байр горилогчдод харагдахгүй. Нийтэлсний дараа харагдана.' : 'Эхлээд ноорог хэлбэрээр хадгалаад, дараа нь нийтэлнэ.'}</p>
        </div>
        {j && (
          <div className="flex gap-2">
            {j.status === 'PUBLISHED' && <Link to={`/jobs/${j.id}`} className="btn-outline"><Icon name="eye" />Харах</Link>}
            <Link to={`/employer/jobs/${j.id}/applicants`} className="btn-outline"><Icon name="users" />Горилогчид</Link>
            {j.status === 'DRAFT' && <button type="button" className="btn-accent" onClick={() => transition('publish')}>Нийтлэх</button>}
            {j.status === 'PUBLISHED' && <button type="button" className="btn-gray" onClick={() => transition('close')}>Хаах</button>}
          </div>
        )}
      </div>
      {j && (
        <div className="tab-group mb-5">
          <button type="button" className={`tab ${tab === 'info' ? 'tab-active' : ''}`} onClick={() => setParams({})}>Мэдээлэл ба шаардлага</button>
          <button type="button" className={`tab ${tab === 'assessment' ? 'tab-active' : ''}`} onClick={() => setParams({ tab: 'assessment' })}>Онлайн шалгалт</button>
        </div>
      )}
      {tab === 'info' ? <JobForm key={j?.id || 'new'} job={j} onSaved={job.reload} /> : <AssessmentBuilder jobId={j.id} />}
    </div>
  );
}
