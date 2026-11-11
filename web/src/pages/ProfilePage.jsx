// Ажил горилогчийн профайл: US-02 төгсөлт, US-03 боловсрол/туршлага, US-04 ур чадвар, US-05 CV
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, download, openPdf } from '../api';
import { useAuth } from '../auth';
import { DEGREE, date, month, initials } from '../format';
import { Empty, Field, FormError, Icon, Loading, Modal, ProgressBar, useLoad, useToast } from '../ui';

const TABS = [
  { id: 'basic', icon: 'user', label: 'Үндсэн мэдээлэл' },
  { id: 'education', icon: 'grad', label: 'Боловсрол' },
  { id: 'experience', icon: 'briefcase', label: 'Ажлын туршлага' },
  { id: 'skills', icon: 'star', label: 'Ур чадвар' },
  { id: 'cv', icon: 'file', label: 'CV' },
];

/** Хадгалах үйлдлийн нийтлэг логик */
function useSubmit(fn, { success, onDone } = {}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (...args) => {
    setBusy(true);
    setError(null);
    try {
      const r = await fn(...args);
      if (success) toast(success);
      onDone?.(r);
      return r;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { run, busy, error, setError };
}

function BasicTab({ profile, onSaved }) {
  const { refresh } = useAuth();
  const [form, setForm] = useState({ fullName: profile.fullName, phone: profile.phone || '', profession: profile.profession || '', summary: profile.summary || '' });
  const save = useSubmit(() => api('/me/profile', { method: 'PUT', body: form }), { success: 'Профайл хадгалагдлаа', onDone: () => { onSaved(); refresh(); } });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.run(); }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Овог нэр"><input className="input" value={form.fullName} onChange={set('fullName')} /></Field>
        <Field label="Имэйл" hint="Имэйлийг өөрчлөх боломжгүй"><input className="input bg-zinc-50" value={profile.email} disabled /></Field>
        <Field label="Утас"><input className="input" value={form.phone} onChange={set('phone')} placeholder="99112233" /></Field>
        <Field label="Мэргэжил"><input className="input" value={form.profession} onChange={set('profession')} placeholder="Программ хангамжийн инженер" /></Field>
      </div>
      <Field label="Товч танилцуулга" hint="Ажил олгогчид болон CV-д харагдана"><textarea className="input" rows={5} value={form.summary} onChange={set('summary')} /></Field>
      <FormError error={save.error} />
      <button type="submit" className="btn-dark" disabled={save.busy}>Хадгалах</button>
    </form>
  );
}

function EducationModal({ item, onClose, onSaved }) {
  const schools = useLoad(() => api('/me/schools'), []);
  const [form, setForm] = useState({ school: item?.school || '', degree: item?.degree || 'BACHELOR', major: item?.major || '', startDate: item?.startDate || '', graduationDate: item?.graduationDate || '' });
  const save = useSubmit(() => api(item ? `/me/educations/${item.id}` : '/me/educations', { method: item ? 'PUT' : 'POST', body: form }), { success: 'Боловсролын мэдээлэл хадгалагдлаа', onDone: onSaved });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title={item ? 'Боловсрол засах' : 'Боловсрол нэмэх'} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.run(); }}>
        <Field label="Сургууль" hint="Жагсаалтаас сонгох эсвэл шинээр бичих">
          <input className="input" list="schools" value={form.school} onChange={set('school')} placeholder="ШУТИС" />
          <datalist id="schools">{(schools.data || []).map((s) => <option key={s} value={s} />)}</datalist>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Зэрэг">
            <select className="input" value={form.degree} onChange={set('degree')}>{Object.entries(DEGREE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </Field>
          <Field label="Мэргэжил"><input className="input" value={form.major} onChange={set('major')} /></Field>
          <Field label="Элссэн огноо"><input className="input" type="date" value={form.startDate} onChange={set('startDate')} /></Field>
          <Field label="Төгссөн огноо"><input className="input" type="date" value={form.graduationDate} onChange={set('graduationDate')} /></Field>
        </div>
        <FormError error={save.error} />
        <div className="flex justify-end gap-2"><button type="button" className="btn-gray" onClick={onClose}>Болих</button><button type="submit" className="btn-dark" disabled={save.busy}>Хадгалах</button></div>
      </form>
    </Modal>
  );
}

