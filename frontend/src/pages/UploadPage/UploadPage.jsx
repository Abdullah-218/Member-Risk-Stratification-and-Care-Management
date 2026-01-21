import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useMembers } from '../../context/MemberContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import DataSourceSelector from '../../components/upload/DataSourceSelector/DataSourceSelector';
import FileUploadZone from '../../components/upload/FileUploadZone/FileUploadZone';
import AnalysisConfig from '../../components/upload/AnalysisConfig/AnalysisConfig';
import ProcessingScreen from '../../components/upload/ProcessingScreen/ProcessingScreen';
import { generateMockMembers } from '../../utils/mockData';
import styles from './UploadPage.module.css';

const UploadPage = () => {
  const [source, setSource] = useState('csv');
  const [file, setFile] = useState(null);
  const [config, setConfig] = useState({
    window: '90',
    model: 'comprehensive',
    includeShap: true
  });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { addMembers } = useMembers();
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
  };

  const handleAnalyze = () => {
    if (!file) {
      alert('Please select a file first');
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
            navigate('/dashboard');
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  if (processing) {
    return <ProcessingScreen progress={progress} />;
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>📤 Upload Member Data</h2>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ChevronLeft size={16} /> Back
          </Button>
        </div>

        <div className={styles.content}>
          <DataSourceSelector 
            selectedSource={source}
            onSourceChange={setSource}
          />

          <FileUploadZone 
            onFileSelect={handleFileSelect}
            selectedFile={file}
          />

          {file && (
            <AnalysisConfig 
              config={config}
              onConfigChange={setConfig}
            />
          )}

          <div className={styles.footer}>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
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