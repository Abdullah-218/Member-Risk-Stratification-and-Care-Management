import express from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * POST /api/upload/csv
 * Upload CSV file with patient data
 * 
 * Request: multipart/form-data { file: CSV }
 * Response: { success, uploaded, errors, results }
 */
router.post('/csv', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const lines = fileContent.split('\n');

    // TODO: Parse CSV and insert patients into database

    const mockResults = [
      { row: 1, patientId: 101, status: 'success', name: 'Patient A' },
      { row: 2, patientId: 102, status: 'success', name: 'Patient B' },
      { row: 3, patientId: null, status: 'error', error: 'Invalid data' },
    ];

    const successCount = mockResults.filter(r => r.status === 'success').length;
    const errorCount = mockResults.filter(r => r.status === 'error').length;

    res.json({
      success: true,
      message: 'File uploaded and processed',
      uploaded: successCount,
      errors: errorCount,
      totalRows: lines.length - 1, // Excluding header
      results: mockResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message,
    });
  }
});

export default router;
