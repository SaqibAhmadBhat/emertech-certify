import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import PublicVerifyPage from './pages/PublicVerifyPage';
import InstitutionDashboard from './pages/InstitutionDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import './styles/main.css';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router basename={process.env.PUBLIC_URL || ''}>
      <div className="app-layout">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/verify" element={<PublicVerifyPage />} />
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<RegisterPage onLoginSuccess={handleLoginSuccess} />} />

            <Route
              path="/student"
              element={
                <ProtectedRoute user={user} allowedRoles={['STUDENT', 'SUPER_ADMIN']}>
                  <StudentDashboard user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/institution"
              element={
                <ProtectedRoute user={user} allowedRoles={['INSTITUTION_ADMIN', 'SUPER_ADMIN']}>
                  <InstitutionDashboard user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute user={user} allowedRoles={['SUPER_ADMIN']}>
                  <AdminDashboard user={user} />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
