// US-06 ажлын байр хайх, US-08 тохироо (жагсаалтад)
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { EMPLOYMENT, DEGREE, salary, timeAgo, initials } from '../format';
import { Empty, Icon, Loading, MatchBadge, ProgressBar, SkillChips, useLoad, FormError } from '../ui';

const TABS = [
  { id: 'match', label: 'Тохироо өндөр', seekerOnly: true, params: { sort: 'match' } },
  { id: 'new', label: 'Шинэ', params: { sort: 'new' } },
  { id: 'intern', label: 'Дадлага', params: { type: 'INTERNSHIP' } },
  { id: 'part', label: 'Цагийн', params: { type: 'PART_TIME' } },
  { id: 'salary', label: 'Өндөр цалинтай', params: { sort: 'salary' } },
];

function SideCard() {
  const { user, isSeeker, isEmployer } = useAuth();
  const profile = useLoad(() => (isSeeker ? api('/me/profile') : Promise.resolve(null)), [isSeeker]);
  const stats = useLoad(() => (user ? Promise.resolve(null) : api('/stats')), [user]);

  if (isEmployer) {
    return (
      <aside className="card overflow-hidden">
        <div className="banner h-24" />
        <div className="p-5">
          <span className="-mt-12 mb-3 flex h-14 w-14 items-center justify-center rounded-xl border-4 border-white bg-ink text-white"><Icon name="building" size={22} /></span>
          <h2 className="text-lg font-bold">{user.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">Ажил олгогчийн бүртгэл</p>
          <Link to="/employer/jobs/new" className="btn-dark mt-5 w-full"><Icon name="plus" />Ажлын байр нийтлэх</Link>
          <Link to="/employer" className="btn-gray mt-2 w-full">Миний ажлын байр</Link>
        </div>
      </aside>
    );
  }

  if (isSeeker) {
    const p = profile.data;
    return (
      <aside className="card overflow-hidden">
        <div className="banner h-24" />
        <div className="px-5 pb-5">
          <span className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-ink text-lg font-semibold text-white">{initials(user.name)}</span>
          <h2 className="mt-2.5 text-lg font-bold tracking-tight">{user.name}</h2>
          {p && <p className="text-[13px] text-zinc-500">{p.educations[0] ? `${p.educations[0].school} · ${DEGREE[p.educations[0].degree]}` : p.profession || 'Профайлаа бөглөнө үү'}</p>}
          {profile.loading ? <Loading /> : p && (
            <div className="my-4 space-y-4 border-y border-zinc-100 py-4 text-[13px]">
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${p.eligibility.eligible ? 'bg-accent-soft text-accent' : 'bg-amber-50 text-amber-600'}`}>
                  <Icon name={p.eligibility.eligible ? 'check' : 'grad'} />
                </span>
                <span>
                  <b className="font-semibold">{p.eligibility.eligible ? 'Шалгуур хангасан' : 'Шалгуур тодорхойгүй'}</b><br />
                  <span className="text-zinc-500">{p.eligibility.eligible ? 'Сүүлийн 2 жилд төгссөн' : p.eligibility.reason === 'NO_GRADUATION' ? 'Төгсөлтийн мэдээллээ оруулна уу' : '2 жилээс өмнө төгссөн'}</span>
                </span>
              </div>
              <div>
                <div className="mb-2 flex justify-between font-semibold"><span>Профайл бүрдүүлэлт</span><span>{p.completeness}%</span></div>
                <ProgressBar value={p.completeness} />
              </div>
              <div>
                <p className="mb-2 font-semibold">Миний ур чадвар</p>
                {p.skills.length === 0 ? <p className="text-zinc-500">Ур чадвар нэмээгүй байна</p> : (
                  <div className="flex flex-wrap gap-1.5">{p.skills.map((s) => <span key={s.id} className="chip">{s.name}</span>)}</div>
                )}
              </div>
            </div>
          )}
          <Link to="/profile?tab=cv" className="btn-dark w-full">CV үүсгэх, татах</Link>
          <Link to="/profile" className="btn-gray mt-2 w-full">Профайл засах</Link>
        </div>
      </aside>
    );
  }

  const s = stats.data;
  return (
    <aside className="card overflow-hidden">
      <div className="banner h-28" />
      <div className="p-5">
        <h2 className="text-lg font-bold tracking-tight">Ур чадвартаа тохирох ажлаа ол!</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">CareerBridge нь сүүлийн 2 жилд төгссөн залуучуудыг ажил олгогчтой холбодог платформ.</p>
        {s && (
          <ul className="my-5 space-y-3.5 border-y border-zinc-100 py-5 text-sm">
            <li className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas"><Icon name="briefcase" /></span><span><b>{s.jobs}</b> ажлын байр нээлттэй</span></li>
            <li className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas"><Icon name="building" /></span><span><b>{s.companies}</b> байгууллага бүртгэлтэй</span></li>
            <li className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas"><Icon name="users" /></span><span><b>{s.applications30d}</b> хүсэлт сүүлийн 30 хоногт</span></li>
          </ul>
        )}
        <ul className="mb-5 space-y-3 text-[13px] font-medium">
          <li className="flex gap-3"><Icon name="sparkle" className="mt-0.5 shrink-0 text-accent" />Ур чадвартаа тохирох хувийг ажлын байр бүр дээр харна</li>
          <li className="flex gap-3"><Icon name="file" className="mt-0.5 shrink-0 text-accent" />Профайлаасаа CV үүсгэж PDF-ээр татна</li>
        </ul>
        <Link to="/login" className="btn-dark w-full">Нэвтрэх</Link>
        <Link to="/register" className="btn-gray mt-2 w-full">Бүртгүүлэх</Link>
      </div>
    </aside>
  );
}

export function JobRow({ job }) {
  return (
    <article className="flex gap-4 border-b border-zinc-100 py-5 last:border-0">
      <span aria-hidden="true" className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-line bg-canvas text-lg font-bold">{initials(job.company.name)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h3 className="text-[17px] font-semibold tracking-tight"><Link to={`/jobs/${job.id}`} className="hover:underline">{job.title}</Link></h3>
            <p className="text-sm text-link">{job.company.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[13px] font-medium">
            {job.isNew && <span className="text-yellow-600">✦ Шинэ</span>}
            {job.isUrgent && <span className="text-orange-600">● Яаралтай</span>}
            {job.match && <MatchBadge percent={job.match.percent} />}
            {job.hasApplied && <span className="rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white">Хүсэлт илгээсэн</span>}
            <span className="flex items-center gap-1 border-l border-line pl-3 text-zinc-500"><Icon name="users" size={14} />{job.applicantCount} хүсэлт</span>
          </div>
        </div>
        <div className="mt-2.5"><SkillChips skills={job.skills} match={job.match} /></div>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[17px] font-medium">{salary(job.salaryMin, job.salaryMax)}</span>
          <span className="text-xs text-zinc-400">{EMPLOYMENT[job.employmentType]} · {job.location || '—'} · {timeAgo(job.publishedAt)}</span>
        </div>
      </div>
    </article>
  );
}

export default function JobsPage() {
  const { isSeeker, user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const tab = params.get('tab') || (isSeeker ? 'match' : 'new');
  const filters = { q: params.get('q') || '', type: params.get('type') || '', location: params.get('location') || '', profession: params.get('profession') || '', skill: params.get('skill') || '' };
  const professions = useLoad(() => api('/professions'), []);

  const activeTab = TABS.find((t) => t.id === tab) || TABS[1];
  const query = new URLSearchParams(Object.entries({ ...filters, ...activeTab.params }).filter(([, v]) => v)).toString();
  const jobs = useLoad(() => api(`/jobs?${query}`), [query, user?.id]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  const hasFilters = Object.values(filters).some(Boolean);
  const visibleTabs = TABS.filter((t) => !t.seekerOnly || isSeeker);

  return (
    <div className="grid gap-7 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="order-2 lg:order-1 lg:sticky lg:top-[88px] lg:self-start"><SideCard /></div>
      <div className="order-1 min-w-0 space-y-5 lg:order-2">
        <section className="card p-5 sm:px-7">
          <form role="search" onSubmit={(e) => { e.preventDefault(); update({ q: q.trim() }); }}
            className="flex items-center gap-2.5 rounded-xl border border-zinc-300 py-1.5 pl-4 pr-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <Icon name="search" size={18} className="shrink-0 text-zinc-400" />
            <label htmlFor="job-q" className="sr-only">Ажлын байр хайх</label>
            <input id="job-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Жишээ: Backend хөгжүүлэгч, React, QA инженер"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400" />
            <button type="submit" className="btn-accent">Ажил хайх</button>
          </form>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <label className="sr-only" htmlFor="f-prof">Мэргэжил</label>
            <select id="f-prof" className="input h-9 w-auto max-w-[240px] pr-8" value={filters.profession} onChange={(e) => update({ profession: e.target.value })}>
              <option value="">Мэргэжил</option>
              {(professions.data || []).map((p) => <option key={p.profession} value={p.profession}>{p.profession} ({p.n})</option>)}
            </select>
            <label className="sr-only" htmlFor="f-type">Ажлын төрөл</label>
            <select id="f-type" className="input h-9 w-auto pr-8" value={filters.type} onChange={(e) => update({ type: e.target.value, tab: e.target.value ? 'new' : '' })}>
              <option value="">Ажлын төрөл</option>
              {Object.entries(EMPLOYMENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <label className="sr-only" htmlFor="f-loc">Байршил</label>
            <input id="f-loc" className="input h-9 w-40" placeholder="Байршил" defaultValue={filters.location} onKeyDown={(e) => e.key === 'Enter' && update({ location: e.currentTarget.value.trim() })} onBlur={(e) => update({ location: e.target.value.trim() })} />
            <button type="button" className={isSeeker && tab === 'match' ? 'btn-accent h-9' : 'btn-outline h-9'}
              onClick={() => (isSeeker ? update({ tab: 'match', type: '' }) : navigate('/login', { state: { from: '/' } }))}>
              <Icon name="sparkle" />Надад тохирсон
            </button>
            {hasFilters && (
              <button type="button" className="btn-ghost h-9" onClick={() => { setQ(''); setParams({}, { replace: true }); }}>
                <Icon name="x" />Цэвэрлэх
              </button>
            )}
          </div>
          {filters.skill && <p className="mt-3 text-sm text-zinc-600">Ур чадвар: <span className="chip">{filters.skill}</span></p>}
        </section>

        <section className="card px-5 pt-5 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="tab-group overflow-x-auto" role="tablist">
              {visibleTabs.map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'tab-active' : ''}`}
                  onClick={() => update({ tab: t.id, type: t.params.type || '' })}>{t.label}</button>
              ))}
            </div>
            {jobs.data && <span className="text-sm text-zinc-500">{jobs.data.total} ажлын байр</span>}
          </div>
          {jobs.loading ? <Loading /> : jobs.error ? <div className="py-6"><FormError error={jobs.error} /></div> : jobs.data.jobs.length === 0 ? (
            <Empty title="Хайлтад тохирох ажлын байр олдсонгүй" action={hasFilters && <button type="button" className="btn-outline" onClick={() => { setQ(''); setParams({}); }}>Шүүлтүүр арилгах</button>}>
              Түлхүүр үгээ өөрчлөх эсвэл шүүлтүүрээ цөөлж үзнэ үү.
            </Empty>
          ) : (
            <div className="mt-2">{jobs.data.jobs.map((j) => <JobRow key={j.id} job={j} />)}</div>
          )}
          {!user && jobs.data?.jobs.length > 0 && (
            <p className="border-t border-zinc-100 py-4 text-center text-sm text-zinc-500">
              <Link to="/register" className="font-medium text-link hover:underline">Бүртгүүлж</Link> ур чадвартаа тохирох хувийг хараарай.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
