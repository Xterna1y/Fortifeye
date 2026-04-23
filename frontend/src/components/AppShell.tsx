import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Settings,
  Shield,
  UserCircle2,
  X,
} from 'lucide-react';
import logo from '../assets/fortifeye_logo.png';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/input', label: 'Analyze', icon: Activity },
  { to: '/sandbox', label: 'Sandbox', icon: Globe },
  { to: '/guardian-link', label: 'Linking', icon: Link2 },
  { to: '/guardian', label: 'Guardian', icon: Shield },
  { to: '/protected', label: 'Protected', icon: CreditCard },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('fortifeye.user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem('fortifeye.user');
      setUser(stored ? JSON.parse(stored) : null);
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('fortifeye-user-updated', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('fortifeye-user-updated', syncUser);
    };
  }, []);

  const isGuardian = user?.identity === 'guardian';
  const isDependent = Boolean(user) && !isGuardian;

  const visibleNavItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (item.to === '/guardian') {
          return isGuardian;
        }

        if (item.to === '/protected') {
          return isDependent;
        }

        return true;
      }),
    [isDependent, isGuardian],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <img
            src={logo}
            alt="Fortifeye logo"
            className="h-12 w-12 rounded-2xl object-cover shadow-lg shadow-cyan-500/20"
          />
          <div>
            <p className="text-lg font-semibold text-white">Fortifeye</p>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Scam Shield</p>
          </div>
        </div>

        <nav className="space-y-2">
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-cyan-400/40 bg-cyan-400/15 text-white shadow-lg shadow-cyan-950/30'
                    : 'border-transparent bg-slate-900/30 text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-cyan-400/30 to-emerald-400/30 text-cyan-100'
                        : 'bg-slate-800/70 text-slate-400 group-hover:text-slate-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">{label}</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isActive ? 'translate-x-0 text-cyan-200' : 'text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-300'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent p-5">
        <div className="mb-3 flex items-center gap-2 text-emerald-300">
          <Bell className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.24em]">Live Protection</span>
        </div>
        <p className="text-sm text-slate-200">Analyze messages, screen links, and keep guardian controls one click away.</p>
      </div>

      <div className="relative mt-auto pt-6">
        {accountOpen && (
          <div className="absolute bottom-[5.5rem] left-0 right-0 rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{user?.name || 'Account'}</p>
              <p className="mt-1 text-xs text-slate-400">{user?.email || 'No email available'}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-cyan-200/70">
                {user?.identity === 'guardian' ? 'Guardian' : user?.identity === 'dependent' ? 'Dependent' : 'Unassigned'}
              </p>
            </div>
            <div className="mt-3 space-y-2">
              <NavLink
                to="/account"
                onClick={() => {
                  setAccountOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition-all hover:bg-white/10"
              >
                <Settings className="h-4 w-4" />
                Account Settings
              </NavLink>
              <NavLink
                to="/"
                onClick={() => {
                  setAccountOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100 transition-all hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </NavLink>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAccountOpen((open) => !open)}
          className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-left text-sm font-medium text-slate-300 transition-all hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80">
            <UserCircle2 className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm text-white">{user?.name || 'Account'}</span>
            <span className="block text-xs text-slate-400">Open quick actions</span>
          </span>
          <ChevronRight className={`h-4 w-4 transition-transform ${accountOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)]">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-slate-950/40 px-5 py-6 backdrop-blur-xl lg:block">
          <div className="sticky top-6 h-[calc(100vh-3rem)]">
            <SidebarContent />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="border-b border-white/10 bg-slate-950/30 px-4 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Fortifeye logo"
                  className="h-11 w-11 rounded-2xl object-cover shadow-lg shadow-cyan-500/20"
                />
                <div>
                  <p className="text-base font-semibold text-white">Fortifeye</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Scam Shield</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition-all hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label="Close navigation"
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 w-[18rem] max-w-[85vw] border-r border-white/10 bg-slate-950/95 p-5 shadow-2xl">
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <SidebarContent onNavigate={() => setSidebarOpen(false)} />
              </div>
            </div>
          )}

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
