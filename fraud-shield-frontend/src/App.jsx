import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Send, User, Info, RefreshCw, History, Clock, Hash, Download, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';

const API_URL = "https://vhack-fraud-backend.onrender.com"; 

function App() {
  const [balance, setBalance] = useState(150000);
  const [recipient, setRecipient] = useState("EduMatch-Admin");
  const [senderAcc, setSenderAcc] = useState("ACC-7742-XY");
  const [recipientAcc, setRecipientAcc] = useState("ACC-9901-EM");
  const [amount, setAmount] = useState(5000);
  const [type, setType] = useState("TRANSFER");
  const [hour, setHour] = useState(new Date().getHours());
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [history, setHistory] = useState([]);
  
  // NEW: Toggle for presenting to judges
  const [isAttackMode, setIsAttackMode] = useState(false); 

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('FraudShield Security Report', 14, 20);
    const tableColumn = ["Time", "From", "To", "Amount", "Status"];
    const tableRows = history.map(tx => [tx.time, tx.from, tx.to, `$${tx.amount.toLocaleString()}`, tx.status]);
    
    // THE MAGIC FIX IS ON THIS LINE:
    autoTable(doc, { startY: 30, head: [tableColumn], body: tableRows });
    
    doc.save('FraudShield_Report.pdf');
  };
  
  const handleTransfer = async () => {
    setLoading(true);
    setAiResult(null);

    const transferAmount = parseFloat(amount);
    const isLiquidation = (balance - transferAmount) === 0;

    // MATCHING THE NEW API EXACTLY
    const payload = {
      step: parseInt(hour),
      amount: transferAmount,
      oldbalanceOrg: balance,
      // If Attack Mode is ON, we corrupt the math. If OFF, normal math.
      newbalanceOrig: isAttackMode ? balance : (balance - transferAmount), 
      oldbalanceDest: 0,
      newbalanceDest: transferAmount,
      type_TRANSFER: type === "TRANSFER" ? 1 : 0,
      type_CASH_OUT: type === "CASH_OUT" ? 1 : 0
    };

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setAiResult({ ...data, isLiquidation }); 
      
      setHistory([{ 
        time: `${hour}:00`, 
        from: senderAcc, 
        to: recipient, 
        amount: transferAmount, 
        status: data.status 
      }, ...history]);

      if (data.status === "Approved") setBalance(prev => prev - transferAmount);
    } catch (err) {
      console.error("API Error:", err);
      alert("AI Backend disconnected!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="app-container">
        <div className="card">
          <div className="header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <ShieldCheck color="#4f46e5" size={28} />
                <h2 style={{margin:0}}>FraudShield</h2>
             </div>
             <span className="badge-version">v2.0 AI-Live</span>
          </div>

          <div className="balance-section">
            <small>WALLET BALANCE</small>
            <h1 style={{margin:0}}>${balance.toLocaleString()}</h1>
            <input 
              className="acc-input"
              value={senderAcc} 
              onChange={(e) => setSenderAcc(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label className="label"><User size={14} /> Recipient Name</label>
            <input className="input-field" value={recipient} onChange={(e)=>setRecipient(e.target.value)} />
          </div>

          <div className="input-row">
            <div style={{flex:1}}>
              <label className="label"><Hash size={14} /> Recipient Acc</label>
              <input className="input-field" value={recipientAcc} onChange={(e)=>setRecipientAcc(e.target.value)} />
            </div>
            <div style={{flex:1}}>
              <label className="label"><Clock size={14} /> Time (0-23)</label>
              <input type="number" className="input-field" value={hour} onChange={(e)=>setHour(e.target.value)} />
            </div>
          </div>

          <div className="input-row">
            <div style={{flex:1}}>
              <label className="label">Type</label>
              <select className="input-field" value={type} onChange={(e)=>setType(e.target.value)}>
                <option value="TRANSFER">Transfer</option>
                <option value="CASH_OUT">Cash Out</option>
              </select>
            </div>
            <div style={{flex:1}}>
              <label className="label">Amount ($)</label>
              <input type="number" className="input-field" value={amount} onChange={(e)=>setAmount(e.target.value)} />
            </div>
          </div>

          {/* ATTACK MODE TOGGLE */}
          <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', padding:'10px', background: isAttackMode ? '#fef2f2' : '#f8fafc', borderRadius:'8px', border: isAttackMode ? '1px solid #fecaca' : '1px solid #e2e8f0'}}>
            <input 
              type="checkbox" 
              id="attackMode" 
              checked={isAttackMode} 
              onChange={(e) => setIsAttackMode(e.target.checked)} 
              style={{cursor:'pointer'}}
            />
            <label htmlFor="attackMode" style={{fontSize:'13px', fontWeight:'600', color: isAttackMode ? '#991b1b' : '#64748b', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
              {isAttackMode && <AlertTriangle size={14} />}
              Simulate Account Takeover (Attack Mode)
            </label>
          </div>

          <button onClick={handleTransfer} disabled={loading} className="btn-primary" style={{backgroundColor: isAttackMode ? '#dc2626' : '#0f172a'}}>
            {loading ? <RefreshCw className="spin" size={18} /> : <Send size={18} />}
            {loading ? "AI Auditing..." : "Execute Transaction"}
          </button>
        </div>

        <div className="card result-card">
          {aiResult ? (
            <div className={aiResult.status === "Blocked" ? "res-block" : "res-approve"}>
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                {aiResult.status === "Blocked" ? <ShieldAlert size={42} /> : <ShieldCheck size={42} />}
                <div>
                  <h2 style={{margin:0}}>{aiResult.status}</h2>
                  <p style={{margin:0, color: '#64748b'}}>Risk Level: {(aiResult.risk_score * 100).toFixed(2)}%</p>
                </div>
              </div>
              <div className="ai-reason-box">
                <Info size={16} color="#64748b"/>
                <span>
                    <strong>AI Reason:</strong> {aiResult.status === "Blocked" 
                    ? `Suspicious ${aiResult.isLiquidation ? 'ACCOUNT LIQUIDATION' : 'balance integrity'} detected.` 
                    : "Behavioral pattern consistent with verified users."}
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <History size={48} color="#cbd5e1" />
              <p>Waiting for real-time audit data...</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="history-card">
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', alignItems:'center'}}>
            <h3 style={{margin:0}}>Security Audit Log</h3>
            <button onClick={downloadPDF} className="btn-secondary"><Download size={14}/> Export PDF</button>
          </div>
          <table className="history-table">
            <thead>
              <tr><th>Time</th><th>To Account</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {history.map((tx, i) => (
                <tr key={i}>
                  <td>{tx.time}</td>
                  <td>{tx.to}</td>
                  <td>${tx.amount.toLocaleString()}</td>
                  <td><span className={tx.status === 'Approved' ? 'badge-approved' : 'badge-blocked'}>{tx.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;