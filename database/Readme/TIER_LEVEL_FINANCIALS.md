# Tier-Level Financial Breakdown

## Overview
The database now contains tier-by-tier financial metrics that match your ML model output. This provides detailed ROI and cost analysis for each of the 5 risk tiers across all 3 prediction windows.

## Database View
**View Name:** `tier_financial_summary`
**Type:** Materialized View (refreshed when predictions are loaded)

## Data Structure

Each tier contains the following metrics:
- **Patient Count**: Number of patients in this tier
- **Average Risk Score**: Mean risk probability for the tier
- **Total Projected Cost**: Sum of healthcare costs for the window
- **Total Intervention Cost**: Sum of intervention expenses
- **Total Expected Savings**: Sum of potential cost reductions
- **Total Net Benefit**: Expected savings minus intervention cost
- **Tier ROI Percent**: (Net Benefit / Intervention Cost) × 100
- **Average Success Rate**: Mean intervention success probability

## API Endpoint

### GET /api/dashboard/tier-financials

**URL:** `http://localhost:3000/api/dashboard/tier-financials?window=30_day`

**Query Parameters:**
- `window`: `30_day` | `60_day` | `90_day`

**Response Format:**
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
    },
    ...
  ]
}
```

## Sample Data (30-Day Window)

| Tier | Name | Patients | Avg Risk | Intervention | Savings | Net Benefit | ROI % |
|------|------|----------|----------|--------------|---------|-------------|-------|
| 1 | Low Risk | 2,584 | 0.019 | $0 | $24,254 | $24,254 | 0% |
| 2 | Low-Moderate | 236 | 0.141 | $35,400 | $39,632 | $4,232 | 11.96% |
| 3 | Moderate | 68 | 0.355 | $27,200 | $34,858 | $7,658 | 28.16% |
| 4 | High | 98 | 0.573 | $68,600 | $94,584 | $25,984 | 37.88% |
| 5 | Critical | 14 | 0.867 | $12,600 | $28,311 | $15,711 | 124.69% |

**Total Program:** $143,800 intervention → $221,639 savings → **54.13% ROI**

## Key Insights

### 30-Day Window
- **Highest ROI**: Tier 5 (Critical) - 124.69%
- **Largest Net Benefit**: Tier 4 (High) - $25,984
- **No Intervention**: Tier 1 (Low Risk) - $0 cost but $24,254 natural savings

### 60-Day Window
- Overall Program ROI: **37.73%**
- 257 high-risk patients (Tier 4+5)
- Total Intervention: $642,050
- Total Savings: $884,389

### 90-Day Window
- Overall Program ROI: **6.80%**
- 633 high-risk patients (Tier 4+5)
- Total Intervention: $1,877,150
- Total Savings: $2,010,073

## Refresh Strategy

The materialized view is refreshed automatically when you run:
```bash
python db_manager/load_predictions_from_models.py
```

Or manually refresh:
```sql
REFRESH MATERIALIZED VIEW tier_financial_summary;
```

## Usage in Dashboard

You can now create tier-level financial tables showing:
1. **Cost per Tier**: How much each risk level costs to intervene
2. **ROI by Tier**: Which tiers provide the best return
3. **Patient Distribution**: How many patients fall into each tier
4. **Risk Stratification**: Average risk scores per tier

This matches exactly what your ML model (02_roi_calculation.py) calculates!
