// US-14 онлайн шалгалт өгөх (цаг хэмжигч, автомат илгээлт, автомат оноо)
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { QUESTION_TYPE } from '../format';
import { FormError, Icon, Loading, MatchRing, useLoad, useToast } from '../ui';

function Timer({ endsAt, onExpire }) {
  const [left, setLeft] = useState(() => endsAt - Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      const ms = endsAt - Date.now();
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(t);
        onExpire();
      }
    }, 500);
    return () => clearInterval(t);
  }, [endsAt, onExpire]);
  const s = Math.max(0, Math.floor(left / 1000));
  const warn = s < 60;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-semibold ${warn ? 'bg-rose-50 text-rose-600' : 'bg-canvas'}`} aria-live="off">
      <Icon name="clock" />{String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}
    </span>
  );
}

function Result({ score, passScore, late, title }) {
  const passed = passScore == null ? null : score >= passScore;
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <div className="flex justify-center"><MatchRing percent={score} size={110} /></div>
      <h1 className="mt-5 text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-zinc-600">
        {late ? 'Шалгалтын хугацаа дууссаны дараа илгээгдсэн тул хариулт хүлээн авагдсангүй.' : 'Таны хариултыг хүлээн авлаа. Сонголттой асуултуудыг автоматаар үнэлсэн.'}
      </p>
      {passed !== null && <p className={`mt-3 font-semibold ${passed ? 'text-accent' : 'text-rose-600'}`}>{passed ? 'Тэнцсэн' : 'Тэнцээгүй'} (тэнцэх оноо {passScore}%)</p>}
      <p className="mt-1 text-xs text-zinc-500">Оноог сонголттой асуултуудаар тооцсон. Текст хариултыг ажил олгогч өөрөө үзнэ.</p>
      <Link to="/applications" className="btn-dark mt-6">Миний хүсэлтүүд</Link>
    </div>
  );
}

export default function AssessmentPage() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error } = useLoad(() => api(`/me/applications/${id}/assessment`), [id]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const submit = useCallback(async (auto = false) => {
    if (!data) return;
    setBusy(true);
    setSubmitError(null);
    const payload = data.questions.map((q) => {
      const a = answersRef.current[q.id];
      return q.type === 'TEXT' ? { questionId: q.id, text: a || '' } : { questionId: q.id, optionIds: a || [] };
    });
    try {
      const r = await api(`/me/applications/${id}/assessment/submit`, { method: 'POST', body: { answers: payload } });
      setResult(r);
      toast(auto ? 'Хугацаа дууссан тул шалгалт автоматаар илгээгдлээ' : r.message);
    } catch (err) {
      setSubmitError(err);
    } finally {
      setBusy(false);
    }
  }, [data, id, toast]);

  const onExpire = useCallback(() => submit(true), [submit]);

  if (loading) return <Loading />;
  if (error) return <div className="mx-auto max-w-lg"><FormError error={error} /><Link to="/applications" className="btn-outline mt-4">Буцах</Link></div>;
  if (result) return <Result score={result.score} passScore={data.passScore} late={result.late} title={data.title} />;
  if (data.attempt.submittedAt) return <Result score={data.attempt.score} passScore={data.passScore} title={data.title} />;

  // Серверийн цагтай харьцуулж үлдсэн хугацааг тооцно
  const skew = Date.now() - new Date(data.serverTime).getTime();
  const endsAt = data.timeLimitMinutes ? new Date(data.attempt.startedAt).getTime() + data.timeLimitMinutes * 60000 + skew : null;
  const answered = data.questions.filter((q) => {
    const a = answers[q.id];
    return q.type === 'TEXT' ? a?.trim() : a?.length;
  }).length;

  const choose = (q, optionId) => {
    setAnswers((prev) => {
      if (q.type === 'SINGLE_CHOICE') return { ...prev, [q.id]: [optionId] };
      const cur = new Set(prev[q.id] || []);
      if (cur.has(optionId)) cur.delete(optionId);
      else cur.add(optionId);
      return { ...prev, [q.id]: [...cur] };
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card sticky top-[72px] z-10 mb-5 flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
        <div>
          <h1 className="font-semibold">{data.title}</h1>
          <p className="text-xs text-zinc-500">{answered} / {data.questions.length} асуултад хариулсан{data.passScore != null ? ` · тэнцэх оноо ${data.passScore}%` : ''}</p>
        </div>
        {endsAt && <Timer endsAt={endsAt} onExpire={onExpire} />}
      </div>
      <ol className="space-y-4">
        {data.questions.map((q, i) => (
          <li key={q.id} className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium"><span className="mr-2 text-zinc-400">{i + 1}.</span>{q.body}</p>
              <span className="shrink-0 text-xs text-zinc-500">{q.points} оноо</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{QUESTION_TYPE[q.type]}</p>
            {q.type === 'TEXT' ? (
              <textarea className="input mt-3" rows={4} value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} aria-label={`${i + 1}-р асуултын хариулт`} />
            ) : (
              <div className="mt-3 space-y-2" role={q.type === 'SINGLE_CHOICE' ? 'radiogroup' : 'group'}>
                {q.options.map((o) => {
                  const on = (answers[q.id] || []).includes(o.id);
                  return (
                    <label key={o.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${on ? 'border-accent bg-accent-soft' : 'border-line hover:bg-zinc-50'}`}>
                      <input type={q.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'} name={`q-${q.id}`} checked={on} onChange={() => choose(q, o.id)} className="accent-[rgb(var(--accent))]" />
                      {o.body}
                    </label>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-6 flex items-center justify-end gap-3">
        {submitError && <FormError error={submitError} />}
        <button type="button" className="btn-accent h-11 px-6" disabled={busy}
          onClick={() => (answered < data.questions.length && !window.confirm('Бүх асуултад хариулаагүй байна. Илгээх үү?') ? null : submit())}>
          {busy ? 'Илгээж байна…' : 'Шалгалт илгээх'}
        </button>
      </div>
    </div>
  );
}
