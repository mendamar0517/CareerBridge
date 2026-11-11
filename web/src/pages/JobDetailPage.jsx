// US-07 ажлын байрны дэлгэрэнгүй, US-08 тохироо, US-09 хүсэлт гаргах
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { EMPLOYMENT, STATUS, date, salary, timeAgo, initials } from '../format';
import { Badge, FormError, Icon, Loading, MatchRing, SkillChips, useLoad, useToast } from '../ui';

function ApplyBox({ job, onApplied }) {
  const { user, isSeeker } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const cvs = useLoad(() => (isSeeker && !job.application ? api('/me/cvs') : Promise.resolve([])), [isSeeker, job.application]);
  const [cvId, setCvId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!user) {
    return (
      <div className="card p-5">
        <p className="font-semibold">Хүсэлт гаргах</p>
        <p className="mt-1 text-sm text-zinc-500">Хүсэлт гаргахын тулд ажил горилогчоор нэвтэрнэ үү.</p>
        <button type="button" className="btn-accent mt-4 w-full" onClick={() => navigate('/login', { state: { from: `/jobs/${job.id}` } })}>Нэвтэрч хүсэлт гаргах</button>
        <Link to="/register" className="btn-gray mt-2 w-full">Бүртгүүлэх</Link>
      </div>
    );
  }
  if (!isSeeker) {
    return <div className="card p-5 text-sm text-zinc-500">Ажил олгогчийн бүртгэлээр хүсэлт гаргах боломжгүй.</div>;
  }
  if (job.application) {
    const st = STATUS[job.application.status];
    return (
      <div className="card p-5">
        <p className="font-semibold">Таны хүсэлт</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <Badge className={st.tone}>{st.label}</Badge>
          <span className="text-zinc-500">{date(job.application.appliedAt)}</span>
        </div>
        {job.assessment && !['WITHDRAWN', 'REJECTED'].includes(job.application.status) && (
          <Link to={`/applications/${job.application.id}/assessment`} className="btn-accent mt-4 w-full"><Icon name="checkSquare" />Онлайн шалгалт</Link>
        )}
        <Link to="/applications" className="btn-gray mt-2 w-full">Миний хүсэлтүүд</Link>
      </div>
    );
  }
  if (!job.eligibility?.eligible) {
    return (
      <div className="card p-5">
        <p className="font-semibold">Хүсэлт гаргах</p>
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {job.eligibility?.reason === 'NO_GRADUATION'
            ? 'Хүсэлт гаргахын өмнө төгсөлтийн мэдээллээ оруулна уу.'
            : 'CareerBridge нь сүүлийн 2 жилд төгссөн залуучуудад зориулагдсан.'}
        </div>
        <Link to="/profile?tab=education" className="btn-dark mt-4 w-full">Төгсөлтийн мэдээлэл оруулах</Link>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api(`/jobs/${job.id}/apply`, { method: 'POST', body: { cvId: cvId ? Number(cvId) : null } });
      toast(r.message);
      onApplied();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5">
      <p className="font-semibold">Хүсэлт гаргах</p>
      <p className="mt-1 text-sm text-zinc-500">Хүсэлттэй хамт CV-гээ илгээнэ.</p>
      <label className="label mt-4" htmlFor="cv">Хавсаргах CV</label>
      <select id="cv" className="input" value={cvId} onChange={(e) => setCvId(e.target.value)} disabled={cvs.loading}>
        <option value="">Профайлаас шинэ CV үүсгэх</option>
        {(cvs.data || []).map((c) => <option key={c.id} value={c.id}>{c.title} · {date(c.createdAt)}</option>)}
      </select>
      {job.match && job.match.missing.length > 0 && (
        <p className="mt-3 text-xs text-zinc-500">Танд {job.match.missing.length} ур чадвар дутуу байгаа ч хүсэлт гаргах боломжтой.</p>
      )}
      {error && <div className="mt-3"><FormError error={error} /></div>}
      <button type="button" className="btn-accent mt-4 w-full" onClick={submit} disabled={busy}>{busy ? 'Илгээж байна…' : 'Хүсэлт илгээх'}</button>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const { isSeeker } = useAuth();
  const { data: job, loading, error, reload } = useLoad(() => api(`/jobs/${id}`), [id, isSeeker]);

  if (loading) return <Loading />;
  if (error) return <div className="card p-8"><FormError error={error} /><Link to="/" className="btn-outline mt-4">Буцах</Link></div>;

  const meta = [
    ['briefcase', 'Төрөл', EMPLOYMENT[job.employmentType]],
    ['pin', 'Байршил', job.location || '—'],
    ['star', 'Мэргэжил', job.profession],
    ['clock', 'Хүлээн авах', job.deadline ? `${date(job.deadline)} хүртэл` : 'Хугацаагүй'],
  ];

  return (
    <div>
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-ink"><Icon name="arrowLeft" />Ажлын байрнууд</Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <section className="card p-6 sm:p-7">
            <div className="flex gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-line bg-canvas text-xl font-bold">{initials(job.company.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 text-[13px] font-medium">
                  {job.status !== 'PUBLISHED' && <Badge className="bg-zinc-100 text-zinc-600">{job.status === 'DRAFT' ? 'Ноорог' : 'Хаагдсан'}</Badge>}
                  {job.isNew && <span className="text-yellow-600">✦ Шинэ</span>}
                  {job.isUrgent && <span className="text-orange-600">● Яаралтай</span>}
                  <span className="text-zinc-500">{timeAgo(job.publishedAt)}</span>
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">{job.title}</h1>
                <p className="mt-0.5 text-link">{job.company.name}</p>
              </div>
            </div>
            <p className="mt-5 text-2xl font-medium">{salary(job.salaryMin, job.salaryMax)}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-4">
              {meta.map(([icon, label, value]) => (
                <div key={label}>
                  <dt className="flex items-center gap-1.5 text-xs text-zinc-500"><Icon name={icon} size={13} />{label}</dt>
                  <dd className="mt-1 text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-6 sm:p-7">
            <h2 className="text-lg font-semibold">Шаардлагатай ур чадвар</h2>
            {job.match ? (
              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                <MatchRing percent={job.match.percent} size={88} />
                <div className="space-y-2 text-sm">
                  <p><b>{job.match.matched.length}</b> / {job.match.required} заавал шаардлагатай ур чадвар танд байна.</p>
                  {job.match.missing.length > 0 ? (
                    <p className="text-zinc-600">Дутуу: {job.match.missing.join(', ')}. <Link to="/profile?tab=skills" className="font-medium text-link hover:underline">Ур чадвар нэмэх</Link></p>
                  ) : <p className="font-medium text-accent">Бүх шаардлагыг хангаж байна!</p>}
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-zinc-500">Нэвтэрвэл таны ур чадвартай харьцуулсан тохироо харагдана.</p>
            )}
            <div className="mt-4"><SkillChips skills={job.skills} match={job.match} /></div>
          </section>

          <section className="card p-6 sm:p-7">
            <h2 className="text-lg font-semibold">Ажлын байрны тодорхойлолт</h2>
            <div className="mt-3 whitespace-pre-line text-[15px] leading-7 text-zinc-700">{job.description}</div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-[88px] lg:self-start">
          <ApplyBox job={job} onApplied={reload} />
          {job.assessment && (
            <div className="card p-5">
              <p className="flex items-center gap-2 font-semibold"><Icon name="checkSquare" className="text-accent" />Онлайн шалгалттай</p>
              <p className="mt-2 text-sm text-zinc-600">{job.assessment.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{job.assessment.questionCount} асуулт{job.assessment.timeLimitMinutes ? ` · ${job.assessment.timeLimitMinutes} минут` : ''}{job.assessment.passScore != null ? ` · тэнцэх оноо ${job.assessment.passScore}%` : ''}</p>
            </div>
          )}
          <div className="card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Байгууллага</p>
            <p className="mt-2 font-semibold">{job.company.name}</p>
            {job.company.industry && <p className="text-sm text-zinc-500">{job.company.industry}</p>}
            {job.company.description && <p className="mt-3 text-sm leading-relaxed text-zinc-600">{job.company.description}</p>}
            <div className="mt-3 space-y-1.5 text-sm text-zinc-600">
              {job.company.address && <p className="flex items-center gap-2"><Icon name="pin" size={14} />{job.company.address}</p>}
              {job.company.website && <a href={job.company.website} target="_blank" rel="noreferrer noopener" className="block truncate text-link hover:underline">{job.company.website}</a>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
