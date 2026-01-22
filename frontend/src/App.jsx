import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { MemberProvider, useMembers } from './context/MemberContext';
import { NavigationHistoryProvider } from './context/NavigationHistoryContext';
import { CarePlanProvider } from './context/CarePlanContext';
import AppRoutes from './routes/AppRoutes';
import { generateMockMembers } from './utils/mockData';
import './App.css';

function AppContent() {
  const { members, addMembers } = useMembers();

  // Load mock members on app start if not already loaded
  useEffect(() => {
    if (members.length === 0) {
      const mockMembers = generateMockMembers(100);
      addMembers(mockMembers);
    }
  }, [members.length, addMembers]);

  return <AppRoutes />;
}

function App() {
  return (
    <AuthProvider>
      <MemberProvider>
        <NavigationHistoryProvider>
          <CarePlanProvider>
            <AppContent />
          </CarePlanProvider>
        </NavigationHistoryProvider>
      </MemberProvider>
    </AuthProvider>
  );
}

export default App;