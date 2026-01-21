import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout/Layout';
import LoginPage from '../pages/LoginPage/LoginPage';
import DashboardPage from '../pages/DashboardPage/DashboardPage';
import UploadPage from '../pages/UploadPage/UploadPage';
import HighRiskMembersPage from '../pages/HighRiskMembersPage/HighRiskMembersPage';
import MemberDetailPage from '../pages/MemberDetailPage/MemberDetailPage';
import ROIPage from '../pages/ROIPage/ROIPage';
import ReportsPage from '../pages/ReportsPage/ReportsPage';
import AllMembersPage from '../pages/AllMembersPage/AllMembersPage';
import IndividualAssessmentPage from '../pages/IndividualAssessmentPage/IndividualAssessmentPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = React.useState('dashboard');

  const handleNavigate = (page) => {
    setActivePage(page);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        } 
      />
      
      <Route
        path="/individual-assessment"
        element={<IndividualAssessmentPage />}
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout activePage="dashboard" onNavigate={handleNavigate}>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <Layout activePage="upload" onNavigate={handleNavigate}>
              <UploadPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/high-risk-members"
        element={
          <ProtectedRoute>
            <Layout activePage="high-risk" onNavigate={handleNavigate}>
              <HighRiskMembersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/member/:id"
        element={
          <ProtectedRoute>
            <Layout activePage="high-risk" onNavigate={handleNavigate}>
              <MemberDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/roi"
        element={
          <ProtectedRoute>
            <Layout activePage="roi" onNavigate={handleNavigate}>
              <ROIPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout activePage="reports" onNavigate={handleNavigate}>
              <ReportsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <Layout activePage="members" onNavigate={handleNavigate}>
              <AllMembersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
