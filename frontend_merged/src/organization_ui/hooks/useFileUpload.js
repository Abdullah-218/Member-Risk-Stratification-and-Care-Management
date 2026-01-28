import { useState, useCallback } from 'react';
import { csvProcessor } from '../services/csv/csvProcessor';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const validateFile = useCallback((file) => {
    if (!file) {
      throw new Error('No file selected');
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      throw new Error('Please select a CSV file');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size exceeds 10MB limit');
    }

    return true;
  }, []);

  const uploadFile = useCallback(async (file, requiredColumns) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      validateFile(file);
      setProgress(20);

      // Parse CSV
      const results = await csvProcessor.parse(file);
      setProgress(50);

      // Validate columns
      const validation = csvProcessor.validate(results.data, requiredColumns);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      setProgress(70);

      // Transform data
      const transformedData = csvProcessor.transform(results.data);
      setProgress(100);

      setUploading(false);
      return transformedData;
    } catch (err) {
      setError(err.message);
      setUploading(false);
      throw err;
    }
  }, [validateFile]);

  return {
    uploadFile,
    uploading,
    progress,
    error
  };
};

export default useFileUpload;