import React, { useState, useEffect } from 'react';
import { X, Users, TrendingUp, DollarSign, PiggyBank, Activity } from 'lucide-react';
import { getTierFinancials } from '../../../services/api/dashboardApi';
import './TierAnalyticsModal.css';

const TierAnalyticsModal = ({ isOpen, onClose, tier, tierName, predictionWindow }) => {
  const [tierData, setTierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('TierAnalyticsModal props:', { isOpen, tier, tierName, predictionWindow });

  useEffect(() => {
    if (isOpen && tier) {
      console.log('Effect triggered - fetching data');
      fetchTierData();
    }
  }, [isOpen, tier, predictionWindow]);

  const fetchTierData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== FETCHING TIER DATA ===');
      console.log('Tier:', tier, 'Type:', typeof tier);
      console.log('Window:', predictionWindow, 'Type:', typeof predictionWindow);
      
      // Convert number to proper window format (90 -> "90_day")
      const windowParam = typeof predictionWindow === 'number' 
        ? `${predictionWindow}_day` 
        : predictionWindow;
      
      console.log('Converted window param:', windowParam);
      
      const response = await getTierFinancials(windowParam);
      console.log('=== API RESPONSE ===');
      console.log('Success:', response.success);
      console.log('Data array:', response.data);
      console.log('Data length:', response.data?.length);
      
      if (response.success && response.data) {
        // Try both string and number comparison
        console.log('Looking for tier:', tier);
        response.data.forEach((t, idx) => {
          console.log(`  [${idx}] riskTier:`, t.riskTier, 'Type:', typeof t.riskTier);
        });
        
        const data = response.data.find(t => {
          const match = parseInt(t.riskTier) === parseInt(tier);
          console.log(`Comparing ${t.riskTier} === ${tier}:`, match);
          return match;
        });
        
        console.log('=== FOUND DATA ===');
        console.log(data);
        
        if (data) {
          setTierData(data);
        } else {
          console.error('NO TIER DATA FOUND!');
          setError('Tier data not found');
        }
      } else {
        setError('Failed to fetch data');
      }
    } catch (error) {
      console.error('=== ERROR FETCHING ===');
      console.error(error);
      setError(error.message || 'Unknown error');
    } finally {
      setLoading(false);
      console.log('=== LOADING COMPLETE ===');
    }
  };

  const formatCurrency = (value) => {
    try {
      if (!value || value === 'null' || value === 'undefined') return '$0';
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return '$0';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue);
    } catch (e) {
      return '$0';
    }
  };

  const formatPercent = (value) => {
    try {
      if (!value || value === null || value === 'null') return 'N/A';
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return 'N/A';
      return `${numValue.toFixed(2)}%`;
    } catch (e) {
      return 'N/A';
    }
  };

  const formatNumber = (value) => {
    try {
      if (!value || value === 'null') return '0';
      const numValue = typeof value === 'string' ? parseInt(value) : value;
      if (isNaN(numValue)) return '0';
      return new Intl.NumberFormat('en-US').format(numValue);
    } catch (e) {
      return '0';
    }
  };

  const formatRiskScore = (value) => {
    try {
      if (!value || value === 'null') return '0.000';
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return '0.000';
      return numValue.toFixed(3);
    } catch (e) {
      return '0.000';
    }
  };

  const formatSuccessRate = (value) => {
    try {
      if (!value || value === 'null') return 'N/A';
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return 'N/A';
      return `${(numValue * 100).toFixed(2)}%`;
    } catch (e) {
      return 'N/A';
    }
  };

  const getRiskLabel = (tier) => {
    const labels = {
      1: { name: 'Low Risk', color: '#10b981', description: 'Minimal intervention needed' },
      2: { name: 'Low-Moderate', color: '#34d399', description: 'Light monitoring recommended' },
      3: { name: 'Moderate', color: '#f59e0b', description: 'Regular intervention needed' },
      4: { name: 'High', color: '#f97316', description: 'Intensive care required' },
      5: { name: 'Critical', color: '#dc2626', description: 'Immediate action required' },
    };
    return labels[tier] || labels[1];
  };

  if (!isOpen) {
    console.log('Modal closed - not rendering');
    return null;
  }

  const riskInfo = getRiskLabel(tier);

  // Convert predictionWindow to display format
  const windowDisplay = typeof predictionWindow === 'number'
    ? `${predictionWindow}-DAY`
    : predictionWindow?.replace('_', '-').toUpperCase() || 'N/A';

  console.log('=== MODAL RENDERING ===');
  console.log('isOpen:', isOpen);
  console.log('tier:', tier);
  console.log('tierData:', tierData);
  console.log('loading:', loading);
  console.log('error:', error);
  console.log('riskInfo:', riskInfo);

  return (
    <div className="tier-modal-overlay" onClick={onClose}>
      <div className="tier-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tier-modal-header" style={{ borderLeftColor: riskInfo.color }}>
          <div>
            <h2 className="tier-modal-title">
              Tier {tier} Analytics - {riskInfo.name}
            </h2>
            <p className="tier-modal-subtitle">
              {windowDisplay} • {riskInfo.description}
            </p>
          </div>
          <button className="tier-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="tier-modal-body">
          {loading ? (
            <div className="tier-modal-loading">
              <div className="spinner"></div>
              <p>Loading tier analytics...</p>
            </div>
          ) : error ? (
            <div className="tier-modal-error">
              <p>Error: {error}</p>
              <button onClick={fetchTierData} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}>
                Retry
              </button>
            </div>
          ) : tierData ? (
            <>
              {/* Population Overview */}
              <section className="tier-section">
                <h3 className="tier-section-title">
                  <Users size={20} />
                  Population Overview
                </h3>
                <div className="tier-stats-grid">
                  <div className="tier-stat-card">
                    <div className="tier-stat-label">Total Patients</div>
                    <div className="tier-stat-value">{formatNumber(tierData.patientCount)}</div>
                  </div>
                  <div className="tier-stat-card">
                    <div className="tier-stat-label">Average Risk Score</div>
                    <div className="tier-stat-value">{formatRiskScore(tierData.avgRiskScore)}</div>
                  </div>
                  <div className="tier-stat-card">
                    <div className="tier-stat-label">Success Rate</div>
                    <div className="tier-stat-value">{formatSuccessRate(tierData.avgSuccessRate)}</div>
                  </div>
                </div>
              </section>

              {/* Financial Metrics */}
              <section className="tier-section">
                <h3 className="tier-section-title">
                  <DollarSign size={20} />
                  Financial Metrics
                </h3>
                <div className="tier-stats-grid">
                  <div className="tier-stat-card highlight">
                    <div className="tier-stat-icon" style={{ backgroundColor: '#fee2e2' }}>
                      <Activity size={20} color="#dc2626" />
                    </div>
                    <div>
                      <div className="tier-stat-label">Projected Cost</div>
                      <div className="tier-stat-value">{formatCurrency(tierData.totalProjectedCost)}</div>
                    </div>
                  </div>
                  <div className="tier-stat-card highlight">
                    <div className="tier-stat-icon" style={{ backgroundColor: '#dbeafe' }}>
                      <DollarSign size={20} color="#2563eb" />
                    </div>
                    <div>
                      <div className="tier-stat-label">Intervention Cost</div>
                      <div className="tier-stat-value">{formatCurrency(tierData.totalInterventionCost)}</div>
                    </div>
                  </div>
                  <div className="tier-stat-card highlight">
                    <div className="tier-stat-icon" style={{ backgroundColor: '#d1fae5' }}>
                      <PiggyBank size={20} color="#059669" />
                    </div>
                    <div>
                      <div className="tier-stat-label">Expected Savings</div>
                      <div className="tier-stat-value">{formatCurrency(tierData.totalExpectedSavings)}</div>
                    </div>
                  </div>
                  <div className="tier-stat-card highlight">
                    <div className="tier-stat-icon" style={{ backgroundColor: '#fef3c7' }}>
                      <TrendingUp size={20} color="#d97706" />
                    </div>
                    <div>
                      <div className="tier-stat-label">Net Benefit</div>
                      <div className="tier-stat-value">{formatCurrency(tierData.totalNetBenefit)}</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ROI Analysis */}
              <section className="tier-section">
                <h3 className="tier-section-title">
                  <TrendingUp size={20} />
                  ROI Analysis
                </h3>
                <div className="tier-roi-container">
                  <div className="tier-roi-card">
                    <div className="tier-roi-label">Tier ROI</div>
                    <div className="tier-roi-value" style={{ 
                      color: (tierData.tierRoiPercent && parseFloat(tierData.tierRoiPercent) > 0) ? '#059669' : '#dc2626' 
                    }}>
                      {formatPercent(tierData.tierRoiPercent)}
                    </div>
                    <div className="tier-roi-description">
                      {!tierData.tierRoiPercent || tierData.tierRoiPercent === null ? 'No Intervention Needed' :
                       parseFloat(tierData.tierRoiPercent) > 75 ? 'Excellent Return' :
                       parseFloat(tierData.tierRoiPercent) > 50 ? 'Strong Return' :
                       parseFloat(tierData.tierRoiPercent) > 0 ? 'Positive Return' :
                       'Negative Return'}
                    </div>
                  </div>
                  
                  <div className="tier-cost-breakdown">
                    <h4>Cost Breakdown</h4>
                    <div className="tier-breakdown-item">
                      <span>Per Patient Intervention:</span>
                      <strong>{formatCurrency((parseFloat(tierData.totalInterventionCost || 0) / parseInt(tierData.patientCount || 1)))}</strong>
                    </div>
                    <div className="tier-breakdown-item">
                      <span>Per Patient Savings:</span>
                      <strong>{formatCurrency((parseFloat(tierData.totalExpectedSavings || 0) / parseInt(tierData.patientCount || 1)))}</strong>
                    </div>
                    <div className="tier-breakdown-item">
                      <span>Per Patient Net Benefit:</span>
                      <strong>{formatCurrency((parseFloat(tierData.totalNetBenefit || 0) / parseInt(tierData.patientCount || 1)))}</strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recommendations */}
              <section className="tier-section">
                <h3 className="tier-section-title">
                  💡 Recommendations
                </h3>
                <div className="tier-recommendations">
                  {tier === 1 && (
                    <div className="tier-recommendation">
                      <strong>No Active Intervention:</strong> This low-risk group requires minimal monitoring. 
                      Focus resources on higher-risk tiers for better ROI.
                    </div>
                  )}
                  {tier === 2 && (
                    <div className="tier-recommendation">
                      <strong>Light Touch Monitoring:</strong> Implement preventive care programs. 
                      ROI is {tierData.tierRoiPercent > 0 ? 'positive' : 'challenging'}, consider cost-effective interventions.
                    </div>
                  )}
                  {tier === 3 && (
                    <div className="tier-recommendation">
                      <strong>Regular Intervention:</strong> This moderate-risk group benefits from regular check-ins. 
                      Balance intervention intensity with cost-effectiveness.
                    </div>
                  )}
                  {tier === 4 && (
                    <div className="tier-recommendation">
                      <strong>Intensive Care Management:</strong> High-risk patients showing strong ROI. 
                      Prioritize care coordination and proactive interventions.
                    </div>
                  )}
                  {tier === 5 && (
                    <div className="tier-recommendation">
                      <strong>Immediate Action Required:</strong> Critical patients with highest ROI. 
                      Deploy comprehensive care management programs immediately.
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="tier-modal-error">
              <p>No data available for this tier.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TierAnalyticsModal;
