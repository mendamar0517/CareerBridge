// US-10 хүсэлтийн төлөв ба түүх
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, download } from '../api';
import { EMPLOYMENT, STATUS, date, salary, timeAgo, initials } from '../format';
import { Badge, Empty, FormError, Icon, Loading, PageHeader, useLoad, useToast } from '../ui';

const STEPS = ['SUBMITTED', 'REVIEWING', 'ASSESSMENT', 'INTERVIEW', 'ACCEPTED'];

function Timeline({ app }) {
  const reached = new Set(app.history.map((h) => h.newStatus));
  const final = ['REJECTED', 'WITHDRAWN'].includes(app.status) ? app.status : null;
  return (
    <ol className="mt-4 flex flex-wrap items-center gap-y-2 text-xs" aria-label="Хүсэлтийн явц">
      {STEPS.map((s, i) => {
        const done = reached.has(s);
        const current = app.status === s;
        return (
          <li key={s} className="flex items-center">
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${current ? 'bg-ink text-white' : done ? 'bg-accent-soft text-accent' : 'bg-zinc-100 text-zinc-400'}`}>
              {done && !current && <Icon name="check" size={12} />}{STATUS[s].label}
            </span>
            {i < STEPS.length - 1 && <span className={`mx-1 h-px w-4 ${done ? 'bg-accent' : 'bg-zinc-200'}`} />}
          </li>
        );
      })}
      {final && <li className="ml-2"><Badge className={STATUS[final].tone}>{STATUS[final].label}</Badge></li>}
    </ol>
  );
}

export default function ApplicationsPage() {
  const { data, loading, error, reload } = useLoad(() => api('/me/applications'), []);
  const [filter, setFilter] = useState('active');
  const [open, setOpen] = useState(null);
  const toast = useToast();

  const withdraw = async (id) => {
    if (!window.confirm('Хүсэлтээ буцаах уу? Энэ үйлдлийг буцаах боломжгүй.')) return;
    try {
      await api(`/me/applications/${id}/withdraw`, { method: 'POST' });
      toast('Хүсэлт буцаагдлаа');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) return <Loading />;
  if (error) return <FormError error={error} />;
  const active = data.filter((a) => !['REJECTED', 'WITHDRAWN', 'ACCEPTED'].includes(a.status));
  const list = filter === 'active' ? active : data;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Миний хүсэлтүүд" subtitle={`${data.length} хүсэлт · ${active.length} идэвхтэй`}
        action={<div className="tab-group"><button type="button" className={`tab ${filter === 'active' ? 'tab-active' : ''}`} onClick={() => setFilter('active')}>Идэвхтэй</button><button type="button" className={`tab ${filter === 'all' ? 'tab-active' : ''}`} onClick={() => setFilter('all')}>Бүгд</button></div>} />
      {list.length === 0 ? (
        <div className="card"><Empty icon="list" title={filter === 'active' ? 'Идэвхтэй хүсэлт алга' : 'Хүсэлт гаргаагүй байна'} action={<Link to="/" className="btn-dark">Ажлын байр хайх</Link>}>Тохирох ажлын байраа олоод хүсэлт гаргаарай.</Empty></div>
      ) : (
        <ul className="space-y-4">
          {list.map((a) => {
            const st = STATUS[a.status];
            const canWithdraw = !['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(a.status);
            const canTest = a.assessment && !a.assessment.submittedAt && !['REJECTED', 'WITHDRAWN'].includes(a.status);
            return (
              <li key={a.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-canvas font-bold">{initials(a.company.name)}</span>
                    <div className="min-w-0">
                      <Link to={`/jobs/${a.job.id}`} className="text-[17px] font-semibold hover:underline">{a.job.title}</Link>
                      <p className="text-sm text-link">{a.company.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{EMPLOYMENT[a.job.employmentType]} · {salary(a.job.salaryMin, a.job.salaryMax)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={st.tone}>{st.label}</Badge>
                    <p className="mt-1.5 text-xs text-zinc-500">Илгээсэн: {date(a.appliedAt)}</p>
                    <p className="text-xs text-zinc-400">Шинэчилсэн: {timeAgo(a.updatedAt)}</p>
                  </div>
                </div>
                <Timeline app={a} />
                {a.assessment && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-canvas px-4 py-3 text-sm">
                    <span className="flex items-center gap-2"><Icon name="checkSquare" className="text-accent" />{a.assessment.title}</span>
                    {a.assessment.submittedAt
                      ? <span className="font-semibold">Оноо: {a.assessment.score}%{a.assessment.passScore != null && (a.assessment.score >= a.assessment.passScore ? ' · тэнцсэн' : ' · тэнцээгүй')}</span>
                      : canTest ? <Link to={`/applications/${a.id}/assessment`} className="btn-accent btn-sm">Шалгалт өгөх</Link> : <span className="text-zinc-500">Хаагдсан</span>}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
                  <button type="button" className="btn-outline btn-sm" onClick={() => download(`/cvs/${a.cvId}/pdf`, `CareerBridge-CV-${a.cvId}.pdf`)}><Icon name="file" />Илгээсэн CV</button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(open === a.id ? null : a.id)}><Icon name="clock" />Түүх</button>
                  {canWithdraw && <button type="button" className="btn-ghost btn-sm ml-auto text-rose-600" onClick={() => withdraw(a.id)}>Хүсэлт буцаах</button>}
                </div>
                {open === a.id && (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {a.history.map((h, i) => (
                      <li key={i} className="flex justify-between gap-4 text-zinc-600">
                        <span>{h.oldStatus ? `${STATUS[h.oldStatus].label} → ` : ''}<b className="text-ink">{STATUS[h.newStatus].label}</b></span>
                        <span className="text-xs text-zinc-400">{date(h.changedAt)} {new Date(h.changedAt).toTimeString().slice(0, 5)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
