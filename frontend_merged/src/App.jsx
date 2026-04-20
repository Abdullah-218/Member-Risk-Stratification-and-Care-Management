import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Single Login Page
import EntryLoginPage from './login/EntryLoginPage/EntryLoginPage';

// Individual Assessment UI
import IndividualAssessmentPage from './individual_assessment_ui/IndividualAssessmentPage/IndividualAssessmentPage';
import AssessmentReportPage from './individual_assessment_ui/AssessmentReportPage';

// Organization UI
import { MemberProvider, useMembers } from './organization_ui/context/MemberContext';
import { NavigationHistoryProvider } from './organization_ui/context/NavigationHistoryContext';
import { CarePlanProvider } from './organization_ui/context/CarePlanContext';
import { PredictionWindowProvider } from './organization_ui/context/PredictionWindowContext';
import AppRoutes from './organization_ui/routes/AppRoutes';
import OrganizationLoginPage from './organization_ui/pages/OrganizationLoginPage/OrganizationLoginPage';

// Mock data for organization UI
import { generateMockMembers } from './organization_ui/services/mockData';

// Styles
import './organization_ui/App.css';

function OrganizationAppWrapper() {
  const { members, addMembers } = useMembers();

  // Load mock members on app start if not already loaded
  React.useEffect(() => {
    if (members.length === 0) {
      const mockMembers = generateMockMembers(100);
      addMembers(mockMembers);
    }
  }, [members, addMembers]);

  return <AppRoutes />;
}

function App() {
  console.log('App component rendering');

  return (
    <div className="App">
      <Routes>
        {/* Root redirects to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Single Login Page */}
        <Route path="/login" element={<EntryLoginPage />} />

        {/* Route to Organization Login */}
        <Route path="/org/login" element={<OrganizationLoginPage />} />

        {/* Route to Organization UI */}
        <Route
          path="/org/*"
          element={
            <PredictionWindowProvider>
              <MemberProvider>
                <NavigationHistoryProvider>
                  <CarePlanProvider>
                    <OrganizationAppWrapper />
                  </CarePlanProvider>
                </NavigationHistoryProvider>
              </MemberProvider>
            </PredictionWindowProvider>
          }
        />

        {/* Route to Individual Assessment UI */}
        <Route path="/assessment" element={<IndividualAssessmentPage />} />
        <Route path="/report" element={<AssessmentReportPage />} />
      </Routes>
    </div>
  );
}

export default App;
