// src/Auth.jsx
import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ShieldCheck, UserPlus, LogIn, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login State
  const [loginId, setLoginId] = useState(''); // Can be Username OR Email
  
  // Registration States
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [icNumber, setIcNumber] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateAccountNo = () => {
    const nums = Math.floor(1000 + Math.random() * 9000);
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `ACC-${nums}-${letters}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        let targetEmail = loginId.trim().toLowerCase();

        if (!targetEmail.includes('@')) {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("username", "==", targetEmail));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            setError("Username not found. Please check your spelling or register a new account.");
            setLoading(false);
            return;
          }
          targetEmail = querySnapshot.docs[0].data().email;
        }

        await signInWithEmailAndPassword(auth, targetEmail, password);
        navigate('/'); 

      } else {
        // --- REGISTRATION LOGIC ---
        if (password !== confirmPassword) {
          setError("Passwords do not match. Please try again.");
          setLoading(false);
          return;
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(password)) {
          setError("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
          setLoading(false);
          return;
        }

        const formattedUsername = username.toLowerCase().trim();
        const formattedEmail = email.toLowerCase().trim();
        const cleanIC = icNumber.trim().toUpperCase(); // Normalize IC to Uppercase

        // 1. UNIQUE CHECKS (Username & IC)
        const usersRef = collection(db, "users");
        
        // Check Username
        const userQuery = query(usersRef, where("username", "==", formattedUsername));
        const icQuery = query(usersRef, where("icNumber", "==", cleanIC));

        const [userSnap, icSnap] = await Promise.all([
          getDocs(userQuery),
          getDocs(icQuery)
        ]);

        if (!userSnap.empty) {
          setError("That username is already taken! Please choose another.");
          setLoading(false);
          return; 
        }

        if (!icSnap.empty) {
          setError("An account is already registered with this IC/Passport number.");
          setLoading(false);
          return;
        }

        // 2. Create the account
        const userCredential = await createUserWithEmailAndPassword(auth, formattedEmail, password);
        const user = userCredential.user;
        
        // 3. Save everything to the database
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: formattedEmail,
          username: formattedUsername, 
          name: name,
          phone: phone,
          icNumber: cleanIC,
          accountNo: generateAccountNo(),
          balance: 0 
        });
        
        navigate('/'); 
      }
    } catch (err) {
      let cleanError = err.message.replace("Firebase: ", "");
      if (err.code === 'auth/invalid-credential') cleanError = "Incorrect password or account details.";
      if (err.code === 'auth/email-already-in-use') cleanError = "An account with this email address already exists!";
      setError(cleanError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <ShieldCheck color="#4f46e5" size={48} style={{ margin: '0 auto' }} />
          <h2 style={{ margin: '10px 0 0' }}>FraudShield Bank</h2>
          <p style={{ color: '#64748b', margin: '5px 0 0', fontSize: '14px' }}>
            {isLogin ? 'Sign in to your secure wallet' : 'Open a new verified account'}
          </p>
        </div>

        {error && (
          <div style={{ color: '#dc2626', background: '#fef2f2', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', fontWeight: '500', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} style={{flexShrink: 0, marginTop: '2px'}} /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* LOGIN MODE FIELDS */}
          {isLogin && (
            <div>
              <label className="label">Username or Email</label>
              <input 
                type="text" 
                className="input-field" 
                value={loginId} 
                onChange={(e) => setLoginId(e.target.value)} 
                required 
                placeholder="john_doe99 or john@example.com"
              />
            </div>
          )}

          {/* REGISTRATION MODE FIELDS */}
          {!isLogin && (
            <>
              <div>
                <label className="label">Full Legal Name</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div style={{display: 'flex', gap: '15px'}}>
                <div style={{flex: 1}}>
                  <label className="label">IC / Passport No.</label>
                  <input type="text" className="input-field" value={icNumber} onChange={(e) => setIcNumber(e.target.value)} required />
                </div>
                <div style={{flex: 1}}>
                  <label className="label">Phone Number</label>
                  <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </div>
              
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john@example.com"/>
              </div>

              <div>
                <label className="label">Choose a Username</label>
                <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. john_doe99" />
              </div>
            </>
          )}
          
          {/* SHARED PASSWORD FIELD */}
          <div>
            <label className="label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {/* CONFIRM PASSWORD FIELD (Registration Only) */}
          {!isLogin && (
            <div>
              <label className="label">Confirm Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '10px', backgroundColor: '#4f46e5', color: '#ffffff' }}>
            {isLogin ? <><LogIn size={18} /> {loading ? "Authenticating..." : "Secure Login"}</> : <><UserPlus size={18} /> {loading ? "Verifying..." : "Open Account"}</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <span style={{ color: '#64748b' }}>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
          <span 
            style={{ color: '#4f46e5', fontWeight: '600', cursor: 'pointer' }} 
            onClick={() => {
              setIsLogin(!isLogin); 
              setError(''); 
              setConfirmPassword(''); 
              setPassword('');
              setLoginId('');
            }}
          >
            {isLogin ? 'Register Here' : 'Login Here'}
          </span>
        </div>
      </div>
    </div>
  );
}