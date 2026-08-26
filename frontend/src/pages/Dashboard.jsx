import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FileText, Plus, ShieldAlert, ShieldCheck, Clock, Search, Filter } from 'lucide-react';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/records');
      setRecords(res.data);
    } catch (err) {
      setError('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><ShieldCheck size={12} /><span>Verified</span></span>;
      case 'tampered':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><ShieldAlert size={12} /><span>Tampered</span></span>;
      default:
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><Clock size={12} /><span>Pending</span></span>;
    }
  };

  // Filter and search logic
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = record.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            record.accountNumber.includes(searchTerm);
      const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [records, searchTerm, filterStatus]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  // Calculate stats
  const totalRecords = records.length;
  const verifiedRecords = records.filter(r => r.status === 'verified').length;
  const tamperedRecords = records.filter(r => r.status === 'tampered').length;
  const pendingRecords = totalRecords - verifiedRecords - tamperedRecords;

  // Chart Data
  const pieData = [
    { name: 'Verified', value: verifiedRecords, color: '#10b981' },
    { name: 'Tampered', value: tamperedRecords, color: '#ef4444' },
    { name: 'Pending', value: pendingRecords, color: '#eab308' },
  ].filter(d => d.value > 0);

  // Group by date for bar chart (mocking dates based on creation time if available, otherwise just arbitrary grouping for demo)
  const barData = [
    { name: 'Total', records: totalRecords },
    { name: 'Verified', records: verifiedRecords },
    { name: 'Tampered', records: tamperedRecords },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Record Registry</h1>
          <p className="text-gray-400 mt-1">Blockchain-anchored bank records</p>
        </div>
        
        {user?.role === 'admin' && (
          <Link to="/records/new" className="btn-primary flex items-center space-x-2">
            <Plus size={18} />
            <span>New Record</span>
          </Link>
        )}
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-panel p-6 flex items-center space-x-4">
          <div className="bg-primary/20 p-4 rounded-xl border border-primary/20">
            <FileText size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Total Anchored</p>
            <p className="text-3xl font-bold text-white">{totalRecords}</p>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center space-x-4 border-emerald-500/10">
          <div className="bg-emerald-500/20 p-4 rounded-xl border border-emerald-500/20">
            <ShieldCheck size={24} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Verified Authentic</p>
            <p className="text-3xl font-bold text-emerald-400">{verifiedRecords}</p>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center space-x-4 border-danger/10">
          <div className="bg-danger/20 p-4 rounded-xl border border-danger/20">
            <ShieldAlert size={24} className="text-danger" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Tamper Attempts Caught</p>
            <p className="text-3xl font-bold text-danger">{tamperedRecords}</p>
          </div>
        </div>
      </div>

      {/* Recharts Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Record Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }} />
                <Bar dataKey="records" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Verified' ? '#10b981' : entry.name === 'Tampered' ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Controls: Search and Filter */}
      <div className="glass-panel p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="input-field pl-10 w-full"
            placeholder="Search by customer name or account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-gray-400" />
          <div className="flex space-x-1 bg-black/20 p-1 rounded-lg border border-white/5">
            {['all', 'verified', 'tampered', 'pending'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  filterStatus === status 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Account #</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Balance</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No records found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                // filteredRecords.map((record) => (
                //   <tr key={record._id} className="hover:bg-white/5 transition-colors group">
                //     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{record.customerName}</td>
                //     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{record.accountNumber}</td>
                //     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${record.balance.toLocaleString()}</td>
                //     <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record.status)}</td>
                //     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                //       <Link to={`/records/${record._id}`} className="text-primary hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                //         View Details →
                //       </Link>
                //     </td>
                //   </tr>
                // ))
                filteredRecords.map((record) => {
                  const routeId = record._id;
                  return (
                    <tr key={routeId} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{record.customerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{record.accountNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${record.balance.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/records/${routeId}`} className="text-primary hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
