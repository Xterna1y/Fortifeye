import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Mic, 
  Bell,
  Settings,
  LogOut,
  User,
  Activity,
  TrendingUp,
  Eye
} from 'lucide-react';

interface Alert {
  id: number;
  type: 'warning' | 'danger' | 'success';
  message: string;
  time: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');
  const [recentAlerts] = useState<Alert[]>([
    { id: 1, type: 'danger', message: 'High risk transaction detected', time: '2 min ago' },
    { id: 2, type: 'warning', message: 'Unusual login attempt blocked', time: '15 min ago' },
    { id: 3, type: 'success', message: 'Safe transaction verified', time: '1 hour ago' },
  ]);

  const stats = [
    { label: 'Protected', value: '12,847', icon: Shield, color: 'text-cyan-400' },
    { label: 'Blocked', value: '1,239', icon: XCircle, color: 'text-red-400' },
    { label: 'Verified', value: '8,562', icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Alerts', value: '23', icon: Bell, color: 'text-amber-400' },
  ];

  const handleStartAnalysis = () => {
    navigate('/input');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Fortifeye</span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('analyze')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'analyze' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Analyze
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'history' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                History
              </button>
              <button
                onClick={() => navigate('/guardian')}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              >
                Guardian Mode
              </button>
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
          <p className="text-slate-400">Your AI-powered financial guardian is always watching.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-slate-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Action Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Analyze Card */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Scam Detection</h2>
                  <p className="text-slate-400 text-sm">Analyze messages or calls for potential scams</p>
                </div>
              </div>

              {/* Analysis Options */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <button
                  onClick={handleStartAnalysis}
                  className="group p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Text Analysis</h3>
                      <p className="text-slate-400 text-sm">Paste a message to analyze</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleStartAnalysis}
                  className="group p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mic className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Voice Analysis</h3>
                      <p className="text-slate-400 text-sm">Record a voice message</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Recent Activity Preview */}
              <div className="border-t border-slate-700/50 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Recent Alerts</h3>
                  <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        alert.type === 'danger' ? 'bg-red-500/10 border border-red-500/20' :
                        alert.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                        'bg-emerald-500/10 border border-emerald-500/20'
                      }`}
                    >
                      {alert.type === 'danger' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : alert.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-white text-sm">{alert.message}</p>
                        <p className="text-slate-500 text-xs">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Overview */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                Risk Overview
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Protection Level</span>
                    <span className="text-emerald-400 font-medium">High</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">85%</p>
                  <p className="text-slate-400 text-xs">Safe Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Guardian Mode */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Guardian Mode</h3>
                  <p className="text-slate-400 text-xs">Protect your loved ones</p>
                </div>
              </div>
              <button className="w-full py-3 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-400 font-medium rounded-xl transition-all">
                Configure Guardian
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Today's Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Messages Analyzed</span>
                  <span className="text-white font-medium">47</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Calls Screened</span>
                  <span className="text-white font-medium">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Threats Blocked</span>
                  <span className="text-red-400 font-medium">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Safe Transactions</span>
                  <span className="text-emerald-400 font-medium">8</span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-3">💡 Safety Tip</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Banks will never ask for your password or PIN via phone or message. 
                Always verify requests through official channels.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
