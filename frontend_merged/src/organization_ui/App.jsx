import React, { useEffect } from "react";

// 🔹 CONTEXT PROVIDERS
import { AuthProvider } from "./organizational_login/context/AuthContext";
import { MemberProvider, useMembers } from "./organizational_login/context/MemberContext";
import { NavigationHistoryProvider } from "./organizational_login/context/NavigationHistoryContext";
import { CarePlanProvider } from "./organizational_login/context/CarePlanContext";
import { PredictionWindowProvider } from "./organizational_login/context/PredictionWindowContext";

// 🔹 ROUTES
import AppRoutes from "./organizational_login/routes/AppRoutes";

// 🔹 MOCK DATA
import { generateMockMembers } from "./organizational_login/services/mockData";

// 🔹 STYLES
import "./App.css";

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
      <PredictionWindowProvider> {/* ✅ ADD THIS */}
        <MemberProvider>
          <NavigationHistoryProvider>
            <CarePlanProvider>
              <AppContent />
            </CarePlanProvider>
          </NavigationHistoryProvider>
        </MemberProvider>
      </PredictionWindowProvider>
    </AuthProvider>
  );
}

export default App;
