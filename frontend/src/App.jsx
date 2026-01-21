import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { MemberProvider } from './context/MemberContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <MemberProvider>
        <AppRoutes />
      </MemberProvider>
    </AuthProvider>
  );
}

export default App;