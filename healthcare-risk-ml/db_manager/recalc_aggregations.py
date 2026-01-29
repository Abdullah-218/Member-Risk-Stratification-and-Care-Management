#!/usr/bin/env python3
"""Recalculate aggregations with new department distribution"""

import psycopg2

conn = psycopg2.connect(
    host='localhost', port=5433, database='risk_predictionDB',
    user='abdullah', password='abdullah123'
)
cursor = conn.cursor()

print("\n" + "="*100)
print("RECALCULATING AGGREGATIONS WITH NEW DEPARTMENT DISTRIBUTION")
print("="*100)

# Clear old aggregations
print("\nClearing old aggregation tables...")
cursor.execute("DELETE FROM organization_predictions")
cursor.execute("DELETE FROM tier_statistics")
conn.commit()
print("✅ Cleared")

# Recalculate organization_predictions
print("\nRecalculating organization_predictions...")
cursor.execute("""
INSERT INTO organization_predictions 
(organization_id, prediction_window, total_patients, tier_1_count, tier_2_count, tier_3_count, tier_4_count, tier_5_count,
 avg_risk_score, avg_roi_percent, total_net_benefit)
SELECT
    1,
    p.prediction_window,
    COUNT(DISTINCT p.patient_id),
    COALESCE(SUM(CASE WHEN p.risk_tier = 1 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN p.risk_tier = 2 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN p.risk_tier = 3 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN p.risk_tier = 4 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN p.risk_tier = 5 THEN 1 ELSE 0 END), 0),
    ROUND(AVG(p.risk_score)::NUMERIC, 4),
    ROUND(AVG(fp.roi_percent)::NUMERIC, 2),
    ROUND(SUM(fp.net_benefit)::NUMERIC, 2)
FROM predictions p
JOIN financial_projections fp ON p.prediction_id = fp.prediction_id
GROUP BY p.prediction_window
ORDER BY p.prediction_window
""")
conn.commit()
print("✅ Organization predictions updated (3 records)")

# Recalculate tier_statistics
print("\nRecalculating tier_statistics...")
cursor.execute("""
INSERT INTO tier_statistics
(organization_id, prediction_window, risk_tier, total_patients, avg_risk_score, avg_cost,
 avg_roi_percent, readmission_risk)
SELECT
    1,
    p.prediction_window,
    p.risk_tier,
    COUNT(DISTINCT p.patient_id),
    ROUND(AVG(p.risk_score)::NUMERIC, 4),
    ROUND(AVG(fp.window_cost)::NUMERIC, 2),
    ROUND(AVG(fp.roi_percent)::NUMERIC, 2),
    ROUND(AVG(
        CASE 
            WHEN p.risk_tier = 1 THEN 3
            WHEN p.risk_tier = 2 THEN 15
            WHEN p.risk_tier = 3 THEN 35
            WHEN p.risk_tier = 4 THEN 60
            WHEN p.risk_tier = 5 THEN 85
            ELSE 0
        END
    )::NUMERIC, 1)
FROM predictions p
JOIN financial_projections fp ON p.prediction_id = fp.prediction_id
GROUP BY p.prediction_window, p.risk_tier
ORDER BY p.prediction_window, p.risk_tier
""")
conn.commit()
print("✅ Tier statistics updated (15 records)")

print("\n" + "="*100)
print("✅ AGGREGATIONS RECALCULATED SUCCESSFULLY")
print("="*100 + "\n")

conn.close()
