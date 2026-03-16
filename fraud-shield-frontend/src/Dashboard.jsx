// src/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore'; // <-- Changed to real-time listener
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import { ShieldCheck, Send, Wallet, LogOut, User, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    // 1. Wait to confirm exactly who is logged in
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        
        // 2. Attach a real-time listener to their database file
        unsubscribeSnapshot = onSnapshot(
          doc(db, "users", currentUser.uid), 
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            }
            // If it doesn't exist yet, it just waits patiently!
          },
          (error) => {
            console.error("Firebase Permission Error:", error);
            setDbError(true);
          }
        );

      }
    });

    // Cleanup listeners when you leave the page
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Emergency Safety Net: If Firebase Rules block the read
  if (dbError) {
    return (
      <div className="page" style={{justifyContent: 'center'}}>
        <div className="card" style={{textAlign: 'center', maxWidth: '400px'}}>
          <AlertTriangle color="#dc2626" size={48} style={{margin: '0 auto 15px'}} />
          <h2 style={{color: '#dc2626', margin: '0 0 10px'}}>Database Blocked!</h2>
          <p style={{color: '#64748b', fontSize: '14px', marginBottom: '20px'}}>
            Your Firestore database is denying read/write access. Go to the Firebase Console -{'>'} Firestore Database -{'>'} Rules, and make sure it is set to Test Mode.
          </p>
          <button onClick={() => {signOut(auth); navigate('/auth');}} className="btn-secondary" style={{margin: '0 auto'}}>
            Log Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  // Normal Loading Screen
  if (!userData) return <div className="page" style={{justifyContent: 'center'}}><h2>Loading Dashboard...</h2></div>;

  // The Actual Dashboard
  return (
    <div className="page" style={{ alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
        
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <ShieldCheck color="#4f46e5" size={32} />
              <h2 style={{margin:0}}>My Dashboard</h2>
           </div>
           <button onClick={() => signOut(auth)} className="btn-secondary"><LogOut size={16}/> Logout</button>
        </div>

        <div className="balance-section" style={{textAlign: 'center', padding: '40px 20px'}}>
          <small style={{opacity: 0.8, letterSpacing: '1px'}}>AVAILABLE BALANCE</small>
          <h1 style={{fontSize: '48px', margin: '10px 0'}}>${userData.balance.toLocaleString()}</h1>
          <div style={{display: 'inline-flex', gap: '15px', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '20px', marginTop: '10px', fontSize: '14px'}}>
            <span><User size={14} style={{verticalAlign: 'middle', marginRight: '4px'}}/> {userData.name}</span>
            <span>|</span>
            <span style={{fontFamily: 'monospace'}}>{userData.accountNo}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
          <button onClick={() => navigate('/atm')} className="btn-primary" style={{flex: 1, backgroundColor: '#10b981'}}>
            <Wallet size={20} /> Top Up (ATM)
          </button>
          <button onClick={() => navigate('/transfer')} className="btn-primary" style={{flex: 1,backgroundColor: '#0f172a', color: '#ffffff'}}>
            <Send size={20} /> Transfer
          </button>
        </div>
        
      </div>
    </div>
  );
}