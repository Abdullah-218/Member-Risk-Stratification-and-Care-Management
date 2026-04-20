import React from 'react';

const TestApp = () => {
  console.log('TestApp component rendering');
  
  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)', 
      minHeight: '100vh',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      <h1>TEST APP IS WORKING!</h1>
      <p>If you see this, React is working.</p>
      <p>Current URL: {typeof window !== 'undefined' ? window.location.pathname : 'Unknown'}</p>
    </div>
  );
};

export default TestApp;
