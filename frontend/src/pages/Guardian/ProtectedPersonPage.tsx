import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  DollarSign, 
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  LogOut,
  Bell,
  History,
  User,
  MessageSquare,
  Clock
} from 'lucide-react';

interface Transaction {
  id: number;
  amount: number;
  description: string;
  timestamp: string;
  status: 'approved' | 'pending' | 'blocked';
  guardianApproved?: boolean;
}

interface Alert {
  id: number;
  type: 'info' | 'warning' | 'success';
  message: string;
  timestamp: string;
}

export default function ProtectedPersonPage() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'alerts' | 'settings'>('transactions');
  
  // Mock data - in production this would come from a database
  const [transactions] = useState<Transaction[]>([
    { id: 1, amount: 250, description: 'Online purchase - Electronics', timestamp: 'Today, 2:30 PM', status: 'approved', guardianApproved: true },
    { id: 2, amount: 500, description: 'Money transfer request', timestamp: 'Today, 1:15 PM', status: 'pending' },
    { id: 3, amount: 45, description: 'Subscription - Netflix', timestamp: 'Yesterday', status: 'approved', guardianApproved: true },
    { id: 4, amount: 1200, description: 'Wire transfer to unknown account', timestamp: 'Yesterday', status: 'blocked', guardianApproved: false },
    { id: 5, amount: 89, description: 'Grocery store', timestamp: '2 days ago', status: 'approved', guardianApproved: true },
  ]);

  const [alerts] = useState<Alert[]>([
    { id: 1, type: 'warning', message: 'Large transaction flagged for review', timestamp: 'Today, 1:15 PM' },
    { id: 2, type: 'success', message: 'Your guardian approved your purchase', timestamp: 'Today, 2:30 PM' },
    { id: 3, type: 'info', message: 'Guardian is now monitoring your account', timestamp: '3 days ago' },
  ]);

  const balance = 12500.00;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Click to go home */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Fortifeye</span>
              <span className="ml-2 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Protected</span>
            </button>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Welcome back, Sarah</h1>
          <p className="text-slate-400 mt-1">Your account is protected by your guardian</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/80 text-sm">Your Balance</span>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-white/80" />
                <span className="text-white/80 text-xs">Guardian Protected</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              {showBalance ? (
                <span className="text-4xl font-bold text-white">${balance.toLocaleString()}</span>
              ) : (
                <span className="text-4xl font-bold text-white">••••••</span>
              )}
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                {showBalance ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
              </button>
            </div>
            <p className="text-white/60 text-sm">Account ending in •••• 4829</p>
          </div>
        </div>

        {/* Guardian Status Banner */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-white font-medium">Your Guardian: John Smith</p>
                <p className="text-slate-400 text-sm">Monitoring your account for safety</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 text-sm">Active Protection</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'transactions' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            My Transactions
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'alerts' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Privacy Settings
          </button>
        </div>

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      transaction.status === 'approved' ? 'bg-emerald-500/20' :
                      transaction.status === 'pending' ? 'bg-amber-500/20' :
                      'bg-red-500/20'
                    }`}>
                      {transaction.status === 'approved' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      ) : transaction.status === 'pending' ? (
                        <Clock className="w-6 h-6 text-amber-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{transaction.description}</p>
                      <p className="text-slate-400 text-sm">{transaction.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">${transaction.amount}</p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {transaction.status === 'approved' && transaction.guardianApproved && (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-xs">Guardian approved</span>
                        </>
                      )}
                      {transaction.status === 'pending' && (
                        <>
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-400 text-xs">Awaiting approval</span>
                        </>
                      )}
                      {transaction.status === 'blocked' && (
                        <>
                          <XCircle className="w-3 h-3 text-red-400" />
                          <span className="text-red-400 text-xs">Blocked by guardian</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className={`bg-slate-800/50 backdrop-blur-xl border rounded-xl p-4 ${
                alert.type === 'warning' ? 'border-amber-500/20' :
                alert.type === 'success' ? 'border-emerald-500/20' :
                'border-cyan-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    alert.type === 'warning' ? 'bg-amber-500/20' :
                    alert.type === 'success' ? 'bg-emerald-500/20' :
                    'bg-cyan-500/20'
                  }`}>
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    ) : alert.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Bell className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white">{alert.message}</p>
                    <p className="text-slate-400 text-sm mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Privacy Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Your Privacy Controls</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Share Transaction History</p>
                      <p className="text-slate-400 text-sm">Allow guardian to view your transaction history</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-cyan-500 rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Transaction Notifications</p>
                      <p className="text-slate-400 text-sm">Get notified when guardian reviews your transactions</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-cyan-500 rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Large Transaction Approval</p>
                      <p className="text-slate-400 text-sm">Require guardian approval for transactions over $500</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-cyan-500 rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Request to Guardian */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Contact Your Guardian</h2>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-center gap-2 p-4 bg-slate-900/50 hover:bg-slate-700/50 rounded-xl transition-colors">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  <span className="text-white">Send Message to Guardian</span>
                </button>
                <button className="w-full flex items-center justify-center gap-2 p-4 bg-slate-900/50 hover:bg-slate-700/50 rounded-xl transition-colors">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span className="text-white">Request to Increase Spending Limit</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