function EducationTab({ profile, onSaved }) {
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const remove = async (id) => {
    if (!window.confirm('Энэ боловсролын мэдээллийг устгах уу?')) return;
    await api(`/me/educations/${id}`, { method: 'DELETE' });
    toast('Устгагдлаа');
    onSaved();
  };
  const el = profile.eligibility;
  return (
    <div>
      <div className={`mb-5 flex items-start gap-3 rounded-xl p-4 text-sm ${el.eligible ? 'bg-accent-soft' : 'bg-amber-50'}`}>
        <Icon name={el.eligible ? 'check' : 'grad'} className={`mt-0.5 ${el.eligible ? 'text-accent' : 'text-amber-600'}`} size={18} />
        <div>
          <p className="font-semibold">{el.eligible ? 'Та 2 жилийн шалгуурыг хангаж байна' : el.reason === 'NO_GRADUATION' ? 'Төгсөлтийн мэдээлэл оруулаагүй байна' : 'Сүүлийн төгсөлт 2 жилээс өмнө'}</p>
          <p className="mt-0.5 text-zinc-600">CareerBridge-ээр хүсэлт гаргахад сүүлийн 2 жилийн дотор төгссөн байх шаардлагатай.</p>
        </div>
      </div>
      {profile.educations.length === 0 ? <Empty icon="grad" title="Боловсролын мэдээлэл алга" action={<button type="button" className="btn-dark" onClick={() => setEditing({})}><Icon name="plus" />Нэмэх</button>} /> : (
        <ul className="divide-y divide-zinc-100">
          {profile.educations.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="font-semibold">{e.school}</p>
                <p className="text-sm text-zinc-600">{DEGREE[e.degree] || e.degree} · {e.major}</p>
                <p className="mt-1 text-xs text-zinc-500">{month(e.startDate) || '—'} – {month(e.graduationDate)}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(e)} aria-label="Засах"><Icon name="edit" /></button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => remove(e.id)} aria-label="Устгах"><Icon name="trash" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {profile.educations.length > 0 && <button type="button" className="btn-outline mt-3" onClick={() => setEditing({})}><Icon name="plus" />Боловсрол нэмэх</button>}
      {editing && <EducationModal item={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onSaved(); }} />}
    </div>
  );
}

function ExperienceModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({ companyName: item?.companyName || '', position: item?.position || '', startDate: item?.startDate || '', endDate: item?.endDate || '', description: item?.description || '' });
  const [current, setCurrent] = useState(item ? !item.endDate : false);
  const body = { ...form, endDate: current ? null : form.endDate };
  const save = useSubmit(() => api(item ? `/me/experiences/${item.id}` : '/me/experiences', { method: item ? 'PUT' : 'POST', body }), { success: 'Ажлын туршлага хадгалагдлаа', onDone: onSaved });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title={item ? 'Туршлага засах' : 'Туршлага нэмэх'} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.run(); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Байгууллага"><input className="input" value={form.companyName} onChange={set('companyName')} /></Field>
          <Field label="Албан тушаал"><input className="input" value={form.position} onChange={set('position')} /></Field>
          <Field label="Эхэлсэн"><input className="input" type="date" value={form.startDate} onChange={set('startDate')} /></Field>
          <Field label="Дууссан"><input className="input" type="date" value={current ? '' : form.endDate} onChange={set('endDate')} disabled={current} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={current} onChange={(e) => setCurrent(e.target.checked)} className="accent-[rgb(var(--accent))]" />Одоо ажиллаж байгаа</label>
        <Field label="Хийсэн ажил"><textarea className="input" rows={3} value={form.description} onChange={set('description')} /></Field>
        <FormError error={save.error} />
        <div className="flex justify-end gap-2"><button type="button" className="btn-gray" onClick={onClose}>Болих</button><button type="submit" className="btn-dark" disabled={save.busy}>Хадгалах</button></div>
      </form>
    </Modal>
  );
}

