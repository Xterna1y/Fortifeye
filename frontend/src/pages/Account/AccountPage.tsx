import { useEffect, useState } from 'react';
import { BadgeInfo, KeyRound, Mail, Shield, UserCircle2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import {
  getStoredUser,
  getUserRole,
  saveStoredUser,
  subscribeToStoredUser,
} from '../../utils/userSession';

function getDisplayName(user: ReturnType<typeof getStoredUser>) {
  if (!user) {
    return 'Guest User';
  }

  if (typeof user.name === 'string' && user.name.trim()) {
    return user.name.trim();
  }

  if (typeof user.email === 'string' && user.email.includes('@')) {
    return user.email.split('@')[0];
  }

  return 'Fortifeye User';
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'FE';
}

export default function AccountPage() {
  const location = useLocation();
  const [user, setUser] = useState(getStoredUser());
  const [displayName, setDisplayName] = useState(getDisplayName(user));
  const [email, setEmail] = useState(typeof user?.email === 'string' ? user.email : '');
  const [isSaving, setIsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [settingsTone, setSettingsTone] = useState<'success' | 'error'>('success');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [passwordTone, setPasswordTone] = useState<'success' | 'error'>('success');

  useEffect(() => subscribeToStoredUser(() => setUser(getStoredUser())), []);

  useEffect(() => {
    setDisplayName(getDisplayName(user));
    setEmail(typeof user?.email === 'string' ? user.email : '');
  }, [user]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const target = document.getElementById(location.hash.slice(1));
    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

  if (!user?.id) {
    return <Navigate to="/" replace />;
  }

  const displayRole = getUserRole(user) === 'guardian' ? 'Guardian' : 'Dependent';
  const initials = getInitials(displayName);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSettingsFeedback(null);

    try {
      const response = await fetch(`http://localhost:5001/api/auth/profile/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update account settings.');
      }

      saveStoredUser(data);
      setSettingsTone('success');
      setSettingsFeedback('Account settings updated.');
    } catch (error) {
      setSettingsTone('error');
      setSettingsFeedback(
        error instanceof Error ? error.message : 'Unable to update account settings.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordTone('error');
      setPasswordFeedback('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordFeedback(null);

    try {
      const response = await fetch(`http://localhost:5001/api/auth/profile/${user.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update password.');
      }

      saveStoredUser(data);
      setPasswordTone('success');
      setPasswordFeedback('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordTone('error');
      setPasswordFeedback(error instanceof Error ? error.message : 'Unable to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Account"
        description="Manage your profile details, contact information, and password from one place."
      />

      <div className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <GlassPanel padding="lg" className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-cyan-500/20 via-transparent to-emerald-500/20" />
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-lg font-semibold text-white shadow-lg shadow-cyan-500/20">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold text-white">{displayName}</p>
                  <p className="truncate text-sm text-slate-400">
                    {typeof user.email === 'string' ? user.email : 'No email on file'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Role</p>
                  <p className="mt-2 text-base font-medium text-white">{displayRole}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Serial ID</p>
                  <p className="mt-2 text-base font-medium text-white">
                    {typeof user.serialId === 'string' ? user.serialId : 'Unavailable'}
                  </p>
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel title="Quick Links" description="Jump straight to the section you need.">
            <div className="space-y-3 text-sm">
              <a
                href="#profile"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition-all hover:border-cyan-400/20 hover:bg-white/10 hover:text-white"
              >
                <UserCircle2 className="h-4 w-4 text-cyan-300" />
                <span>Profile details</span>
              </a>
              <a
                href="#security"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition-all hover:border-cyan-400/20 hover:bg-white/10 hover:text-white"
              >
                <KeyRound className="h-4 w-4 text-emerald-300" />
                <span>Password and security</span>
              </a>
            </div>
          </GlassPanel>
        </div>

        <div className="space-y-6">
          <GlassPanel
            padding="lg"
            className="scroll-mt-24"
            title="Profile Details"
            description="Update the basic account information shown throughout the app."
            titleAction={
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            }
          >
            <div id="profile" className="grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="name@example.com"
                  />
                </div>

                {settingsFeedback && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      settingsTone === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-red-500/30 bg-red-500/10 text-red-200'
                    }`}
                  >
                    {settingsFeedback}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15">
                    <BadgeInfo className="h-5 w-5 text-cyan-300" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Profile Summary</h3>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-500">Current account name</p>
                    <p className="mt-1 font-medium text-white">{displayName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Contact email</p>
                    <p className="mt-1 break-all font-medium text-white">
                      {typeof user.email === 'string' ? user.email : 'No email on file'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Identity mode</p>
                    <p className="mt-1 font-medium text-white">{displayRole}</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel
            padding="lg"
            className="scroll-mt-24"
            title="Password and Security"
            description="Change your password without cramming the form into a sidebar popover."
          >
            <div id="security" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="Current password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="New password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition-all hover:bg-cyan-500/20 disabled:opacity-60"
                  >
                    {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                  <p className="text-xs text-slate-500">
                    Legacy users can leave current password blank if one was never set before.
                  </p>
                </div>

                {passwordFeedback && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      passwordTone === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-red-500/30 bg-red-500/10 text-red-200'
                    }`}
                  >
                    {passwordFeedback}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15">
                    <Shield className="h-5 w-5 text-emerald-300" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Security Notes</h3>
                </div>
                <div className="space-y-4 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <p>Password changes stay tied to this email-based login.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <p>Once set, future sign-ins use the new password immediately.</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
