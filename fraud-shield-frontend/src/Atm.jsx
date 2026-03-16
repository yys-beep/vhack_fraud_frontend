// src/Atm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { Wallet, CheckCircle } from 'lucide-react';

export default function Atm() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) setBalance(snap.data().balance);
      }
    };
    fetchBalance();
  }, []);

  const handleDeposit = async () => {
    if (amount <= 0) return;
    setLoading(true);

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const newBalance = balance + parseFloat(amount);
      
      // Update Balance
      await updateDoc(userRef, { balance: newBalance });
      
      // Log the deposit in the history so it shows on the Transfer page
      const newTx = {
        time: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
            }),
        senderName: "MOCK ATM DEPOSIT",
        senderAcc: "CASH-IN",
        recipient: "Self",
        recipientAcc: "Main Wallet",
        amount: parseFloat(amount),
        status: "Approved",
        timestamp: new Date().getTime()
      };
      await addDoc(collection(db, "users", auth.currentUser.uid, "transactions"), newTx);

      setBalance(newBalance);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000); // Go back to dashboard after 2 seconds

    } catch (error) {
      console.error(error);
      alert("ATM Error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <button onClick={() => navigate('/')} className="btn-secondary" style={{marginBottom: '20px'}}>← Back</button>
        
        <Wallet color="#10b981" size={48} style={{ margin: '0 auto' }} />
        <h2>Mock ATM Simulator</h2>
        <p style={{color: '#64748b'}}>Current Balance: <strong>${balance.toLocaleString()}</strong></p>

        {success ? (
          <div style={{color: '#10b981', padding: '20px', background: '#ecfdf5', borderRadius: '12px', marginTop: '20px'}}>
            <CheckCircle size={32} style={{margin: '0 auto 10px'}}/>
            <h3>Deposit Successful!</h3>
            <p>Redirecting to dashboard...</p>
          </div>
        ) : (
          <div style={{marginTop: '30px'}}>
            <label className="label" style={{justifyContent: 'center'}}>Select Deposit Amount ($)</label>
            <select className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} style={{marginBottom: '20px', textAlign: 'center'}}>
              <option value={1000}>$1,000</option>
              <option value={5000}>$5,000</option>
              <option value={10000}>$10,000</option>
              <option value={50000}>$50,000</option>
              <option value={150000}>$150,000</option>
            </select>
            <button onClick={handleDeposit} disabled={loading} className="btn-primary" style={{backgroundColor: '#10b981'}}>
              {loading ? "Processing..." : "Insert Cash"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}