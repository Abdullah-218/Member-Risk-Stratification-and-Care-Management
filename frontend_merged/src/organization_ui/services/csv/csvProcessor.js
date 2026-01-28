import Papa from 'papaparse';

export const csvProcessor = {
  parse: (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  },

  validate: (data, requiredColumns) => {
    if (!data || !data.length) {
      return { valid: false, error: 'No data found in CSV' };
    }

    const headers = Object.keys(data[0]);
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return {
        valid: false,
        error: `Missing required columns: ${missingColumns.join(', ')}`
      };
    }

    return { valid: true };
  },

  transform: (data) => {
    return data.map(row => ({
      id: row.patient_id,
      age: parseInt(row.age),
      gender: row.gender,
      bmi: parseFloat(row.bmi),
      systolicBP: parseInt(row.systolic_bp),
      diastolicBP: parseInt(row.diastolic_bp),
      glucose: parseInt(row.glucose),
      cholesterol: parseInt(row.cholesterol),
      conditions: row.conditions ? row.conditions.split(',').map(c => c.trim()) : [],
      edVisits: parseInt(row.ed_visits),
      hospitalizations: parseInt(row.hospitalizations),
      medications: parseInt(row.medications),
      smoking: row.smoking,
      primaryCareVisits: parseInt(row.primary_care_visits)
    }));
  },

  export: (data, filename = 'export.csv') => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default csvProcessor;