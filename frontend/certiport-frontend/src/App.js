import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Styling
import './styles/theme.css';
import './styles/NavbarFooter.css';
import './styles/LandingPage.css';
import './styles/AuthPages.css';
import './styles/PublicVerification.css';
import './styles/Dashboards.css';

// Components & Guard
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import UniversityDashboard from './pages/UniversityDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicVerify from './pages/PublicVerify';
import SystemSettings from './pages/SystemSettings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/verify" element={<PublicVerify />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/settings" element={<SystemSettings />} />

          {/* Protected Role-Based Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/university" 
            element={
              <ProtectedRoute allowedRoles={['university', 'admin']}>
                <UniversityDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/student" 
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
