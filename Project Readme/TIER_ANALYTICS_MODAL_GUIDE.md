# Tier Analytics Modal - User Guide

## Overview
The Tier Analytics Modal provides detailed financial and population insights for each risk tier in your organization dashboard. This feature allows stakeholders to drill down into specific risk levels to understand intervention effectiveness and ROI.

## How to Access

### From Dashboard
1. Navigate to the Organization Dashboard
2. Scroll to the "Risk Distribution" chart
3. Below the bar chart, you'll see 5 tier buttons:
   - **Tier 1 - Low** (Green)
   - **Tier 2 - Low-Moderate** (Light Green)
   - **Tier 3 - Moderate** (Amber)
   - **Tier 4 - High** (Orange)
   - **Tier 5 - Critical** (Red)
4. Click any tier button to view detailed analytics

## Modal Sections

### 1. Population Overview
- **Total Patients**: Number of patients in this tier
- **Average Risk Score**: Mean risk probability (0.0 - 1.0)
- **Success Rate**: Average intervention success probability

### 2. Financial Metrics
Four key financial cards showing:
- **Projected Cost**: Total healthcare costs for this tier
- **Intervention Cost**: Total cost of preventive interventions
- **Expected Savings**: Anticipated cost reductions from interventions
- **Net Benefit**: Savings minus intervention cost

### 3. ROI Analysis
- **Tier ROI**: (Net Benefit ÷ Intervention Cost) × 100
  - **Excellent Return**: > 75%
  - **Strong Return**: 50-75%
  - **Positive Return**: 0-50%
  - **No Intervention**: Tier 1 (no cost)
  - **Negative Return**: < 0%

- **Cost Breakdown**:
  - Per Patient Intervention cost
  - Per Patient Savings
  - Per Patient Net Benefit

### 4. Recommendations
Tier-specific strategic guidance:

- **Tier 1 (Low Risk)**: No active intervention needed
- **Tier 2 (Low-Moderate)**: Light touch monitoring
- **Tier 3 (Moderate)**: Regular intervention programs
- **Tier 4 (High)**: Intensive care management
- **Tier 5 (Critical)**: Immediate comprehensive care

## Key Insights by Window

### 30-Day Window
- **Best ROI**: Tier 5 (124.69%)
- **Largest Net Benefit**: Tier 4 ($25,984)
- **Overall Program ROI**: 54.13%

### 60-Day Window
- **Best ROI**: Tier 5 (134.60%)
- **Challenge**: Tiers 2-3 show negative ROI
- **Overall Program ROI**: 37.73%

### 90-Day Window
- **Best ROI**: Tier 5 (82.21%)
- **Challenge**: Tiers 3-4 show negative ROI
- **Overall Program ROI**: 6.80%

## Use Cases

### For Executives
- Identify which risk tiers provide best ROI
- Allocate intervention budgets effectively
- Understand population risk distribution

### For Care Managers
- Determine resource allocation per tier
- Plan intervention strategies
- Monitor program effectiveness

### For Finance Teams
- Calculate expected returns per risk level
- Budget for intervention programs
- Project cost savings

## Data Source
All metrics are calculated from:
- **ML Model**: ExtraTrees classifier predictions
- **Database**: PostgreSQL tier_financial_summary view
- **API Endpoint**: `/api/dashboard/tier-financials?window={30|60|90}_day`

## Technical Details

### API Response Format
```json
{
  "success": true,
  "window": "30_day",
  "data": [
    {
      "predictionWindow": "30_day",
      "riskTier": 1,
      "tierName": "Tier 1 - Low Risk",
      "patientCount": "2584",
      "avgRiskScore": "0.0191",
      "totalProjectedCost": "443106.09",
      "totalInterventionCost": "0.00",
      "totalExpectedSavings": "24253.78",
      "totalNetBenefit": "24253.78",
      "tierRoiPercent": null,
      "avgSuccessRate": "0.0543"
    }
  ]
}
```

### Component Files
- **Modal**: `/frontend/src/organization_ui/components/dashboard/TierAnalyticsModal/TierAnalyticsModal.jsx`
- **Styles**: `/frontend/src/organization_ui/components/dashboard/TierAnalyticsModal/TierAnalyticsModal.css`
- **Chart**: `/frontend/src/organization_ui/components/dashboard/RiskDistributionChart/RiskDistributionChart.jsx`
- **API**: `/frontend/src/organization_ui/services/api/dashboardApi.js`

### Backend Files
- **Model**: `/backend/src/models/dashboard.js` (getTierFinancials method)
- **Route**: `/backend/src/routes/dashboard.routes.js` (tier-financials endpoint)
- **Database**: `/database/scripts/04_create_tier_financial_view.sql`

## Future Enhancements

Potential additions:
- [ ] Export tier data to CSV/PDF
- [ ] Compare tiers side-by-side
- [ ] Historical trend analysis per tier
- [ ] Individual patient list per tier
- [ ] Tier transition tracking (movement between tiers)

## Troubleshooting

**Modal not opening?**
- Check browser console for errors
- Verify backend is running on port 3000
- Ensure database view is refreshed

**Data showing as N/A?**
- Tier 1 has no intervention cost, so ROI is null
- Refresh materialized view: `REFRESH MATERIALIZED VIEW tier_financial_summary;`

**Wrong ROI values?**
- Reload predictions: `python db_manager/load_predictions_from_models.py`
- Verify window parameter matches (30_day, 60_day, or 90_day)
