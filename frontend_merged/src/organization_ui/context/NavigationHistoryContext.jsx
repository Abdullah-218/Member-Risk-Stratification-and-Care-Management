import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationHistoryContext = createContext();

export const useNavigationHistory = () => {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error('useNavigationHistory must be used within NavigationHistoryProvider');
  }
  return context;
};

export const NavigationHistoryProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const location = useLocation();

  // Track page visits
  useEffect(() => {
    setHistory(prev => {
      // Don't add duplicate consecutive paths
      if (prev.length > 0 && prev[prev.length - 1] === location.pathname) {
        return prev;
      }
      // Keep only last 20 entries
      return [...prev.slice(-19), location.pathname];
    });
  }, [location.pathname]);

  const getPreviousPage = () => {
    if (history.length < 2) {
      return '/dashboard';
    }
    return history[history.length - 2];
  };

  const getCurrentPage = () => {
    return location.pathname;
  };

  const value = {
    history,
    getPreviousPage,
    getCurrentPage
  };

  return (
    <NavigationHistoryContext.Provider value={value}>
      {children}
    </NavigationHistoryContext.Provider>
  );
};

export default NavigationHistoryContext;
