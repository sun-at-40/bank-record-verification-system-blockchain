import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import WalletConnect from './WalletConnect';
import { ShieldCheck, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="border-b border-white/10 bg-surface/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-primary/20 p-2 rounded-xl group-hover:bg-primary/30 transition-colors">
                <ShieldCheck size={28} className="text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                BankTrust
              </span>
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center space-x-6">
              <WalletConnect />
              <div className="h-8 w-px bg-white/10"></div>
              <div className="flex items-center space-x-4">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-white">{user.username}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
                <button 
                  onClick={logout}
                  className="text-gray-400 hover:text-danger transition-colors p-2"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
