import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import styles from './FileUpload.module.css';

const FileUpload = ({ onFileSelect, acceptedFormats = '.csv', label }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleChange}
        className={styles.hiddenInput}
      />
      <div className={styles.dropZone} onClick={handleClick}>
        <Upload className={styles.icon} />
        <p className={styles.text}>
          {label || 'Drag & Drop CSV here or click to browse'}
        </p>
      </div>
    </div>
  );
};

export default FileUpload;