function ExperienceTab({ profile, onSaved }) {
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const remove = async (id) => {
    if (!window.confirm('Энэ туршлагыг устгах уу?')) return;
    await api(`/me/experiences/${id}`, { method: 'DELETE' });
    toast('Устгагдлаа');
    onSaved();
  };
  return (
    <div>
      {profile.experiences.length === 0 ? <Empty icon="briefcase" title="Ажлын туршлага нэмээгүй байна" action={<button type="button" className="btn-dark" onClick={() => setEditing({})}><Icon name="plus" />Нэмэх</button>}>Дадлага, цагийн ажил, сайн дурын ажил ч хамаарна.</Empty> : (
        <ul className="divide-y divide-zinc-100">
          {profile.experiences.map((x) => (
            <li key={x.id} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="font-semibold">{x.position}</p>
                <p className="text-sm text-zinc-600">{x.companyName}</p>
                <p className="mt-1 text-xs text-zinc-500">{month(x.startDate)} – {x.endDate ? month(x.endDate) : 'одоо'}</p>
                {x.description && <p className="mt-2 text-sm text-zinc-600">{x.description}</p>}
              </div>
              <div className="flex gap-1">
                <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(x)} aria-label="Засах"><Icon name="edit" /></button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => remove(x.id)} aria-label="Устгах"><Icon name="trash" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {profile.experiences.length > 0 && <button type="button" className="btn-outline mt-3" onClick={() => setEditing({})}><Icon name="plus" />Туршлага нэмэх</button>}
      {editing && <ExperienceModal item={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onSaved(); }} />}
    </div>
  );
}

const LEVELS = ['', '1 — Анхан', '2 — Суурь', '3 — Дунд', '4 — Ахисан', '5 — Мэргэжлийн'];

function SkillsTab({ profile, onSaved }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('3');
  const suggestions = useLoad(() => api(`/skills?q=${encodeURIComponent(name)}`), [name]);
  const toast = useToast();
  const add = useSubmit(() => api('/me/skills', { method: 'POST', body: { name, level: level ? Number(level) : null } }), { success: 'Ур чадвар нэмэгдлээ', onDone: () => { setName(''); onSaved(); } });
  const setSkillLevel = async (id, l) => {
    await api(`/me/skills/${id}`, { method: 'PUT', body: { level: l ? Number(l) : null } });
    onSaved();
  };
  const remove = async (id) => {
    await api(`/me/skills/${id}`, { method: 'DELETE' });
    toast('Ур чадвар устгагдлаа');
    onSaved();
  };
  const mine = new Set(profile.skills.map((s) => s.name.toLowerCase()));
  return (
    <div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); add.run(); }}>
        <Field label="Ур чадвар" className="min-w-[200px] flex-1">
          <input className="input" list="skill-options" value={name} onChange={(e) => setName(e.target.value)} placeholder="Жишээ: React, SQL, Англи хэл" />
          <datalist id="skill-options">{(suggestions.data || []).map((s) => <option key={s.id} value={s.name} />)}</datalist>
        </Field>
        <Field label="Түвшин">
          <select className="input w-44" value={level} onChange={(e) => setLevel(e.target.value)}>{LEVELS.map((l, i) => <option key={l} value={i || ''}>{l || 'Түвшингүй'}</option>)}</select>
        </Field>
        <button type="submit" className="btn-dark" disabled={add.busy || !name.trim()}><Icon name="plus" />Нэмэх</button>
      </form>
      <div className="mt-2"><FormError error={add.error} /></div>
      {suggestions.data?.length > 0 && !name && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-zinc-500">Ажлын байранд их шаардагддаг:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.data.filter((s) => !mine.has(s.name.toLowerCase())).slice(0, 10).map((s) => (
              <button key={s.id} type="button" className="chip hover:bg-zinc-200" onClick={() => setName(s.name)}>+ {s.name}</button>
            ))}
          </div>
        </div>
      )}
      {profile.skills.length === 0 ? <Empty icon="star" title="Ур чадвар нэмээгүй байна">Ур чадвараа нэмбэл ажлын байр бүрт тохирооны хувь харагдана.</Empty> : (
        <ul className="mt-5 divide-y divide-zinc-100 rounded-xl border border-line">
          {profile.skills.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium">{s.name}</span>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`lvl-${s.id}`}>Түвшин</label>
                <select id={`lvl-${s.id}`} className="input h-8 w-40 text-[13px]" value={s.level ?? ''} onChange={(e) => setSkillLevel(s.id, e.target.value)}>
                  {LEVELS.map((l, i) => <option key={l} value={i || ''}>{l || 'Түвшингүй'}</option>)}
                </select>
                <button type="button" className="btn-ghost btn-sm" onClick={() => remove(s.id)} aria-label={`${s.name} устгах`}><Icon name="trash" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CvPreview({ snapshot }) {
  const { profile: p, educations, experiences, skills } = snapshot;
  return (
    <div className="rounded-xl border border-line bg-white p-7 text-sm">
      <p className="text-2xl font-bold tracking-tight">{p.fullName}</p>
      <p className="text-zinc-600">{p.profession || 'Мэргэжил оруулаагүй'}</p>
      <p className="mt-1 text-xs text-zinc-500">{[p.email, p.phone].filter(Boolean).join(' · ')}</p>
      {p.summary && <><h3 className="mt-5 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide">Товч танилцуулга</h3><p className="mt-2 leading-relaxed text-zinc-700">{p.summary}</p></>}
      <h3 className="mt-5 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide">Боловсрол</h3>
      {educations.map((e, i) => <div key={i} className="mt-2"><p className="font-semibold">{e.school} <span className="font-normal text-zinc-500">{month(e.startDate) || '—'} – {month(e.graduationDate)}</span></p><p className="text-zinc-600">{DEGREE[e.degree] || e.degree} · {e.major}</p></div>)}
      <h3 className="mt-5 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide">Ажлын туршлага</h3>
      {experiences.length === 0 ? <p className="mt-2 text-zinc-500">Мэдээлэл оруулаагүй</p> : experiences.map((x, i) => (
        <div key={i} className="mt-2"><p className="font-semibold">{x.position} — {x.companyName} <span className="font-normal text-zinc-500">{month(x.startDate)} – {x.endDate ? month(x.endDate) : 'одоо'}</span></p>{x.description && <p className="text-zinc-600">{x.description}</p>}</div>
      ))}
      <h3 className="mt-5 border-b border-line pb-1 text-xs font-bold uppercase tracking-wide">Ур чадвар</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">{skills.length === 0 ? <span className="text-zinc-500">Мэдээлэл оруулаагүй</span> : skills.map((s) => <span key={s.name} className="chip">{s.name}{s.level ? ` · ${s.level}/5` : ''}</span>)}</div>
    </div>
  );
}

function CvTab({ profile, onSaved }) {
  const cvs = useLoad(() => api('/me/cvs'), [profile.cvCount]);
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState(null);
  const toast = useToast();
  const create = useSubmit(() => api('/me/cvs', { method: 'POST', body: { title } }), { success: 'CV үүслээ', onDone: (cv) => { setTitle(''); setPreview(cv); onSaved(); } });
  const remove = async (id) => {
    if (!window.confirm('Энэ CV-г устгах уу?')) return;
    try {
      await api(`/me/cvs/${id}`, { method: 'DELETE' });
      toast('CV устгагдлаа');
      onSaved();
    } catch (err) {
      toast(err.message, 'error');
    }
  };
  return (
    <div>
      <p className="text-sm text-zinc-600">CV нь таны профайлын <b>одоогийн</b> мэдээллээс (боловсрол, туршлага, ур чадвар) үүсч хадгалагдана. Профайлаа шинэчилсний дараа шинэ CV үүсгээрэй.</p>
      <form className="mt-4 flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); create.run(); }}>
        <label className="sr-only" htmlFor="cv-title">CV-ийн нэр</label>
        <input id="cv-title" className="input min-w-[200px] flex-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="CV-ийн нэр (жишээ: Backend CV)" />
        <button type="submit" className="btn-accent" disabled={create.busy}><Icon name="plus" />Профайлаас CV үүсгэх</button>
      </form>
      <div className="mt-2"><FormError error={create.error} /></div>
      {cvs.loading ? <Loading /> : cvs.data.length === 0 ? <Empty icon="file" title="CV үүсгээгүй байна" /> : (
        <ul className="mt-5 divide-y divide-zinc-100 rounded-xl border border-line">
          {cvs.data.map((cv) => (
            <li key={cv.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-canvas"><Icon name="file" /></span>
                <div><p className="font-medium">{cv.title}</p><p className="text-xs text-zinc-500">{date(cv.createdAt)}</p></div>
              </div>
              <div className="flex gap-1.5">
                <button type="button" className="btn-outline btn-sm" onClick={() => setPreview(cv)}><Icon name="eye" />Харах</button>
                <button type="button" className="btn-dark btn-sm" onClick={() => download(`/cvs/${cv.id}/pdf`, `CareerBridge-CV-${cv.id}.pdf`)}><Icon name="download" />PDF</button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => remove(cv.id)} aria-label="Устгах"><Icon name="trash" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {preview && (
        <Modal title={preview.title} onClose={() => setPreview(null)} wide>
          <CvPreview snapshot={preview.snapshot} />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => openPdf(`/cvs/${preview.id}/pdf`)}><Icon name="eye" />PDF харах</button>
            <button type="button" className="btn-dark" onClick={() => download(`/cvs/${preview.id}/pdf`, `CareerBridge-CV-${preview.id}.pdf`)}><Icon name="download" />PDF татах</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'basic';
  const { data: profile, loading, error, reload } = useLoad(() => api('/me/profile'), []);
  const toast = useToast();
  useEffect(() => {
    if (params.get('welcome')) {
      toast('Тавтай морил! Эхлээд профайлаа бөглөнө үү');
      params.delete('welcome');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !profile) return <Loading />;
  if (error) return <FormError error={error} />;
  const Tab = { basic: BasicTab, education: EducationTab, experience: ExperienceTab, skills: SkillsTab, cv: CvTab }[tab];
  const counts = { education: profile.educations.length, experience: profile.experiences.length, skills: profile.skills.length, cv: profile.cvCount };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
        <div className="card overflow-hidden">
          <div className="banner h-20" />
          <div className="px-5 pb-5">
            <span className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-ink text-lg font-semibold text-white">{initials(profile.fullName)}</span>
            <p className="mt-2 font-bold">{profile.fullName}</p>
            <p className="text-sm text-zinc-500">{profile.profession || 'Мэргэжил оруулаагүй'}</p>
            <div className="mt-4 text-[13px]">
              <div className="mb-2 flex justify-between font-semibold"><span>Профайл бүрдүүлэлт</span><span>{profile.completeness}%</span></div>
              <ProgressBar value={profile.completeness} />
            </div>
          </div>
        </div>
        <nav className="card p-2" aria-label="Профайлын хэсгүүд">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setParams({ tab: t.id })} aria-current={tab === t.id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${tab === t.id ? 'bg-canvas font-semibold' : 'text-zinc-600 hover:bg-zinc-50'}`}>
              <Icon name={t.icon} />{t.label}
              {counts[t.id] !== undefined && <span className="ml-auto text-xs text-zinc-400">{counts[t.id]}</span>}
            </button>
          ))}
        </nav>
      </aside>
      <section className="card min-w-0 p-6 sm:p-7">
        <h1 className="mb-5 text-xl font-semibold tracking-tight">{TABS.find((t) => t.id === tab).label}</h1>
        <Tab key={tab} profile={profile} onSaved={reload} />
      </section>
    </div>
  );
}
