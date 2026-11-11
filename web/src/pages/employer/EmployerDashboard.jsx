// Ажил олгогчийн самбар: US-12 ажлын байрнууд, төлөв, хүсэлтийн тоо
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { EMPLOYMENT, JOB_STATUS, date } from '../../format';
import { Badge, Empty, FormError, Icon, Loading, PageHeader, useLoad, useToast } from '../../ui';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const { data: jobs, loading, error, reload } = useLoad(() => api('/employer/jobs'), []);
  const toast = useToast();

  const action = async (job, kind) => {
    const confirmText = { close: 'Ажлын байрыг хаах уу? Хаасны дараа шинэ хүсэлт ирэхгүй.', remove: 'Ноорог ажлын байрыг устгах уу?' }[kind];
    if (confirmText && !window.confirm(confirmText)) return;
    try {
      if (kind === 'remove') await api(`/employer/jobs/${job.id}`, { method: 'DELETE' });
      else await api(`/employer/jobs/${job.id}/${kind}`, { method: 'POST' });
      toast({ publish: 'Ажлын байр нийтлэгдлээ', close: 'Ажлын байр хаагдлаа', remove: 'Устгагдлаа' }[kind]);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) return <Loading />;
  if (error) return <FormError error={error} />;
  const stat = (label, value, icon) => (
    <div className="card flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon name={icon} size={20} /></span>
      <div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-zinc-500">{label}</p></div>
    </div>
  );

  return (
    <div>
      <PageHeader title={user.name} subtitle="Ажлын байр болон хүсэлтүүдээ удирдах" action={<Link to="/employer/jobs/new" className="btn-dark"><Icon name="plus" />Ажлын байр нэмэх</Link>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat('Нийтлэгдсэн', jobs.filter((j) => j.status === 'PUBLISHED').length, 'briefcase')}
        {stat('Ноорог', jobs.filter((j) => j.status === 'DRAFT').length, 'edit')}
        {stat('Нийт хүсэлт', jobs.reduce((s, j) => s + j.applicantCount, 0), 'users')}
        {stat('Шинэ хүсэлт', jobs.reduce((s, j) => s + j.newCount, 0), 'sparkle')}
      </div>
      <section className="card overflow-hidden">
        {jobs.length === 0 ? (
          <Empty icon="briefcase" title="Ажлын байр үүсгээгүй байна" action={<Link to="/employer/jobs/new" className="btn-dark"><Icon name="plus" />Эхний ажлын байраа нэмэх</Link>}>Ажлын байр үүсгээд, шаардлагатай ур чадвараа тодорхойлоод нийтэлнэ.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr><th className="px-5 py-3 font-medium">Ажлын байр</th><th className="px-3 py-3 font-medium">Төлөв</th><th className="px-3 py-3 font-medium">Хүсэлт</th><th className="px-3 py-3 font-medium">Шалгалт</th><th className="px-3 py-3 font-medium">Огноо</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-4">
                      <Link to={`/employer/jobs/${j.id}`} className="font-semibold hover:underline">{j.title}</Link>
                      <p className="text-xs text-zinc-500">{j.profession} · {EMPLOYMENT[j.employmentType]} · {j.skillCount} ур чадвар</p>
                    </td>
                    <td className="px-3 py-4"><Badge className={JOB_STATUS[j.status].tone}>{JOB_STATUS[j.status].label}</Badge></td>
                    <td className="px-3 py-4">
                      <Link to={`/employer/jobs/${j.id}/applicants`} className="font-medium hover:underline">{j.applicantCount}</Link>
                      {j.newCount > 0 && <span className="ml-1.5 rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-white">+{j.newCount}</span>}
                    </td>
                    <td className="px-3 py-4 text-zinc-500">{j.hasAssessment ? <Icon name="checkSquare" className="text-accent" /> : '—'}</td>
                    <td className="px-3 py-4 text-xs text-zinc-500">{j.publishedAt ? date(j.publishedAt) : `Үүсгэсэн ${date(j.createdAt)}`}{j.deadline && <><br />Дуусах {date(j.deadline)}</>}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <Link to={`/employer/jobs/${j.id}/applicants`} className="btn-outline btn-sm"><Icon name="users" />Горилогчид</Link>
                        <Link to={`/employer/jobs/${j.id}`} className="btn-ghost btn-sm" aria-label="Засах"><Icon name="edit" /></Link>
                        {j.status === 'DRAFT' && <button type="button" className="btn-accent btn-sm" onClick={() => action(j, 'publish')}>Нийтлэх</button>}
                        {j.status === 'PUBLISHED' && <button type="button" className="btn-gray btn-sm" onClick={() => action(j, 'close')}>Хаах</button>}
                        {j.status === 'DRAFT' && <button type="button" className="btn-ghost btn-sm" onClick={() => action(j, 'remove')} aria-label="Устгах"><Icon name="trash" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
