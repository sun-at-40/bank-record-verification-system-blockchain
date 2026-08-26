import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Loader2, Link as LinkIcon, FileText } from 'lucide-react';
import api from '../services/api';

const NewRecord = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerName: '',
    accountNumber: '',
    balance: '',
    recordDetails: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center mt-20">
        <h2 className="text-2xl font-bold text-danger mb-4">Access Denied</h2>
        <p className="text-gray-400 mb-6">Only administrators can create new records.</p>
        <Link to="/" className="btn-primary">Return to Dashboard</Link>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/records', {
        ...formData,
        balance: Number(formData.balance)
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create and anchor record');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8">
        <ArrowLeft size={16} />
        <span>Back to Registry</span>
      </Link>

      <div className="glass-panel p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-primary/20 p-3 rounded-xl">
            <FileText size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create New Record</h1>
            <p className="text-gray-400 text-sm">Data will be saved to DB and anchored to the blockchain</p>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer Name</label>
              <input 
                type="text" 
                name="customerName"
                className="input-field"
                required
                value={formData.customerName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Number</label>
              <input 
                type="text" 
                name="accountNumber"
                className="input-field font-mono"
                required
                value={formData.accountNumber}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Initial Balance ($)</label>
            <input 
              type="number" 
              name="balance"
              className="input-field font-mono"
              required
              value={formData.balance}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Additional Record Details (JSON string or text)</label>
            <textarea 
              name="recordDetails"
              className="input-field h-24 resize-none"
              placeholder='e.g., {"accountType": "Checking", "branch": "Downtown"}'
              required
              value={formData.recordDetails}
              onChange={handleChange}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary w-full flex justify-center items-center h-12"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="animate-spin" size={18} />
                <span>Anchoring to Blockchain...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <LinkIcon size={18} />
                <span>Save & Anchor Record</span>
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewRecord;
