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
  Activity,
  TrendingUp,
  Eye
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';

interface Alert {
  id: number;
  type: 'warning' | 'danger' | 'success';
  message: string;
  time: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
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
    <main className="max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Welcome back!"
          description="Your AI-powered financial guardian is always watching."
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconClassName={stat.color}
              iconWrapperClassName="bg-transparent"
              valueClassName="mb-1"
              className="backdrop-blur-sm"
              trailing={<TrendingUp className="h-4 w-4 text-emerald-400" />}
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Action Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Analyze Card */}
            <GlassPanel padding="lg" className="bg-gradient-to-br from-slate-800/80 to-slate-800/40">
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
            </GlassPanel>

            {/* Risk Overview */}
            <GlassPanel className="backdrop-blur-sm">
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
            </GlassPanel>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Guardian Mode */}
            <GlassPanel className="backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Guardian Mode</h3>
                  <p className="text-slate-400 text-xs">Protect your loved ones</p>
                </div>
              </div>
              <button className="w-full py-3 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-400 font-medium rounded-xl transition-all">
                Configure Guardian
              </button>
            </GlassPanel>

            {/* Quick Stats */}
            <GlassPanel className="backdrop-blur-sm">
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
            </GlassPanel>

            {/* Tips Card */}
            <GlassPanel className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10">
              <h3 className="font-semibold text-white mb-3">💡 Safety Tip</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Banks will never ask for your password or PIN via phone or message. 
                Always verify requests through official channels.
              </p>
            </GlassPanel>
          </div>
        </div>
      </main>
  );
}
