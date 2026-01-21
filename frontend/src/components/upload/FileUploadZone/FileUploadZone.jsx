import React, { useState, useRef } from 'react';
import { Upload, FileText, Download } from 'lucide-react';
import Button from '../../common/Button/Button';
import styles from './FileUploadZone.module.css';

const FileUploadZone = ({ onFileSelect, selectedFile }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onFileSelect(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Step 2: Choose File</h3>
      
      <div
        className={`${styles.dropZone} ${dragActive ? styles.active : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className={styles.hiddenInput}
        />
        
        <Upload className={styles.icon} />
        <p className={styles.text}>📁 Drag & Drop CSV here or</p>
        <Button variant="primary" type="button">
          Browse Files...
        </Button>

        {selectedFile && (
          <div className={styles.selectedFile}>
            <FileText size={16} />
            <span>✓ Selected: {selectedFile.name}</span>
          </div>
        )}

        <div className={styles.requirements}>
          <div className={styles.requirementText}>
            ✓ Required columns: patient_id, age, gender, conditions, utilization, lab_results
          </div>
          <button className={styles.templateLink}>
            <Download size={14} />
            Download Sample Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;