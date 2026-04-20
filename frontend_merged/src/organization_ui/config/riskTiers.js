export const riskTiers = {
  tiers: [
    {
      level: 5,
      name: 'VERY_HIGH',
      label: 'Very High',
      color: '#1a1a1a',
      icon: '⚫',
      minScore: 0.8,
      maxScore: 1.0,
      description: 'Requires immediate intervention',
      actions: [
        'Immediate care coordinator assignment',
        'Specialist consultation within 24h',
        'Daily monitoring for 2 weeks',
        'Intensive disease management enrollment'
      ]
      },
    {
      level: 4,
      name: 'HIGH',
      label: 'High',
      color: '#dc2626',
      icon: '🔴',
      minScore: 0.6,
      maxScore: 0.8,
      description: 'Requires urgent attention',
      actions: [
        'Care coordinator assignment within 48h',
        'Specialist consultation within 1 week',
        'Weekly monitoring',
        'Care plan development'
      ]
    },
    {
      level: 3,
      name: 'MEDIUM',
      label: 'Medium',
      color: '#f59e0b',
      icon: '🟠',
      minScore: 0.4,
      maxScore: 0.6,
      description: 'Monitor closely',
      actions: [
        'Monthly check-ins',
        'Disease management program enrollment',
        'Medication reconciliation',
        'Preventive care recommendations'
      ]
    },
    {
      level: 2,
      name: 'LOW',
      label: 'Low',
      color: '#fbbf24',
       icon: '🟡',
      minScore: 0.2,
      maxScore: 0.4,
      description: 'Routine monitoring',
      actions: [
        'Quarterly wellness checks',
        'Preventive care reminders',
        'Health education materials'
      ]
    },
    {
      level: 1,
      name: 'VERY_LOW',
      label: 'Very Low',
      color: '#10b981',
      icon: '🟢',
      minScore: 0.0,
      maxScore: 0.2,
      description: 'Maintain current health',
      actions: [
        'Annual wellness visits',
        'Preventive screenings',
        'Wellness program participation'
      ]
    }
  ],
  
  getTier: (score) => {
    return riskTiers.tiers.find(tier => 
      score >= tier.minScore && score < tier.maxScore
    ) || riskTiers.tiers[riskTiers.tiers.length - 1];
  }
};

export default riskTiers;