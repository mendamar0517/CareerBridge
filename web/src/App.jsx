import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { PRESETS, customTheme, useTheme } from './theme';
import { Icon, Loading } from './ui';
import { initials } from './format';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import ProfilePage from './pages/ProfilePage';
import ApplicationsPage from './pages/ApplicationsPage';
import AssessmentPage from './pages/AssessmentPage';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import JobEditorPage from './pages/employer/JobEditorPage';
import ApplicantsPage from './pages/employer/ApplicantsPage';
import CompanyPage from './pages/employer/CompanyPage';

function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="btn-ghost h-9 w-9 px-0" onClick={() => setOpen((o) => !o)} aria-label="Өнгөний сэдэв солих" aria-expanded={open} title="Өнгө солих">
        <span className="h-4 w-4 rounded-full ring-2 ring-white ring-offset-1 ring-offset-zinc-300" style={{ background: theme.accent }} />
      </button>
      {open && (
        <div className="card absolute right-0 top-11 z-30 w-64 p-4 shadow-lg">
          <p className="mb-3 text-sm font-semibold">Өнгөний сэдэв</p>
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => setTheme(p)} title={p.name} aria-label={p.name} aria-pressed={theme.id === p.id}
                className={`flex h-10 items-center justify-center rounded-lg border-2 ${theme.id === p.id ? 'border-ink' : 'border-transparent hover:border-zinc-300'}`}>
                <span className="h-6 w-6 rounded-full" style={{ background: `linear-gradient(135deg, ${p.accent} 50%, ${p.g1} 50%)` }} />
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">{theme.name}</p>
          <label className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
            <span>Өөрийн өнгө</span>
            <input type="color" value={theme.accent} onChange={(e) => setTheme(customTheme(e.target.value))} className="h-8 w-12 cursor-pointer rounded border border-line bg-white p-0.5" />
          </label>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, logout, isEmployer } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-zinc-100" aria-expanded={open}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">{initials(user.name)}</span>
        <span className="hidden max-w-[140px] truncate text-sm font-medium md:block">{user.name}</span>
        <Icon name="chevronDown" className="text-zinc-500" />
      </button>
      {open && (
        <div className="card absolute right-0 top-11 z-30 w-56 py-1.5 text-sm shadow-lg" onClick={() => setOpen(false)}>
          <p className="truncate px-4 py-2 text-xs text-zinc-500">{user.email}</p>
          {isEmployer ? (
            <>
              <Link className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-50" to="/employer"><Icon name="briefcase" />Миний ажлын байр</Link>
              <Link className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-50" to="/employer/company"><Icon name="building" />Байгууллага</Link>
            </>
          ) : (
            <>
              <Link className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-50" to="/profile"><Icon name="user" />Профайл ба CV</Link>
              <Link className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-50" to="/applications"><Icon name="list" />Миний хүсэлтүүд</Link>
            </>
          )}
          <button type="button" className="flex w-full items-center gap-2 border-t border-line px-4 py-2 text-left text-rose-600 hover:bg-zinc-50"
            onClick={() => { logout(); navigate('/'); }}><Icon name="logout" />Гарах</button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { user, isEmployer } = useAuth();
  const [mobile, setMobile] = useState(false);
  const location = useLocation();
  useEffect(() => { setMobile(false); }, [location.pathname]);

  const links = isEmployer
    ? [{ to: '/employer', icon: 'briefcase', label: 'Миний ажлын байр', end: true }, { to: '/employer/jobs/new', icon: 'plus', label: 'Ажлын байр нийтлэх' }, { to: '/employer/company', icon: 'building', label: 'Байгууллага' }]
    : [{ to: '/', icon: 'briefcase', label: 'Ажлын байр', end: true }, { to: '/applications', icon: 'list', label: 'Миний хүсэлтүүд' }, { to: '/profile', icon: 'user', label: 'Профайл ба CV' }];
  const navCls = ({ isActive }) => `flex h-full items-center gap-2 border-b-2 px-3 text-sm font-medium transition ${isActive ? 'border-ink text-ink' : 'border-transparent text-zinc-600 hover:text-ink'}`;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="mx-auto flex h-[60px] max-w-page items-center justify-between gap-4 px-4">
        <Link to={isEmployer ? '/employer' : '/'} className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-[12px] text-white">CB</span>
          careerbridge
        </Link>
        <nav aria-label="Үндсэн цэс" className="hidden h-full gap-1 md:flex">
          {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={navCls}><Icon name={l.icon} />{l.label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-2">
          <ThemePicker />
          {user ? <UserMenu /> : (
            <>
              <Link to="/login" className="btn-dark h-9">Нэвтрэх</Link>
              <Link to="/register" className="btn-gray hidden h-9 sm:inline-flex">Бүртгүүлэх</Link>
            </>
          )}
          <button type="button" className="btn-ghost h-9 w-9 px-0 md:hidden" onClick={() => setMobile((m) => !m)} aria-label="Цэс"><Icon name="menu" /></button>
        </div>
      </div>
      {mobile && (
        <nav className="border-t border-line px-4 py-2 md:hidden">
          {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${isActive ? 'bg-canvas font-semibold' : ''}`}><Icon name={l.icon} />{l.label}</NavLink>)}
        </nav>
      )}
    </header>
  );
}

/** Нэвтрэлт, үүрэг шаардлагатай хуудас */
function Guard({ role, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'EMPLOYER' ? '/employer' : '/'} replace />;
  return children;
}

function NotFound() {
  return (
    <div className="card mx-auto max-w-lg p-10 text-center">
      <p className="text-5xl font-bold">404</p>
      <p className="mt-2 text-zinc-500">Хуудас олдсонгүй</p>
      <Link to="/" className="btn-dark mt-6">Нүүр хуудас</Link>
    </div>
  );
}

export default function App() {
  const { ready } = useAuth();
  const { pathname } = useLocation();
  // scrollTo нь шинэ браузерт Promise буцаадаг тул утгыг нь effect-ээс буцаахгүй (cleanup биш)
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-page flex-1 px-4 py-7">
        {!ready ? <Loading /> : (
          <Routes>
            <Route path="/" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<Guard role="SEEKER"><ProfilePage /></Guard>} />
            <Route path="/applications" element={<Guard role="SEEKER"><ApplicationsPage /></Guard>} />
            <Route path="/applications/:id/assessment" element={<Guard role="SEEKER"><AssessmentPage /></Guard>} />
            <Route path="/employer" element={<Guard role="EMPLOYER"><EmployerDashboard /></Guard>} />
            <Route path="/employer/company" element={<Guard role="EMPLOYER"><CompanyPage /></Guard>} />
            <Route path="/employer/jobs/new" element={<Guard role="EMPLOYER"><JobEditorPage /></Guard>} />
            <Route path="/employer/jobs/:id" element={<Guard role="EMPLOYER"><JobEditorPage /></Guard>} />
            <Route path="/employer/jobs/:id/applicants" element={<Guard role="EMPLOYER"><ApplicantsPage /></Guard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-page flex-wrap justify-between gap-2 px-4 py-6 text-xs text-zinc-500">
          <span>© 2026 CareerBridge · F.CSA316, ШУТИС-МХТС · Баг 11</span>
          <span>Залуучуудын ажилд орох бэлтгэлийг дэмжих платформ</span>
        </div>
      </footer>
    </div>
  );
}
