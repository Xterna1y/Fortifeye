import { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Fingerprint,
  Link2,
  Loader2,
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
    isLoading,
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
    updateLinkNickname,
  } = useGuardianLinking();
  const [targetSerialInput, setTargetSerialInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [copyFeedbackTone, setCopyFeedbackTone] = useState<'success' | 'error'>('success');
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [requestFeedbackTone, setRequestFeedbackTone] = useState<'success' | 'error'>('success');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleTabs: Array<{ key: GuardianRole; label: string }> = [
    { key: 'guardian', label: 'I am a Guardian' },
    { key: 'dependent', label: 'I am a Dependent' },
  ];

  const handleCopySerial = async () => {
    try {
      await navigator.clipboard.writeText(currentSerial);
      setCopyFeedbackTone('success');
      setCopyFeedback('Serial ID copied.');
    } catch {
      setCopyFeedbackTone('error');
      setCopyFeedback('Could not copy the serial ID from this browser.');
    }
  };

  const handleSendRequest = async () => {
    setIsSubmitting(true);
    setInputError(null);
    setRequestFeedback(null);

    const result = await sendRequest(targetSerialInput);
    setIsSubmitting(false);

    if (!result.ok) {
      setInputError(result.error ?? 'Unable to validate this serial ID.');
      setRequestFeedbackTone('error');
      setRequestFeedback(result.error ?? 'Unable to send request.');
      return;
    }

    setRequestFeedbackTone('success');
    setRequestFeedback(`Link request sent to ${targetSerialInput.trim().toUpperCase()}.`);
    setTargetSerialInput('');
  };

  const handleAcceptRequest = async (
    requestId: string,
    linkedRole: GuardianRole,
    defaultName?: string,
  ) => {
    const nicknameLabel = linkedRole === 'guardian' ? 'guardian' : 'dependent';
    const nickname = window.prompt(
      `Give ${nicknameLabel} a nickname:`,
      defaultName || '',
    );
    if (nickname === null) {
      return;
    }

    await acceptRequest(requestId, nickname.trim() || undefined);
  };

  const handleEditNickname = async (
    requestId: string,
    linkedRole: GuardianRole,
    currentNickname?: string,
  ) => {
    const nicknameLabel = linkedRole === 'guardian' ? 'guardian' : 'dependent';
    const nickname = window.prompt(
      `Update the ${nicknameLabel} nickname:`,
      currentNickname || '',
    );
    if (nickname === null) {
      return;
    }

    const success = await updateLinkNickname(requestId, nickname);
    if (!success) {
      setRequestFeedbackTone('error');
      setRequestFeedback('Unable to update the nickname right now.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Guardian Linking Setup"
        description="Choose your role, share the right serial ID, and manage live guardian linking requests from the database."
      />

      <SegmentedTabs activeTab={currentRole} onChange={setRole} tabs={roleTabs} />

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel
          title="Step 1: Choose Your Role"
          description="Users can decide which side of the relationship they want to be before sending a request."
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
                Monitor another user, receive risk notifications, and review transaction requests.
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
                Connect your account to a guardian who can help review suspicious activity.
              </p>
            </button>
          </div>
        </GlassPanel>

        <GlassPanel
          title="Step 2: Share Your Serial ID"
          description={`Give this ${currentRole} serial to the other user so they can send the correct request.`}
        >
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Your {currentRole} serial</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-2xl font-bold tracking-[0.18em] text-white">{currentSerial}</p>
              <Button onClick={handleCopySerial} variant="secondary">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
          {copyFeedback && (
            <div className="mt-4">
              <AlertBanner tone={copyFeedbackTone === 'success' ? 'success' : 'error'}>
                {copyFeedback}
              </AlertBanner>
            </div>
          )}
        </GlassPanel>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <GlassPanel
          title="Step 3: Send a Link Request"
          description={`Enter the ${targetRole} serial ID and send the request from your current role.`}
        >
          <div className="space-y-4">
            <InputField
              id="guardian-link-target-serial"
              label={targetRole === 'guardian' ? 'Guardian serial ID' : 'Dependent serial ID'}
              value={targetSerialInput}
              onChange={(event) => setTargetSerialInput(event.target.value.toUpperCase())}
              placeholder={targetRole === 'guardian' ? 'FE-ABC123' : 'FE-ABC123'}
              helperText={`This account is acting as ${currentRole}, so you need the other user's ${targetRole} serial here.`}
              error={inputError ?? undefined}
              leading={<Fingerprint className="h-4 w-4" />}
            />
            <Button onClick={handleSendRequest} fullWidth disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MailPlus className="h-5 w-5" />}
              Send Link Request
            </Button>
            {requestFeedback && (
              <AlertBanner tone={requestFeedbackTone === 'success' ? 'success' : 'error'}>
                {requestFeedback}
              </AlertBanner>
            )}
          </div>
        </GlassPanel>

        <GlassPanel
          title="How The Live Flow Works"
          description="This version keeps the hz UX but uses the real guardian-link backend."
        >
          <ul className="space-y-3 text-sm text-slate-300">
            <li>1. Pick the role this account should use before you send a request.</li>
            <li>2. Share the generated serial ID with the other user.</li>
            <li>3. Send the request to the matching serial for the opposite role.</li>
            <li>4. Accept requests with a custom nickname so guardians can label linked users clearly.</li>
            <li>5. Edit the nickname later or remove the link without losing the live backend state.</li>
          </ul>
        </GlassPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <GlassPanel
            title="Incoming Requests"
            description="Requests sent to your current serial appear here."
          >
            <div className="space-y-4">
              {pendingIncomingRequests.length === 0 ? (
                <EmptyState
                  icon={MailPlus}
                  title="No incoming requests"
                  description={`No one has sent a guardian request to ${currentSerial} yet.`}
                />
              ) : (
                pendingIncomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-amber-500/20 bg-slate-900/50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">
                            {request.requesterName ||
                              request.requesterEmail ||
                              request.requesterSerial}
                          </p>
                          <StatusBadge tone="warning">Pending</StatusBadge>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          Requested on {formatTimestamp(request.createdAt)} as a{' '}
                          {request.requesterRole}.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleAcceptRequest(
                              request.id,
                              request.requesterRole,
                              request.requesterName,
                            )
                          }
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

          <GlassPanel
            title="Outgoing Requests"
            description="Requests you have already sent from this serial."
          >
            <div className="space-y-4">
              {pendingOutgoingRequests.length === 0 ? (
                <EmptyState
                  icon={Link2}
                  title="No outgoing requests"
                  description={`You have not sent any guardian requests from ${currentSerial} yet.`}
                />
              ) : (
                pendingOutgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4"
                  >
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

        <GlassPanel
          title="Linked Accounts"
          description="Accepted guardian/dependent relationships for this account."
        >
          <div className="space-y-4">
            {linkedAccounts.length === 0 ? (
              <EmptyState
                icon={Link2}
                title="No linked accounts yet"
                description="Accepted relationships will appear here after either user approves the request."
              />
            ) : (
              linkedAccounts.map((link) => (
                <div
                  key={link.requestId}
                  className="rounded-2xl border border-emerald-500/20 bg-slate-900/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {link.nickname || link.name || link.serial}
                        </p>
                        <StatusBadge tone="success">Linked</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {link.email || link.serial} • linked {formatTimestamp(link.linkedAt)} as a{' '}
                        {link.role}.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() =>
                          handleEditNickname(link.requestId, link.role, link.nickname || link.name)
                        }
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                      >
                        Edit nickname
                      </Button>
                      <Button
                        onClick={() => removeLink(link.requestId)}
                        variant="danger"
                        className="px-3 py-2 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
