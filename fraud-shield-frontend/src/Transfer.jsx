// src/Transfer.jsx
import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Send, User, Info, RefreshCw, History as HistoryIcon, Clock, Hash, Download, AlertTriangle, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, where, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const API_URL = "https://vhack-fraud-backend.onrender.com"; 

export default function Transfer() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  
  const [balance, setBalance] = useState(0);
  const [senderName, setSenderName] = useState(""); 
  const [senderAcc, setSenderAcc] = useState("");
  
  // Form States
  const [recipientAcc, setRecipientAcc] = useState("ACC-9901-EM");
  const [recipientRef, setRecipientRef] = useState("Dinner Split"); // NEW: Recipient Reference
  const [amount, setAmount] = useState(5000);
  const [type, setType] = useState("TRANSFER");
  const [txTime, setTxTime] = useState("15:00"); 
  const [recipientUid, setRecipientUid] = useState("");
  
  // App States
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isAttackMode, setIsAttackMode] = useState(false); 
  const [errorMessage, setErrorMessage] = useState(""); 

  // NEW: Confirmation Modal States
  const [showConfirm, setShowConfirm] = useState(false);
  const [foundRecipientName, setFoundRecipientName] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      if (!auth.currentUser) {
        setPageLoading(false);
        return;
      }
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setBalance(data.balance);
          setSenderName(data.name);
          setSenderAcc(data.accountNo);
        }
        const txRef = collection(db, "users", auth.currentUser.uid, "transactions");
        const q = query(txRef, orderBy("timestamp", "desc"));
        const txSnap = await getDocs(q);
        const loadedHistory = [];
        txSnap.forEach((doc) => loadedHistory.push(doc.data()));
        setHistory(loadedHistory);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setPageLoading(false);
      }
    };
    loadUserData();
  }, []);

  // STEP 1: Verify Account & Show Modal
  const initiateTransfer = async () => {
    setErrorMessage("");
    setAiResult(null);
    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      setErrorMessage("Please enter a valid amount.");
      return; 
    }
    if (transferAmount > balance) {
      setErrorMessage(`Insufficient funds. Your balance is $${balance.toLocaleString()}.`);
      return; 
    }

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("accountNo", "==", recipientAcc));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMessage(`Account "${recipientAcc}" not found.`);
        setLoading(false);
        return;
      }

      const userData = querySnapshot.docs[0].data();
      setFoundRecipientName(userData.name);
      setRecipientUid(querySnapshot.docs[0].id); // NEW: Save their UID for the update
      
      setLoading(false);
      setShowConfirm(true);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setErrorMessage("System error. Try again.");
      setLoading(false);
    }
  };

  // STEP 2: Execute AI Risk Check & Finalize
  const confirmAndExecute = async () => {
    setShowConfirm(false);
    setLoading(true);
    
    const transferAmount = parseFloat(amount);
    const isLiquidation = (balance - transferAmount) === 0;

    const [h, m] = txTime.split(':');
    const dateObj = new Date();
    dateObj.setHours(parseInt(h), parseInt(m));
    const formattedTime = dateObj.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    
    const parsedHour = parseInt(txTime.split(':')[0], 10);

    const payload = {
      step: parsedHour, 
      amount: transferAmount,
      oldbalanceOrg: balance,
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

      const newTx = { 
        time: formattedTime, 
        senderName: senderName,
        senderAcc: senderAcc,
        recipient: foundRecipientName, 
        recipientAcc: recipientAcc,
        amount: transferAmount, 
        status: data.status,
        timestamp: new Date().getTime() 
      };

      await addDoc(collection(db, "users", auth.currentUser.uid, "transactions"), newTx);
      setHistory([newTx, ...history]);

      if (data.status === "Approved") {
        // 2. UPDATE SENDER: Decrease balance
        await updateDoc(doc(db, "users", auth.currentUser.uid), { 
          balance: increment(-transferAmount) 
        });
        setBalance(prev => prev - transferAmount);

        // 3. UPDATE RECIPIENT: Increase balance
        const recipientRef = doc(db, "users", recipientUid);
        await updateDoc(recipientRef, { 
          balance: increment(transferAmount) 
        });

        // 4. Record the transaction for the RECIPIENT (so it shows in their history)
        const recipientTx = {
          time: formattedTime,
          senderName: senderName, // They see who sent it
          senderAcc: senderAcc,
          recipient: "Self",
          recipientAcc: recipientAcc,
          amount: transferAmount,
          status: "Approved",
          timestamp: new Date().getTime()
        };
        await addDoc(collection(db, "users", recipientUid, "transactions"), recipientTx);
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setErrorMessage("AI Backend disconnected!");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF('landscape'); 
    doc.text('FraudShield Security Report', 14, 20);
    const tableColumn = ["Time", "Sender Name", "Sender Acc", "Recipient Name", "Recipient Acc", "Amount", "Status"];
    const tableRows = history.map(tx => [tx.time, tx.senderName, tx.senderAcc, tx.recipient, tx.recipientAcc, `$${tx.amount.toLocaleString()}`, tx.status]);
    autoTable(doc, { startY: 30, head: [tableColumn], body: tableRows });
    doc.save('FraudShield_Report.pdf');
  };

  if (pageLoading) return <div className="page" style={{justifyContent: 'center'}}><h2>Syncing Secure Ledger...</h2></div>;

  return (
    <div className="page">
      {/* CONFIRMATION OVERLAY */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
               <h3 style={{margin:0}}>Confirm Transfer</h3>
               <X onClick={()=>setShowConfirm(false)} style={{cursor:'pointer'}} />
            </div>
            <p style={{fontSize: '14px', color: '#64748b'}}>You are about to send money to:</p>
            <div style={{background: '#f8fafc', padding: '15px', borderRadius: '12px', margin: '15px 0'}}>
               <p style={{margin: '0 0 5px', fontWeight: '700', fontSize: '18px'}}>{foundRecipientName}</p>
               <p style={{margin: 0, color: '#4f46e5', fontWeight: '600'}}>{recipientAcc}</p>
               <p style={{margin: '10px 0 0', fontSize: '13px', color: '#94a3b8'}}>Ref: {recipientRef}</p>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <button onClick={()=>setShowConfirm(false)} className="btn-secondary" style={{flex:1}}>Cancel</button>
              <button onClick={confirmAndExecute} className="btn-primary" style={{flex:1, backgroundColor: '#0f172a'}}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="app-container">
        <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
           <button onClick={() => navigate('/')} className="btn-secondary">← Back to Dashboard</button>
           <span style={{color: '#64748b', fontSize: '14px'}}>User: {userData?.username}</span>
        </div>

        <div className="card">
          <div className="header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <ShieldCheck color="#4f46e5" size={28} />
                <h2 style={{margin:0}}>FraudShield</h2>
             </div>
             <span className="badge-version">v2.1 AI-Confirm</span>
          </div>

          <div className="balance-section">
            <small>WALLET BALANCE</small>
            <h1 style={{margin:0}}>${balance.toLocaleString()}</h1>
            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
              <input className="acc-input" value={senderName} readOnly style={{cursor: 'not-allowed', opacity: 0.9}}/>
              <input className="acc-input" value={senderAcc} readOnly style={{cursor: 'not-allowed', opacity: 0.9}}/>
            </div>
          </div>

          {/* INPUTS */}
          <div className="input-group">
            <label className="label"><Hash size={14} /> Recipient Account Number</label>
            <input className="input-field" value={recipientAcc} onChange={(e)=>setRecipientAcc(e.target.value)} placeholder="ACC-XXXX-XX" />
          </div>

          <div className="input-group">
            <label className="label"><Info size={14} /> Recipient Reference</label>
            <input className="input-field" value={recipientRef} onChange={(e)=>setRecipientRef(e.target.value)} placeholder="e.g. Lunch money" />
          </div>

          <div className="input-row">
            <div style={{flex:1}}>
              <label className="label"><Clock size={14} /> Local Time</label>
              <input type="time" className="input-field" value={txTime} onChange={(e)=>setTxTime(e.target.value)} />
            </div>
            <div style={{flex:1}}>
              <label className="label">Amount ($)</label>
              <input type="number" className="input-field" value={amount} onChange={(e)=>setAmount(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="label">Transaction Type</label>
            <select className="input-field" value={type} onChange={(e)=>setType(e.target.value)}>
              <option value="TRANSFER">Transfer</option>
              <option value="CASH_OUT">Cash Out</option>
            </select>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', padding:'10px', background: isAttackMode ? '#fef2f2' : '#f8fafc', borderRadius:'8px', border: isAttackMode ? '1px solid #fecaca' : '1px solid #e2e8f0'}}>
            <input type="checkbox" id="attackMode" checked={isAttackMode} onChange={(e) => setIsAttackMode(e.target.checked)} />
            <label htmlFor="attackMode" style={{fontSize:'13px', fontWeight:'600', color: isAttackMode ? '#991b1b' : '#64748b'}}>
              Simulate Account Takeover (Attack Mode)
            </label>
          </div>

          {errorMessage && (
            <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '13px', marginBottom: '15px' }}>
              <AlertTriangle size={16} style={{display:'inline', marginRight:'8px'}}/> {errorMessage}
            </div>
          )}

          <button onClick={initiateTransfer} disabled={loading} className="btn-primary" style={{backgroundColor: isAttackMode ? '#dc2626' : '#0f172a', color: '#ffffff'}}>
            {loading ? <RefreshCw className="spin" size={18} /> : <Send size={18} />}
            {loading ? "Verifying..." : "Transfer"}
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
                <span><strong>AI Reason:</strong> {aiResult.status === "Blocked" ? `Suspicious ${aiResult.isLiquidation ? 'ACCOUNT LIQUIDATION' : 'balance integrity'} detected.` : "Behavioral pattern consistent with verified users."}</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <HistoryIcon size={48} color="#cbd5e1" />
              <p>Waiting for real-time audit data...</p>
            </div>
          )}
        </div>
      </div>

      <div className="history-card">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', alignItems:'center'}}>
            <h3 style={{margin:0}}>Security Audit Log</h3>
            {/* THIS LINE CLEARS THE WARNING */}
            <button onClick={downloadPDF} className="btn-secondary">
            <Download size={14}/> Export PDF
            </button>
        </div>
        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr><th>Time</th><th>Sender</th><th>Recipient</th><th>Recipient Acc</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {history.map((tx, i) => (
                <tr key={i}>
                  <td>{tx.time}</td><td>{tx.senderName}</td><td>{tx.recipient}</td>
                  <td style={{fontFamily: 'monospace'}}>{tx.recipientAcc}</td>
                  <td style={{fontWeight: '600'}}>${tx.amount.toLocaleString()}</td>
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