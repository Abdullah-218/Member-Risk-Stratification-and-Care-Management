import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { useMembers } from "../../context/MemberContext";
import { useNavigationHistory } from "../../context/NavigationHistoryContext";

// common components
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";

// upload components
import FileUploadZone from "../../components/upload/FileUploadZone/FileUploadZone";
import ProcessingScreen from "../../components/upload/ProcessingScreen/ProcessingScreen";

// services (same module)
import { generateMockMembers } from "../../services/mockData";
import { getRiskTier } from "../../utils/riskCalculations";

// styles
import styles from "./UploadPage.module.css";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const { addMembers } = useMembers();
  const navigate = useNavigate();
  const { getPreviousPage } = useNavigationHistory();

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
  };

  const handleAnalyze = () => {
    if (!file) {
      alert('Please select a CSV file first');
      return;
    }

    setProcessing(true);
    setProgress(0);

    // Simulate processing
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const mockMembers = generateMockMembers(100);
            addMembers(mockMembers);
            navigate(getPreviousPage());
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleBackClick = () => {
    navigate(getPreviousPage());
  };

  const handleCancelClick = () => {
    navigate(getPreviousPage());
  };

  if (processing) {
    return <ProcessingScreen progress={progress} />;
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>📤 Upload CSV Data</h2>
          <Button variant="ghost" onClick={handleBackClick}>
            <ChevronLeft size={16} /> Back
          </Button>
        </div>

        <div className={styles.content}>
          <div className={styles.uploadSection}>
            <h3>Upload CSV File</h3>
            <p>Drag and drop your CSV file or click to browse</p>

            <FileUploadZone
              onFileSelect={handleFileSelect}
              selectedFile={file}
            />
          </div>

          <div className={styles.footer}>
            <Button variant="secondary" onClick={handleCancelClick}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAnalyze}
              disabled={!file}
            >
              Analyze Risk →
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UploadPage;