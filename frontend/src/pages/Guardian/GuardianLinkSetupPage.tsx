import { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Fingerprint,
  Link2,
  MailPlus,
  Shield,
  UserRound,
  XCircle,
} from 'lucide-react';
import AlertBanner from '../../components/ui/AlertBanner';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import GlassPanel from '../../components/ui/GlassPanel';
import InputField from '../../components/ui/InputField';
import PageHeader from '../../components/ui/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import StatusBadge from '../../components/ui/StatusBadge';
import useGuardianLinking from '../../hooks/useGuardianLinking';
import type { GuardianRole } from '../../types/guardian';

function formatTimestamp(value?: string) {
  if (!value) {
    return 'Just now';
  }

  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function GuardianLinkSetupPage() {
  const {
    currentRole,
    currentSerial,
    targetRole,
    linkedAccounts,
    pendingIncomingRequests,
    pendingOutgoingRequests,
    setRole,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeLink,
  } = useGuardianLinking();
  const [targetSerialInput, setTargetSerialInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success');
  const [inputError, setInputError] = useState<string | null>(null);

  const roleTabs: Array<{ key: GuardianRole; label: string }> = [
    { key: 'guardian', label: 'I am a Guardian' },
    { key: 'dependent', label: 'I am a Dependent' },
  ];

  const handleCopySerial = async () => {
    try {
      await navigator.clipboard.writeText(currentSerial);
      setInputError(null);
      setFeedbackTone('success');
      setFeedback('Serial ID copied.');
    } catch {
      setFeedbackTone('error');
      setFeedback('Could not copy the serial ID from this browser.');
    }
  };

  const handleSendRequest = () => {
    const result = sendRequest(targetSerialInput);
    if (!result.ok) {
      setInputError(result.error ?? 'Unable to validate this serial ID.');
      setFeedbackTone('error');
      setFeedback(result.error ?? 'Unable to send request.');
      return;
    }

    setInputError(null);
    setFeedbackTone('success');
    setFeedback(`Link request sent to ${targetSerialInput.trim().toUpperCase()}.`);
    setTargetSerialInput('');
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Guardian Linking Setup"
        description="Choose whether this account is acting as a guardian or dependent, share your serial ID, and send a linking request to the other user."
      />

      <SegmentedTabs activeTab={currentRole} onChange={setRole} tabs={roleTabs} />

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel
          title="Step 1: Choose Your Role"
          description="This controls which serial ID you share and what kind of request you can send."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setRole('guardian')}
              className={`rounded-2xl border p-5 text-left transition-all ${
                currentRole === 'guardian'
                  ? 'border-cyan-400/40 bg-cyan-500/10'
                  : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600'
              }`}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15">
                <Shield className="h-6 w-6 text-cyan-300" />
              </div>
              <h2 className="text-lg font-semibold text-white">Guardian</h2>
              <p className="mt-2 text-sm text-slate-400">
                Use this when you want to supervise another user and receive approval requests from them.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole('dependent')}
              className={`rounded-2xl border p-5 text-left transition-all ${
                currentRole === 'dependent'
                  ? 'border-emerald-400/40 bg-emerald-500/10'
                  : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600'
              }`}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                <UserRound className="h-6 w-6 text-emerald-300" />
              </div>
              <h2 className="text-lg font-semibold text-white">Dependent</h2>
              <p className="mt-2 text-sm text-slate-400">
                Use this when you want to link your account to a guardian who can review risky activity.
              </p>
            </button>
          </div>
        </GlassPanel>

        <GlassPanel
          title="Step 2: Share Your Serial ID"
          description={`Give this ${currentRole} serial to the other user so they know where to send the link request.`}
        >
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Your {currentRole} serial</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-2xl font-bold tracking-[0.18em] text-white">{currentSerial}</p>
              <Button
                onClick={handleCopySerial}
                variant="secondary"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            The other user should send a request to this exact serial from their own setup screen.
          </p>
        </GlassPanel>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <GlassPanel
          title="Step 3: Send a Link Request"
          description={`Enter the ${targetRole} serial ID for the other user and send the connection request.`}
        >
          <div className="space-y-4">
            <InputField
              id="guardian-link-target-serial"
              label={targetRole === 'guardian' ? 'Guardian serial ID' : 'Dependent serial ID'}
              value={targetSerialInput}
              onChange={(event) => setTargetSerialInput(event.target.value.toUpperCase())}
              placeholder={targetRole === 'guardian' ? 'GDN-ABC-123' : 'DEP-ABC-123'}
              helperText={`Because this account is set to ${currentRole}, you need a ${targetRole} serial here.`}
              error={inputError ?? undefined}
              leading={<Fingerprint className="h-4 w-4" />}
            />
            <Button
              onClick={handleSendRequest}
              fullWidth
            >
              <MailPlus className="h-5 w-5" />
              Send Link Request
            </Button>
            {feedback && (
              <AlertBanner tone={feedbackTone === 'success' ? 'success' : 'error'}>
                {feedback}
              </AlertBanner>
            )}
          </div>
        </GlassPanel>

        <GlassPanel
          title="How This Placeholder Works"
          description="This is a frontend-only mock of the linking flow until the real backend request system exists."
        >
          <ul className="space-y-3 text-sm text-slate-300">
            <li>1. Pick whether this account is acting as a guardian or dependent.</li>
            <li>2. Share your serial ID with the other user.</li>
            <li>3. Enter their serial ID and send a link request.</li>
            <li>4. The recipient can open this same setup page and accept or decline the request.</li>
            <li>5. Once accepted, the main dashboard hides the configure card because a guardian is linked.</li>
          </ul>
        </GlassPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <GlassPanel title="Incoming Requests" description="Requests sent to your current role/serial appear here.">
          <div className="space-y-4">
            {pendingIncomingRequests.length === 0 ? (
              <EmptyState
                icon={MailPlus}
                title="No incoming requests"
                description={`No one has sent a guardian linking request to ${currentSerial} yet. Once a request arrives, you can accept or decline it here.`}
              />
            ) : (
              pendingIncomingRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-amber-500/20 bg-slate-900/50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{request.requesterSerial}</p>
                        <StatusBadge tone="warning">Pending</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        Requested on {formatTimestamp(request.createdAt)} as a {request.requesterRole}.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => acceptRequest(request.id)}
                        className="px-4 py-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => declineRequest(request.id)}
                        variant="danger"
                        className="px-4 py-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel title="Linked Accounts" description="Accepted guardian/dependent links for your current role.">
            <div className="space-y-4">
              {linkedAccounts.length === 0 ? (
                <EmptyState
                  icon={Link2}
                  title="No linked accounts yet"
                  description="Accepted relationships will appear here after the other user approves your request or you approve theirs."
                />
              ) : (
                linkedAccounts.map((link) => (
                  <div key={link.requestId} className="rounded-2xl border border-emerald-500/20 bg-slate-900/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{link.serial}</p>
                          <StatusBadge tone="success">Linked</StatusBadge>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          Linked {formatTimestamp(link.linkedAt)} as a {link.role}.
                        </p>
                      </div>
                      <Button
                        onClick={() => removeLink(link.requestId)}
                        variant="danger"
                        className="px-3 py-2 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>

          <GlassPanel title="Outgoing Requests" description="Requests you have already sent from this serial.">
            <div className="space-y-4">
              {pendingOutgoingRequests.length === 0 ? (
                <EmptyState
                  icon={Link2}
                  title="No outgoing requests"
                  description={`You have not sent any guardian linking requests from ${currentSerial} yet. Use the form above to start one.`}
                />
              ) : (
                pendingOutgoingRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
                        <Link2 className="h-5 w-5 text-cyan-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{request.targetSerial}</p>
                          <StatusBadge tone="info">Pending</StatusBadge>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          Sent {formatTimestamp(request.createdAt)}. Awaiting response.
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
