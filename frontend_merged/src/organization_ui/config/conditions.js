export const conditions = {
  chronic: [
    {
      id: 'diabetes',
      name: 'Diabetes Type 2',
      category: 'Metabolic',
      riskWeight: 0.15,
      icdCodes: ['E11'],
      commonComplications: ['Neuropathy', 'Retinopathy', 'Nephropathy'],
      recommendedScreenings: ['HbA1c', 'Foot exam', 'Eye exam']
    },
    {
      id: 'chf',
      name: 'CHF',
      category: 'Cardiac',
      riskWeight: 0.18,
      icdCodes: ['I50'],
      commonComplications: ['Pulmonary edema', 'Arrhythmia'],
      recommendedScreenings: ['Echocardiogram', 'BNP', 'EKG']
    },
    {
      id: 'hypertension',
      name: 'Hypertension',
      category: 'Cardiovascular',
      riskWeight: 0.08,
      icdCodes: ['I10'],
      commonComplications: ['Stroke', 'Heart attack', 'Kidney disease'],
      recommendedScreenings: ['Blood pressure monitoring', 'Lipid panel']
    },
    {
      id: 'copd',
      name: 'COPD',
      category: 'Respiratory',
      riskWeight: 0.12,
      icdCodes: ['J44'],
      commonComplications: ['Respiratory failure', 'Pneumonia'],
      recommendedScreenings: ['Pulmonary function test', 'Chest X-ray']
    },
    {
      id: 'ckd',
      name: 'CKD',
      category: 'Renal',
      riskWeight: 0.14,
      icdCodes: ['N18'],
      commonComplications: ['Anemia', 'Bone disease', 'Cardiovascular disease'],
      recommendedScreenings: ['eGFR', 'Urinalysis', 'Electrolytes']
    },
    {
      id: 'cancer',
      name: 'Cancer',
      category: 'Oncology',
      riskWeight: 0.10,
      icdCodes: ['C00-C96'],
      commonComplications: ['Metastasis', 'Treatment side effects'],
      recommendedScreenings: ['Tumor markers', 'Imaging']
    }
  ],
  
  getConditionByName: (name) => {
    return conditions.chronic.find(c => 
      c.name.toLowerCase() === name.toLowerCase()
      );
  },
  
  getConditionsByCategory: (category) => {
    return conditions.chronic.filter(c => c.category === category);
  }
};

export default conditions;
