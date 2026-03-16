// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Auth from './Auth';
import Dashboard from './Dashboard';
import Transfer from './Transfer';
import Atm from './Atm';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="page" style={{justifyContent: 'center'}}><h2>Loading Secure Environment...</h2></div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
        <Route path="/transfer" element={user ? <Transfer /> : <Navigate to="/auth" />} />
        <Route path="/atm" element={user ? <Atm /> : <Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}

export default App;