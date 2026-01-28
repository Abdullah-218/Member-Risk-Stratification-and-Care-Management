import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

import Layout from "../components/layout/Layout/Layout";

// pages
import DashboardPage from "../pages/DashboardPage/DashboardPage";
import UploadPage from "../pages/UploadPage/UploadPage";
import DepartmentsPage from "../pages/DepartmentsPage/DepartmentsPage";
import DepartmentMembersPage from "../pages/DepartmentMembersPage/DepartmentMembersPage";
import HighRiskMembersPage from "../pages/HighRiskMembersPage/HighRiskMembersPage";
import RiskMembersPage from "../pages/RiskMembersPage/RiskMembersPage";
import MemberDetailPage from "../pages/MemberDetailPage/MemberDetailPage";
import ROIPage from "../pages/ROIPage/ROIPage";
import ReportsPage from "../pages/ReportsPage/ReportsPage";
import AllMembersPage from "../pages/AllMembersPage/AllMembersPage";


const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/org/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const [activePage, setActivePage] = React.useState('dashboard');

  const handleNavigate = (page) => {
    setActivePage(page);
  };

  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

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
        path="/departments"
        element={
          <ProtectedRoute>
            <Layout activePage="departments" onNavigate={handleNavigate}>
              <DepartmentsPage />
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
        path="/risk-members"
        element={
          <ProtectedRoute>
            <Layout activePage="risk-members" onNavigate={handleNavigate}>
              <RiskMembersPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/department-members"
        element={
          <ProtectedRoute>
            <Layout activePage="departments" onNavigate={handleNavigate}>
              <DepartmentMembersPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/department-members/:departmentName"
        element={
          <ProtectedRoute>
            <Layout activePage="departments" onNavigate={handleNavigate}>
              <DepartmentMembersPage />
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
        path="/org/member/:id"
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
