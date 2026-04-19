import { useState } from 'react';
import { 
  Eye, 
  DollarSign, 
  Lock, 
  Unlock,
  AlertTriangle,
  CheckCircle,
  User,
  Ban
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import StatCard from '../../components/ui/StatCard';

interface ProtectedPerson {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'paused';
  riskLevel: 'low' | 'medium' | 'high';
  lastActivity: string;
}

interface TransactionRequest {
  id: number;
  personId: number;
  personName: string;
  amount: number;
  description: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'blocked';
}

export default function GuardianDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'settings'>('overview');
  const tabs: Array<{ key: 'overview' | 'requests' | 'settings'; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'requests', label: 'Transaction Requests' },
    { key: 'settings', label: 'Settings' },
  ];
  
  // Mock data - in production this would come from a database
  const [protectedPeople] = useState<ProtectedPerson[]>([
    { id: 1, name: 'Sarah Johnson', email: 'sarah@email.com', status: 'active', riskLevel: 'low', lastActivity: '2 min ago' },
    { id: 2, name: 'Michael Chen', email: 'michael@email.com', status: 'active', riskLevel: 'medium', lastActivity: '15 min ago' },
  ]);

  const [transactionRequests] = useState<TransactionRequest[]>([
    { id: 1, personId: 1, personName: 'Sarah Johnson', amount: 250, description: 'Online purchase - Electronics', timestamp: '5 min ago', status: 'pending' },
    { id: 2, personId: 2, personName: 'Michael Chen', amount: 500, description: 'Money transfer to unknown account', timestamp: '12 min ago', status: 'pending' },
    { id: 3, personId: 1, personName: 'Sarah Johnson', amount: 50, description: 'Subscription service', timestamp: '1 hour ago', status: 'approved' },
  ]);

  const handleApproveRequest = (id: number) => {
    console.log('Approved request:', id);
  };

  const handleBlockRequest = (id: number) => {
    console.log('Blocked request:', id);
  };

  const handleToggleProtection = (personId: number) => {
    console.log('Toggled protection for:', personId);
  };

  return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Guardian Dashboard"
          description="Monitor and protect your loved ones from financial scams."
        />

        <SegmentedTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Protected" value={protectedPeople.length} icon={User} iconWrapperClassName="bg-cyan-500/20" iconClassName="text-cyan-400" />
              <StatCard label="Pending" value={transactionRequests.filter(r => r.status === 'pending').length} icon={AlertTriangle} iconWrapperClassName="bg-amber-500/20" iconClassName="text-amber-400" />
              <StatCard label="Approved" value={transactionRequests.filter(r => r.status === 'approved').length} icon={CheckCircle} iconWrapperClassName="bg-emerald-500/20" iconClassName="text-emerald-400" />
              <StatCard label="Blocked" value={3} icon={Ban} iconWrapperClassName="bg-red-500/20" iconClassName="text-red-400" />
            </div>

            {/* Protected People List */}
            <GlassPanel title="People You Protect">
              <div className="space-y-4">
                {protectedPeople.map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{person.name}</p>
                        <p className="text-slate-400 text-sm">{person.email}</p>
                        <p className="text-slate-500 text-xs mt-1">Last active: {person.lastActivity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        person.riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                        person.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {person.riskLevel.charAt(0).toUpperCase() + person.riskLevel.slice(1)} Risk
                      </span>
                      <button
                        onClick={() => handleToggleProtection(person.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          person.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {person.status === 'active' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        )}

        {/* Transaction Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <GlassPanel title="Pending Transaction Requests">
              <div className="space-y-4">
                {transactionRequests.filter(r => r.status === 'pending').map((request) => (
                  <div key={request.id} className="p-4 bg-slate-900/50 rounded-xl border border-amber-500/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-medium">{request.personName}</span>
                          <span className="text-slate-500 text-sm">• {request.timestamp}</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{request.description}</p>
                        <p className="text-2xl font-bold text-white">${request.amount.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleBlockRequest(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                          Block
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {transactionRequests.filter(r => r.status === 'pending').length === 0 && (
                  <p className="text-slate-400 text-center py-8">No pending requests</p>
                )}
              </div>
            </GlassPanel>

            {/* Recent Activity */}
            <GlassPanel title="Recent Activity">
              <div className="space-y-3">
                {transactionRequests.filter(r => r.status !== 'pending').map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {request.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Ban className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="text-white text-sm">{request.description}</p>
                        <p className="text-slate-500 text-xs">{request.personName} • {request.timestamp}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${
                      request.status === 'approved' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      ${request.amount}
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <GlassPanel title="Guardian Settings">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Transaction Alerts</p>
                      <p className="text-slate-400 text-sm">Get notified for transactions above threshold</p>
                    </div>
                  </div>
                  <input type="number" defaultValue={100} className="w-24 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-right" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">View Transaction History</p>
                      <p className="text-slate-400 text-sm">Access full transaction history of protected persons</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-cyan-500 rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Block High-Risk Transactions</p>
                      <p className="text-slate-400 text-sm">Automatically block transactions flagged as high risk</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-cyan-500 rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Emergency Lock</p>
                      <p className="text-slate-400 text-sm">Immediately block all transactions for a protected person</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                    Enable
                  </button>
                </div>
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
  );
}
