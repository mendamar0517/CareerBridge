// US-15 хүсэлт гаргагчдын мэдээлэл, CV, шалгалтын дүн, харьцуулалт; US-10 төлөв солих
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, download, openPdf } from '../../api';
import { DEGREE, STATUS, date, month } from '../../format';
import { Badge, Empty, FormError, Icon, Loading, MatchRing, Modal, useLoad, useToast } from '../../ui';

const NEXT = ['REVIEWING', 'ASSESSMENT', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];
const FINAL = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'];
const SORTS = { match: 'Тохироогоор', score: 'Шалгалтын оноогоор', date: 'Огноогоор' };

function StatusSelect({ app, onChanged }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (FINAL.includes(app.status)) return <Badge className={STATUS[app.status].tone}>{STATUS[app.status].label}</Badge>;
  const change = async (status) => {
    setBusy(true);
    try {
      await api(`/employer/applications/${app.id}/status`, { method: 'PATCH', body: { status } });
      toast(`Төлөв: ${STATUS[status].label}`);
      onChanged();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <label className="block">
      <span className="sr-only">Хүсэлтийн төлөв</span>
      <select className="input h-8 w-40 text-[13px]" value={app.status} disabled={busy} onChange={(e) => change(e.target.value)}>
        <option value={app.status} disabled>{STATUS[app.status].label}</option>
        {NEXT.filter((s) => s !== app.status).map((s) => <option key={s} value={s}>→ {STATUS[s].label}</option>)}
      </select>
    </label>
  );
}

function ScoreText({ a, assessment }) {
  if (!assessment) return <span className="text-zinc-400">Шалгалтгүй</span>;
  if (a.score === null) return <span className="text-zinc-400">{a.assessmentSubmittedAt ? '—' : 'Өгөөгүй'}</span>;
  return <span className={`font-semibold ${a.passed === false ? 'text-rose-600' : a.passed ? 'text-accent' : ''}`}>{a.score}%{a.passed !== null && (a.passed ? ' ✓' : ' ✗')}</span>;
}

function ApplicantDetail({ a, assessment, onClose }) {
  return (
    <Modal title={a.fullName} onClose={onClose} wide>
      <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1 text-sm">
          <p className="text-zinc-600">{a.profession || 'Мэргэжил оруулаагүй'}</p>
          <p>{a.email}{a.phone && ` · ${a.phone}`}</p>
          <p className="text-zinc-500">Хүсэлт илгээсэн: {date(a.appliedAt)}</p>
          {a.summary && <p className="pt-2 leading-relaxed text-zinc-700">{a.summary}</p>}
        </div>
        <div className="flex items-center gap-4">
          <MatchRing percent={a.match.percent} />
          <div className="text-sm"><p className="text-zinc-500">Шалгалт</p><ScoreText a={a} assessment={assessment} /></div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Боловсрол</h3>
          {a.educations.length === 0 ? <p className="text-sm text-zinc-500">—</p> : a.educations.map((e) => (
            <div key={e.id} className="mb-2 text-sm"><p className="font-semibold">{e.school}</p><p className="text-zinc-600">{DEGREE[e.degree]} · {e.major} · {month(e.graduationDate)}</p></div>
          ))}
          <p className={`mt-1 text-xs font-medium ${a.eligible ? 'text-accent' : 'text-amber-600'}`}>{a.eligible ? '✓ Сүүлийн 2 жилд төгссөн' : '2 жилийн шалгуур хангахгүй'}</p>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Ажлын туршлага</h3>
          {a.experiences.length === 0 ? <p className="text-sm text-zinc-500">—</p> : a.experiences.map((x) => (
            <div key={x.id} className="mb-2 text-sm"><p className="font-semibold">{x.position} — {x.companyName}</p><p className="text-zinc-600">{month(x.startDate)} – {x.endDate ? month(x.endDate) : 'одоо'}</p></div>
          ))}
        </div>
      </div>
      <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-zinc-500">Ур чадвар</h3>
      <div className="flex flex-wrap gap-1.5">
        {a.match.matched.map((s) => <span key={s} className="chip">✓ {s}</span>)}
        {a.match.missing.map((s) => <span key={s} className="chip-missing">{s} — дутуу</span>)}
        {a.skills.filter((s) => !a.match.matched.some((m) => m.toLowerCase() === s.name.toLowerCase())).map((s) => <span key={s.id} className="chip bg-zinc-50 text-zinc-500">{s.name}</span>)}
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
        <button type="button" className="btn-outline" onClick={() => openPdf(`/cvs/${a.cvId}/pdf`)}><Icon name="eye" />CV харах</button>
        <button type="button" className="btn-dark" onClick={() => download(`/cvs/${a.cvId}/pdf`, `CV-${a.fullName}.pdf`)}><Icon name="download" />CV татах</button>
      </div>
    </Modal>
  );
}

function Compare({ list, assessment, jobSkills, onClose }) {
  const rows = [
    ['Тохироо', (a) => <span className="text-lg font-semibold">{Math.round(a.match.percent)}%</span>],
    ['Шалгалт', (a) => <ScoreText a={a} assessment={assessment} />],
    ['Төлөв', (a) => <Badge className={STATUS[a.status].tone}>{STATUS[a.status].label}</Badge>],
    ['2 жилийн шалгуур', (a) => (a.eligible ? <span className="text-accent">✓ Хангасан</span> : <span className="text-amber-600">Хангаагүй</span>)],
    ['Боловсрол', (a) => (a.educations[0] ? <>{a.educations[0].school}<br /><span className="text-xs text-zinc-500">{DEGREE[a.educations[0].degree]} · {month(a.educations[0].graduationDate)}</span></> : '—')],
    ['Туршлага', (a) => (a.experiences.length ? `${a.experiences.length} газар` : '—')],
    ...jobSkills.map((s) => [s, (a) => (a.match.matched.includes(s) ? <span className="font-semibold text-accent">✓</span> : <span className="text-zinc-300">—</span>)]),
  ];
  return (
    <Modal title={`Харьцуулалт (${list.length})`} onClose={onClose} wide>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className="w-40" />{list.map((a) => <th key={a.id} className="px-3 pb-3 text-left font-semibold">{a.fullName}</th>)}</tr></thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map(([label, cell]) => (
              <tr key={label}><td className="py-2.5 pr-3 text-zinc-500">{label}</td>{list.map((a) => <td key={a.id} className="px-3 py-2.5">{cell(a)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default function ApplicantsPage() {
  const { id } = useParams();
  const job = useLoad(() => api(`/employer/jobs/${id}`), [id]);
  const { data, loading, error, reload } = useLoad(() => api(`/employer/jobs/${id}/applicants`), [id]);
  const [sort, setSort] = useState('match');
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [comparing, setComparing] = useState(false);

  const list = useMemo(() => {
    if (!data) return [];
    const xs = [...data.applicants];
    if (sort === 'match') xs.sort((a, b) => b.match.percent - a.match.percent);
    if (sort === 'score') xs.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    if (sort === 'date') xs.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    return xs;
  }, [data, sort]);

  if (loading || job.loading) return <Loading />;
  if (error || job.error) return <FormError error={error || job.error} />;
  const toggle = (appId) => setSelected((s) => (s.includes(appId) ? s.filter((x) => x !== appId) : s.length < 4 ? [...s, appId] : s));
  const jobSkills = job.data.skills.filter((s) => s.isRequired).map((s) => s.name);

  return (
    <div>
      <Link to="/employer" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-ink"><Icon name="arrowLeft" />Миний ажлын байр</Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{job.data.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{data.applicants.length} хүсэлт гаргагч{data.assessment ? ` · Шалгалт: ${data.assessment.title} (тэнцэх ${data.assessment.passScore ?? '—'}%)` : ' · Онлайн шалгалтгүй'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="sort">Эрэмбэ</label>
          <select id="sort" className="input h-9 w-48" value={sort} onChange={(e) => setSort(e.target.value)}>{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <button type="button" className="btn-dark h-9" disabled={selected.length < 2} onClick={() => setComparing(true)}><Icon name="compare" />Харьцуулах ({selected.length})</button>
        </div>
      </div>
      {list.length === 0 ? (
        <div className="card"><Empty icon="users" title="Хүсэлт ирээгүй байна">{job.data.status === 'PUBLISHED' ? 'Ажлын байр нийтлэгдсэн. Хүсэлт ирэхэд энд харагдана.' : 'Ажлын байраа нийтэлснээр горилогчид хүсэлт гаргах боломжтой болно.'}</Empty></div>
      ) : (
        <>
          <p className="mb-3 text-xs text-zinc-500">Харьцуулахын тулд 2–4 горилогч сонгоно уу.</p>
          <ul className="space-y-3">
            {list.map((a) => (
              <li key={a.id} className={`card flex flex-wrap items-center gap-4 p-4 sm:px-5 ${selected.includes(a.id) ? 'ring-2 ring-accent' : ''}`}>
                <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} className="h-4 w-4 accent-[rgb(var(--accent))]" aria-label={`${a.fullName} харьцуулахад сонгох`} />
                <MatchRing percent={a.match.percent} size={52} />
                <div className="min-w-[180px] flex-1">
                  <button type="button" className="text-left font-semibold hover:underline" onClick={() => setDetail(a)}>{a.fullName}</button>
                  <p className="text-xs text-zinc-500">{a.educations[0] ? `${a.educations[0].school} · ${month(a.educations[0].graduationDate)}` : 'Боловсрол оруулаагүй'} · Илгээсэн {date(a.appliedAt)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {a.match.matched.slice(0, 5).map((s) => <span key={s} className="chip py-0.5">✓ {s}</span>)}
                    {a.match.missing.slice(0, 3).map((s) => <span key={s} className="chip-missing py-0">{s}</span>)}
                  </div>
                </div>
                <div className="w-28 text-sm"><p className="text-xs text-zinc-500">Шалгалт</p><ScoreText a={a} assessment={data.assessment} /></div>
                {!a.eligible && <Badge className="bg-amber-50 text-amber-700">2 жил+</Badge>}
                <StatusSelect app={a} onChanged={reload} />
                <div className="flex gap-1">
                  <button type="button" className="btn-outline btn-sm" onClick={() => setDetail(a)}>Дэлгэрэнгүй</button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => download(`/cvs/${a.cvId}/pdf`, `CV-${a.fullName}.pdf`)} aria-label="CV татах"><Icon name="download" /></button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {detail && <ApplicantDetail a={detail} assessment={data.assessment} onClose={() => setDetail(null)} />}
      {comparing && <Compare list={list.filter((a) => selected.includes(a.id))} assessment={data.assessment} jobSkills={jobSkills} onClose={() => setComparing(false)} />}
    </div>
  );
}
