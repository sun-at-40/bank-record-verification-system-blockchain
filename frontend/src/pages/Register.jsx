import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import api from '../services/api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('auditor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { username, password, role });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="glass-panel max-w-md w-full p-8 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-gradient-to-bl from-secondary/10 via-transparent to-transparent -z-10 -rotate-12"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-secondary/20 p-4 rounded-2xl mb-4 shadow-lg shadow-secondary/20">
            <ShieldCheck size={40} className="text-secondary" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-gray-400 mt-2 text-center text-sm">Join the secure record registry</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input 
              type="password" 
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select 
              className="input-field appearance-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="auditor" className="bg-surface text-white">Auditor (Read-Only)</option>
              <option value="admin" className="bg-surface text-white">Admin (Write Access)</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="btn-primary w-full flex justify-center items-center h-12 !bg-secondary hover:!bg-emerald-600 hover:shadow-secondary/50"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Register'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-secondary hover:text-emerald-400 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
