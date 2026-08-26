import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Wallet } from 'lucide-react';

const WalletConnect = () => {
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        setError('');
      } catch (err) {
        console.error("Error connecting wallet:", err);
        setError('Failed to connect wallet');
      }
    } else {
      setError('MetaMask not installed');
    }
  };

  const disconnectWallet = () => {
    setAccount('');
  };

  const formatAddress = (addr) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex items-center space-x-3">
      {error && <span className="text-red-400 text-sm">{error}</span>}
      {account ? (
        <button 
          onClick={disconnectWallet}
          className="flex items-center space-x-2 bg-white/10 hover:bg-danger/20 hover:border-danger/30 hover:text-danger px-4 py-2 rounded-lg border border-white/10 transition-all group"
          title="Disconnect Wallet"
        >
          <Wallet size={18} className="text-primary group-hover:text-danger transition-colors" />
          <span className="text-sm font-medium tracking-wider text-gray-200 group-hover:text-danger transition-colors">
            {formatAddress(account)}
          </span>
        </button>
      ) : (
        <button onClick={connectWallet} className="btn-secondary flex items-center space-x-2 text-sm">
          <Wallet size={18} />
          <span>Connect Wallet</span>
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
