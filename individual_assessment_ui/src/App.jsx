import React from 'react';
import { Routes, Route } from 'react-router-dom';
import IndividualAssessmentPage from './pages/IndividualAssessmentPage/IndividualAssessmentPage';
import AssessmentReportPage from './pages/AssessmentReportPage/AssessmentReportPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<IndividualAssessmentPage />} />
        <Route path="/assessment" element={<IndividualAssessmentPage />} />
        <Route path="/report" element={<AssessmentReportPage />} />
      </Routes>
    </div>
  );
}

export default App;
