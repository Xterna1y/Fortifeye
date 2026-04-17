import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  DollarSign, 
  Lock, 
  Unlock,
  AlertTriangle,
  CheckCircle,
  User,
  Settings,
  LogOut,
  Bell,
  History,
  Ban
} from 'lucide-react';

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'settings'>('overview');
  
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
              <span className="ml-2 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">Guardian Mode</span>
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
          <h1 className="text-2xl font-bold text-white">Guardian Dashboard</h1>
          <p className="text-slate-400 mt-1">Monitor and protect your loved ones from financial scams</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'requests' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Transaction Requests
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Protected</p>
                    <p className="text-2xl font-bold text-white">{protectedPeople.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-white">{transactionRequests.filter(r => r.status === 'pending').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Approved</p>
                    <p className="text-2xl font-bold text-white">{transactionRequests.filter(r => r.status === 'approved').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <Ban className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Blocked</p>
                    <p className="text-2xl font-bold text-white">3</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Protected People List */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">People You Protect</h2>
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
            </div>
          </div>
        )}

        {/* Transaction Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Pending Transaction Requests</h2>
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
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
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
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Guardian Settings</h2>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
