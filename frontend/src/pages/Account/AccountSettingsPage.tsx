import { useEffect, useState } from 'react';
import { Fingerprint, Mail, RefreshCw, Shield, UserRound } from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import { API_BASE_URL, parseJsonResponse } from '../../config/api';

interface AccountUser {
  id: string;
  email: string;
  name?: string;
  identity?: string;
  serialId?: string;
  createdAt?: string;
}

export default function AccountSettingsPage() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('fortifeye.user');
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  const refreshProfile = async () => {
    if (!user?.id) {
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/${user.id}`);
      const profile = await parseJsonResponse<AccountUser>(response);

      if (!response.ok) {
        throw new Error('Unable to refresh account profile.');
      }

      setUser(profile);
      localStorage.setItem('fortifeye.user', JSON.stringify(profile));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh account profile.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const roleLabel = user?.identity === 'guardian' ? 'Guardian' : user?.identity === 'dependent' ? 'Dependent' : 'Unassigned';

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Account Settings"
        description="Review the live account details stored for this profile and refresh them from the database whenever needed."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel
          title="Profile Overview"
          description="These values come from the logged-in account profile."
          titleAction={
            <button
              type="button"
              onClick={refreshProfile}
              disabled={isRefreshing || !user?.id}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          }
        >
          {!user ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              No signed-in account was found in local storage.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Display name</p>
                <p className="mt-2 text-xl font-semibold text-white">{user.name || 'New User'}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.22em]">Email</span>
                  </div>
                  <p className="mt-3 break-all text-sm text-white">{user.email}</p>
                </div>
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Fingerprint className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.22em]">Serial ID</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold tracking-[0.16em] text-white">{user.serialId || 'Not assigned'}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.22em]">Current role</span>
                  </div>
                  <p className="mt-3 text-sm text-white">{roleLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <UserRound className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.22em]">Created</span>
                  </div>
                  <p className="mt-3 text-sm text-white">
                    {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          )}
        </GlassPanel>

        <GlassPanel title="Security Notes" description="Quick reminders for working with linked accounts and guardian mode.">
          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              Refreshing this page pulls the latest profile document from the backend and updates the local session copy.
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              Your serial ID is the live account identifier used by guardian-link requests.
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              Role changes happen through the guardian linking flow so the guardian/protected pages stay aligned with database state.
            </div>
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
