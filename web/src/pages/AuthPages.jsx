// US-01 бүртгэл, нэвтрэлт; US-11 байгууллагын бүртгэл
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Field, FormError, Icon, useToast } from '../ui';

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-2">
      <div className="banner hidden flex-col justify-between p-8 md:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-sm font-bold text-white">CB</span>
        <div>
          <p className="text-2xl font-bold leading-tight tracking-tight text-ink">Ур чадвараа ажилтай холбо.</p>
          <ul className="mt-5 space-y-2.5 text-sm font-medium text-ink/80">
            <li className="flex gap-2"><Icon name="check" className="mt-0.5" />Ажлын байр бүрт тохирооны хувь</li>
            <li className="flex gap-2"><Icon name="check" className="mt-0.5" />Профайлаас нэг товшилтоор CV</li>
            <li className="flex gap-2"><Icon name="check" className="mt-0.5" />Хүсэлтийн явцаа шууд хянах</li>
          </ul>
        </div>
      </div>
      <div className="p-7 sm:p-10">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        <div className="mt-7">{children}</div>
        <p className="mt-6 text-center text-sm text-zinc-600">{footer}</p>
      </div>
    </div>
  );
}

const home = (user) => (user.role === 'EMPLOYER' ? '/employer' : '/');

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(form);
      const from = location.state?.from;
      navigate(from && !(user.role === 'EMPLOYER' && !from.startsWith('/employer')) ? from : home(user), { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const demo = (email) => setForm({ email, password: 'Demo1234' });

  return (
    <Shell title="Нэвтрэх" subtitle="CareerBridge-д тавтай морил" footer={<>Бүртгэлгүй юу? <Link to="/register" className="font-medium text-link hover:underline">Бүртгүүлэх</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Имэйл"><input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
        <Field label="Нууц үг"><input className="input" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
        <FormError error={error} />
        <button type="submit" className="btn-dark w-full" disabled={busy}>{busy ? 'Нэвтэрч байна…' : 'Нэвтрэх'}</button>
      </form>
      <div className="mt-6 rounded-lg bg-canvas p-3.5 text-xs text-zinc-600">
        <p className="font-semibold text-ink">Демо бүртгэл (seed өгөгдөл)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="btn-outline btn-sm" onClick={() => demo('seeker@careerbridge.test')}>Ажил горилогч</button>
          <button type="button" className="btn-outline btn-sm" onClick={() => demo('employer@careerbridge.test')}>Ажил олгогч</button>
        </div>
      </div>
    </Shell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [role, setRole] = useState('SEEKER');
  const [form, setForm] = useState({ fullName: '', companyName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError({ message: 'Нууц үг таарахгүй байна' });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const user = await register({ role, email: form.email, password: form.password, ...(role === 'SEEKER' ? { fullName: form.fullName } : { companyName: form.companyName }) });
      toast(role === 'SEEKER' ? 'Бүртгэл амжилттай үүслээ' : 'Байгууллагын бүртгэл амжилттай үүслээ');
      navigate(role === 'SEEKER' ? '/profile?welcome=1' : '/employer/company?welcome=1', { replace: true, state: { user } });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Бүртгүүлэх" subtitle="Хэдхэн секундэд бүртгэл үүсгээрэй" footer={<>Бүртгэлтэй юу? <Link to="/login" className="font-medium text-link hover:underline">Нэвтрэх</Link></>}>
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-canvas p-1" role="tablist" aria-label="Бүртгэлийн төрөл">
        {[['SEEKER', 'user', 'Ажил горилогч'], ['EMPLOYER', 'building', 'Ажил олгогч']].map(([r, icon, label]) => (
          <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => setRole(r)}
            className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition ${role === r ? 'bg-white shadow-sm' : 'text-zinc-600 hover:text-ink'}`}>
            <Icon name={icon} />{label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {role === 'SEEKER'
          ? <Field label="Овог нэр"><input className="input" autoComplete="name" value={form.fullName} onChange={set('fullName')} placeholder="Бат-Эрдэнэ Дорж" /></Field>
          : <Field label="Байгууллагын нэр"><input className="input" autoComplete="organization" value={form.companyName} onChange={set('companyName')} placeholder="Жишээ ХХК" /></Field>}
        <Field label="Имэйл"><input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Нууц үг" hint="Дор хаяж 8 тэмдэгт, үсэг болон тоо агуулсан"><input className="input" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        <Field label="Нууц үг давтах"><input className="input" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} /></Field>
        <FormError error={error} />
        <button type="submit" className="btn-dark w-full" disabled={busy}>{busy ? 'Үүсгэж байна…' : 'Бүртгэл үүсгэх'}</button>
      </form>
    </Shell>
  );
}
