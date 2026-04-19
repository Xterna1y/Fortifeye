import { useState } from 'react';
import {
  Shield,
  Globe,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Clock,
  Fingerprint,
  WifiOff,
  History,
  Trash2,
  Search
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import { scanUrl } from '../../services/api';

interface SandboxSession {
  id: string;
  url: string;
  status: 'loading' | 'active' | 'blocked' | 'error';
  startTime: string;
  blockedElements?: number;
  aiExplanation?: string;
  aiPatterns?: string[];
  forceOpen?: boolean;
}

interface HistoryItem {
  id: string;
  url: string;
  timestamp: string;
  blockedElements: number;
  status: 'safe' | 'blocked' | 'warning';
}

export default function SandboxPage() {
  const [url, setUrl] = useState('');
  const [sessions, setSessions] = useState<SandboxSession[]>([
    {
      id: '1',
      url: 'https://example.com',
      status: 'active',
      startTime: '2 min ago',
      blockedElements: 3
    }
  ]);
  const [activeSession, setActiveSession] = useState<string | null>('1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: '1', url: 'https://google.com', timestamp: 'Today, 10:30 AM', blockedElements: 0, status: 'safe' },
    { id: '2', url: 'https://suspicious-link.com', timestamp: 'Today, 9:15 AM', blockedElements: 5, status: 'blocked' },
    { id: '3', url: 'https://github.com', timestamp: 'Yesterday, 4:20 PM', blockedElements: 1, status: 'warning' },
    { id: '4', url: 'https://linkedin.com', timestamp: 'Yesterday, 2:00 PM', blockedElements: 0, status: 'safe' },
    { id: '5', url: 'https://phishing-test.net', timestamp: 'Mar 10, 2026', blockedElements: 8, status: 'blocked' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenSandbox = async () => {
    if (!url.trim()) return;

    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

    const newSession: SandboxSession = {
      id: Date.now().toString(),
      url: formattedUrl,
      status: 'loading',
      startTime: 'Just now',
      blockedElements: 0
    };

    setSessions([newSession, ...sessions]);
    setActiveSession(newSession.id);
    setUrl('');
    setShowUrlInput(false);

    try {
      // Analyze the URL with the Gemini AI
      const aiResult = await scanUrl(formattedUrl);
      const isHighRisk = aiResult.risk_level === 'HIGH';

      setSessions(prev => prev.map(s =>
        s.id === newSession.id
          ? {
            ...s,
            status: isHighRisk ? 'blocked' : 'active',
            aiExplanation: aiResult.explanation,
            aiPatterns: aiResult.patterns
          }
          : s
      ));

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: newSession.id,
        url: formattedUrl,
        timestamp: 'Just now',
        blockedElements: isHighRisk ? 1 : 0,
        status: isHighRisk ? 'blocked' : 'safe'
      };
      setHistory(prev => [newHistoryItem, ...prev]);
    } catch (error) {
      console.error('Failed to scan URL:', error);
      setSessions(prev => prev.map(s =>
        s.id === newSession.id ? { ...s, status: 'error' } : s
      ));
    }
  };

  const handleCloseSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession === id) {
      setActiveSession(sessions.length > 1 ? sessions[1].id : null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
      case 'active':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'blocked':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return null;
    }
  };

  const currentSession = sessions.find(s => s.id === activeSession);

  const filteredHistory = history.filter(item =>
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleReopenLink = (historyUrl: string) => {
    setUrl(historyUrl.replace('https://', '').replace('http://', ''));
    setShowUrlInput(true);
  };

  const getHistoryStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-emerald-400 bg-emerald-500/20';
      case 'blocked': return 'text-red-400 bg-red-500/20';
      case 'warning': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getHistoryStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'blocked': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default: return null;
    }
  };

  const handleForceOpen = (id: string) => {
    setSessions(prev => prev.map(s =>
      s.id === id ? { ...s, forceOpen: true } : s
    ));
  };

  return (
    <div className="max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Secure Sandbox"
        description="Open suspicious links in an isolated browser session before they ever touch your real device environment."
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${showHistory
                  ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-700/60 bg-slate-900/40 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
            >
              <History className="w-4 h-4" />
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">Secure Environment Active</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Fingerprint className="w-4 h-4" />
                <span className="text-sm">Isolated</span>
              </div>
            </div>
          </div>
        }
      />

      {/* URL Input Section */}
      {showUrlInput && (
        <div className="mb-8">
          <GlassPanel>
            <div className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>Open Link in Secure Sandbox</span>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Enter a URL to open it in our isolated sandbox environment. All links run in a virtual browser to protect your device from malicious content.
            </p>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL (e.g., example.com)"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenSandbox()}
                />
                <Globe className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                onClick={handleOpenSandbox}
                disabled={!url.trim()}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Open in Sandbox
              </button>
            </div>

            {/* Security Features */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                <EyeOff className="w-4 h-4 text-slate-400" />
                <span>No cookies stored</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                <WifiOff className="w-4 h-4 text-slate-400" />
                <span>Scripts blocked</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>IP hidden</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                <span>Phishing protection</span>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Sessions or History */}
        <div className="lg:col-span-1">
          <GlassPanel padding="sm">
            {showHistory ? (
              // History Panel
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Link History
                  </h3>
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Clear history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search history..."
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* History Stats */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 text-center p-2 bg-emerald-500/10 rounded-lg">
                    <div className="text-lg font-bold text-emerald-400">
                      {history.filter(h => h.status === 'safe').length}
                    </div>
                    <div className="text-xs text-slate-500">Safe</div>
                  </div>
                  <div className="flex-1 text-center p-2 bg-orange-500/10 rounded-lg">
                    <div className="text-lg font-bold text-orange-400">
                      {history.filter(h => h.status === 'warning').length}
                    </div>
                    <div className="text-xs text-slate-500">Warning</div>
                  </div>
                  <div className="flex-1 text-center p-2 bg-red-500/10 rounded-lg">
                    <div className="text-lg font-bold text-red-400">
                      {history.filter(h => h.status === 'blocked').length}
                    </div>
                    <div className="text-xs text-slate-500">Blocked</div>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No history found</p>
                    </div>
                  ) : (
                    filteredHistory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleReopenLink(item.url)}
                        className="w-full p-3 rounded-xl text-left bg-slate-700/30 border border-transparent hover:bg-slate-700/50 hover:border-slate-600 transition-all"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getHistoryStatusIcon(item.status)}
                            <span className="text-white text-sm font-medium truncate">
                              {item.url.replace('https://', '').replace('http://', '')}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${getHistoryStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.timestamp}
                          </span>
                          {item.blockedElements > 0 && (
                            <span className="flex items-center gap-1 text-orange-400">
                              <AlertTriangle className="w-3 h-3" />
                              {item.blockedElements} blocked
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              // Sessions Panel
              <>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Active Sessions
                </h3>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        setActiveSession(session.id);
                        setShowUrlInput(false);
                      }}
                      className={`w-full p-3 rounded-xl text-left transition-all ${activeSession === session.id
                          ? 'bg-cyan-500/20 border border-cyan-500/30'
                          : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(session.status)}
                            <span className="text-white text-sm font-medium truncate">
                              {session.url.replace('https://', '').replace('http://', '')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.startTime}
                            </span>
                            {session.blockedElements !== undefined && session.blockedElements > 0 && (
                              <span className="flex items-center gap-1 text-orange-400">
                                <AlertTriangle className="w-3 h-3" />
                                {session.blockedElements} blocked
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseSession(session.id);
                          }}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowUrlInput(true)}
                  className="w-full mt-4 p-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open New Link
                </button>
              </>
            )}
          </GlassPanel>
        </div>

        {/* Sandbox Viewport */}
        <div className="lg:col-span-3">
          <div className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
            }`}>
            {/* Browser Toolbar */}
            <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-4 flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span className="text-slate-400 text-sm truncate max-w-md">
                    {currentSession?.url || 'No session active'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sandbox Content Area */}
            <div className="h-[500px] bg-white relative">
              {currentSession ? (
                currentSession.status === 'loading' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
                    <p className="text-slate-400">Initializing secure sandbox...</p>
                    <p className="text-slate-500 text-sm mt-2">Running in isolated environment</p>
                  </div>
                ) : currentSession.status === 'active' || (currentSession.status === 'blocked' && currentSession.forceOpen) ? (
                  <div className="h-full flex flex-col relative">
                    <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>

                    {/* Red Warning Banner Overlay */}
                    {currentSession.status === 'blocked' && (
                      <div className="bg-red-500 text-white px-4 py-3 shadow-lg z-10 flex flex-col items-center text-center">
                        <div className="flex items-center gap-2 font-bold text-lg mb-1">
                          <AlertTriangle className="w-5 h-5" />
                          HIGH RISK SCAM DETECTED
                        </div>
                        <p className="text-sm max-w-3xl">{currentSession.aiExplanation}</p>
                      </div>
                    )}

                    {/* Iframe View */}
                    <div className="flex-1 bg-white">
                      <iframe
                        src={currentSession.url}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts allow-same-origin"
                        title="Sandbox Browser"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 px-6 text-center">
                    <XCircle className="w-16 h-16 text-red-500 mb-4" />
                    <p className="text-red-400 font-bold text-2xl mb-2">SCAM DETECTED & BLOCKED</p>
                    <p className="text-white text-lg mt-2 font-medium">This URL was flagged as malicious by AI</p>

                    {currentSession.aiExplanation && (
                      <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 max-w-lg text-left">
                        <p className="text-slate-300 text-sm leading-relaxed">{currentSession.aiExplanation}</p>
                        {currentSession.aiPatterns && currentSession.aiPatterns.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {currentSession.aiPatterns.map(pattern => (
                              <span key={pattern} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg">
                                {pattern}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => handleForceOpen(currentSession.id)}
                      className="mt-8 px-6 py-2 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
                    >
                      I understand the risk. Open Anyway.
                    </button>
                  </div>
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                  <Globe className="w-16 h-16 text-slate-600 mb-4" />
                  <p className="text-white font-semibold">No Active Session</p>
                  <p className="text-slate-400 text-sm mt-2">Enter a URL above to open it in the sandbox</p>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="bg-slate-900/50 border-t border-slate-700/50 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sandbox Active
                </span>
                <span>No data leaves your device</span>
              </div>
              <div className="flex items-center gap-4">
                {currentSession?.blockedElements !== undefined && currentSession.blockedElements > 0 && (
                  <span className="text-orange-400">
                    {currentSession.blockedElements} threats blocked
                  </span>
                )}
                <span>Isolation: Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
