import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Database, Link as LinkIcon, ShieldCheck, ShieldAlert, Loader2, AlertTriangle, Download, Clock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const RecordDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  
  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    fetchRecordAndHistory();
  }, [id]);

  const fetchRecordAndHistory = async () => {
    try {
      const recordRes = await api.get(`/records/${id}`);
      setRecord(recordRes.data);
    } catch (err) {
      console.error(err);
      setRecord(null);
      setLoading(false);
      return;
    }

    try {
      const historyRes = await api.get(`/records/${id}/history`);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Failed to fetch blockchain history', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.get(`/records/${id}/verify`);
      setVerifyResult(res.data);
      // Refresh record to update status badge if it changed
      fetchRecordAndHistory();
    } catch (err) {
      console.error('Verification failed', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleTamper = async () => {
    if (!window.confirm("Are you sure? This will maliciously alter the database record to demonstrate catching tampering.")) return;
    
    setTampering(true);
    try {
      await api.put(`/records/${id}/tamper`);
      setVerifyResult(null); // Clear previous result
      fetchRecordAndHistory(); // Refresh to show tampered data
      alert("Database record has been maliciously altered!");
    } catch (err) {
      console.error('Tampering failed', err);
    } finally {
      setTampering(false);
    }
  };

  const handleExportCertificate = async () => {
    if (!certificateRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#000000',
        windowWidth: certificateRef.current.scrollWidth,
        windowHeight: certificateRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions to fit A4 width
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`cryptographic_certificate_${record.accountNumber}.pdf`);
    } catch (err) {
      console.error('Failed to export certificate', err);
      alert('Failed to generate PDF certificate.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!record) return <div className="text-center mt-20 text-gray-400">Record not found</div>;

  const isTampered = record.status === 'tampered' || verifyResult?.isAuthentic === false;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Link to="/" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span>Back to Registry</span>
        </Link>
        <button 
          onClick={handleExportCertificate}
          disabled={exporting || isTampered}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isTampered ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'}`}
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span>{exporting ? 'Generating PDF...' : 'Export Certificate'}</span>
        </button>
      </div>

      <div 
        ref={certificateRef}
        className={`glass-panel p-8 relative overflow-hidden transition-colors duration-500 mb-8 ${isTampered ? 'border-danger/30' : ''}`}
      >
        
        {isTampered && (
          <div className="absolute top-0 left-0 w-full h-1 bg-danger shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
        )}
        
        {/* Certificate Header for PDF export */}
        <div className="hidden pdf-only text-center mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl font-bold text-white uppercase tracking-widest">Certificate of Authenticity</h1>
          <p className="text-gray-400 mt-2">Cryptographically Secured Bank Record</p>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{record.customerName}</h1>
              {record.status === 'verified' && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs flex items-center space-x-1"><ShieldCheck size={14}/><span>Verified</span></span>}
              {record.status === 'tampered' && <span className="bg-danger/10 text-danger border border-danger/20 px-3 py-1 rounded-full text-xs flex items-center space-x-1"><ShieldAlert size={14}/><span>Tampered</span></span>}
            </div>
            <p className="text-gray-400 font-mono">Account: {record.accountNumber}</p>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-bold ${isTampered ? 'text-danger' : 'text-white'}`}>
              ${record.balance.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400 mt-1">Current Balance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Off-Chain Data */}
          <div className="bg-black/20 p-6 rounded-xl border border-white/5 relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <Database className="text-primary" size={20} />
                <h3 className="font-semibold text-gray-200">Off-Chain Database</h3>
              </div>
              {user?.role === 'admin' && (
                <button 
                  onClick={handleTamper}
                  disabled={tampering}
                  className="bg-danger/10 text-danger hover:bg-danger/20 px-3 py-1.5 rounded text-xs font-medium transition-colors border border-danger/20 flex items-center space-x-1"
                >
                  <AlertTriangle size={14} />
                  <span>Simulate Hack</span>
                </button>
              )}
            </div>
            <pre className={`text-xs overflow-x-auto p-4 bg-black/40 rounded-lg transition-colors duration-300 ${isTampered ? 'text-danger' : 'text-gray-400'}`}>
              {JSON.stringify(JSON.parse(record.recordData), null, 2)}
            </pre>
            {verifyResult && (
              <div className="mt-4 p-3 bg-black/40 rounded text-xs font-mono break-all">
                <span className="text-gray-500 block mb-1">Computed Hash from DB:</span>
                <span className={verifyResult.isAuthentic ? 'text-emerald-400' : 'text-danger'}>
                  {verifyResult.currentHash}
                </span>
              </div>
            )}
          </div>

          {/* On-Chain Data */}
          <div className="bg-black/20 p-6 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <LinkIcon className="text-secondary" size={20} />
                <h3 className="font-semibold text-gray-200">On-Chain Anchors</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Anchored Hash (Immutable proof)</p>
                  <p className="text-sm text-gray-300 font-mono break-all bg-black/40 p-3 rounded">{record.onChainHash}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                  <p className="text-sm text-primary font-mono break-all bg-primary/5 p-3 rounded border border-primary/10">{record.transactionHash}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10 hide-in-pdf">
              <button 
                onClick={handleVerify}
                disabled={verifying}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg flex justify-center items-center"
              >
                {verifying ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="animate-spin text-primary" size={20} />
                    <span>Verifying with Smart Contract...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <ShieldCheck size={20} className="text-primary" />
                    <span>Verify Integrity</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Verification Result Banner */}
        {verifyResult && (
          <div className={`p-4 rounded-xl border flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-4 ${
            verifyResult.isAuthentic 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-danger/10 border-danger/30'
          }`}>
            {verifyResult.isAuthentic ? (
              <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={32} />
            ) : (
              <XCircle className="text-danger flex-shrink-0" size={32} />
            )}
            <div>
              <h4 className={`text-lg font-bold ${verifyResult.isAuthentic ? 'text-emerald-400' : 'text-danger'}`}>
                {verifyResult.isAuthentic ? 'Cryptographic Proof Verified' : 'Integrity Compromised!'}
              </h4>
              <p className="text-sm text-gray-300 mt-1">
                {verifyResult.isAuthentic 
                  ? 'The off-chain data perfectly matches the on-chain hash. The record has not been altered since it was anchored.' 
                  : 'The computed hash of the current database record does NOT match the immutable hash on the blockchain. This data has been tampered with!'}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Blockchain Audit Trail */}
      <div className="glass-panel p-8 mb-8 hide-in-pdf">
        <div className="flex items-center space-x-3 mb-6">
          <Clock className="text-secondary" size={24} />
          <h2 className="text-xl font-bold text-white">Blockchain Audit Trail</h2>
        </div>
        
        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No blockchain history found for this record.</p>
        ) : (
          <div className="relative border-l border-white/10 ml-4 space-y-8">
            {history.map((entry, idx) => (
              <div key={idx} className="relative pl-8">
                <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-secondary shadow-[0_0_10px_rgba(236,72,153,0.8)]"></div>
                
                <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                  {new Date(entry.timestamp * 1000).toLocaleString()}
                </p>
                
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">Anchored By (Address)</p>
                    <p className="text-sm text-gray-300 font-mono break-all">{entry.submittedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Record Hash</p>
                    <p className="text-sm text-gray-300 font-mono break-all">{entry.recordHash}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default RecordDetail;
