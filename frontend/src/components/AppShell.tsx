import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/input', label: 'Analyze', icon: Activity },
  { to: '/sandbox', label: 'Sandbox', icon: Globe },
  { to: '/guardian', label: 'Guardian', icon: Shield },
  { to: '/protected', label: 'Protected', icon: CreditCard },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Fortifeye</p>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Scam Shield</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
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

      <div className="mt-auto pt-6">
        <NavLink
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80">
            <LogOut className="h-5 w-5" />
          </span>
          <span>Sign Out</span>
        </NavLink>
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
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/20">
                  <Shield className="h-5 w-5 text-white" />
                </div>
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
