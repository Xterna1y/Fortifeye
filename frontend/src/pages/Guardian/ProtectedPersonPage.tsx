import { useState } from 'react';
import { 
  Shield,
  Eye, 
  EyeOff, 
  DollarSign, 
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  User,
  MessageSquare,
  Clock
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';

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
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'alerts' | 'settings'>('transactions');
  const tabs: Array<{ key: 'transactions' | 'alerts' | 'settings'; label: string }> = [
    { key: 'transactions', label: 'My Transactions' },
    { key: 'alerts', label: 'Alerts' },
    { key: 'settings', label: 'Privacy Settings' },
  ];
  
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Welcome back, Sarah"
          description="Your account is protected by your guardian."
        />

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
        <GlassPanel padding="sm" className="mb-6">
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
        </GlassPanel>

        <SegmentedTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <GlassPanel key={transaction.id} padding="sm">
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
              </GlassPanel>
            ))}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <GlassPanel key={alert.id} padding="sm" className={`${
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
              </GlassPanel>
            ))}
          </div>
        )}

        {/* Privacy Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <GlassPanel title="Your Privacy Controls">
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
            </GlassPanel>

            {/* Request to Guardian */}
            <GlassPanel title="Contact Your Guardian">
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
            </GlassPanel>
          </div>
        )}
      </div>
  );
}
