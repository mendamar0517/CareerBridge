// US-11 байгууллагын мэдээлэл
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { Field, FormError, Loading, PageHeader, useLoad, useToast } from '../../ui';

export default function CompanyPage() {
  const { refresh } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();
  const company = useLoad(() => api('/employer/company'), []);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (company.data) {
      const c = company.data;
      setForm({ name: c.name, registerNo: c.registerNo || '', industry: c.industry || '', description: c.description || '', address: c.address || '', website: c.website || '' });
    }
  }, [company.data]);

  if (company.loading || !form) return <Loading />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api('/employer/company', { method: 'PUT', body: form });
      toast(r.message);
      refresh();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Байгууллагын мэдээлэл" subtitle="Ажил горилогчид ажлын байрны хуудсан дээр харагдана" />
      {params.get('welcome') && <div className="mb-5 rounded-xl bg-accent-soft p-4 text-sm"><b>Байгууллагын бүртгэл амжилттай үүслээ.</b> Үндсэн мэдээллээ бөглөөд ажлын байраа нийтлээрэй.</div>}
      <form className="card space-y-4 p-6 sm:p-7" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Байгууллагын нэр"><input className="input" value={form.name} onChange={set('name')} /></Field>
          <Field label="Регистрийн дугаар" hint="7 оронтой"><input className="input" inputMode="numeric" value={form.registerNo} onChange={set('registerNo')} /></Field>
          <Field label="Салбар"><input className="input" value={form.industry} onChange={set('industry')} placeholder="Программ хангамж" /></Field>
          <Field label="Вэб хуудас"><input className="input" type="url" value={form.website} onChange={set('website')} placeholder="https://" /></Field>
        </div>
        <Field label="Хаяг"><input className="input" value={form.address} onChange={set('address')} /></Field>
        <Field label="Танилцуулга"><textarea className="input" rows={5} value={form.description} onChange={set('description')} /></Field>
        <FormError error={error} />
        <button type="submit" className="btn-dark" disabled={busy}>Хадгалах</button>
      </form>
    </div>
  );
}
