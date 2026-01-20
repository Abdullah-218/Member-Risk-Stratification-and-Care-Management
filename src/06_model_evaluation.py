import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import (
    roc_auc_score, classification_report, confusion_matrix,
    precision_recall_curve, average_precision_score, brier_score_loss
)
from sklearn.calibration import calibration_curve
import matplotlib.pyplot as plt

class ModelEvaluator:
    """
    Comprehensive model evaluation
    """
    
    def __init__(self):
        self.model = joblib.load('models/xgb_risk_model.pkl')
        self.feature_names = joblib.load('models/feature_names.pkl')
    
    def evaluate(self):
        """Full evaluation pipeline"""
        # Load test data
        X_test = pd.read_csv('data/processed/X_test.csv')
        y_test = pd.read_csv('data/processed/y_test.csv').values.ravel()
        
        # Predictions
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        metrics = self._calculate_metrics(y_test, y_pred, y_pred_proba)
        
        # Visualizations
        self._plot_calibration(y_test, y_pred_proba)
        self._plot_precision_recall(y_test, y_pred_proba)
        self._plot_risk_distribution(y_pred_proba)
        
        # Generate report
        self._generate_report(metrics)
        
        return metrics
    
    def _calculate_metrics(self, y_true, y_pred, y_pred_proba):
        """Calculate all metrics"""
        print("\n" + "="*60)
        print("FINAL MODEL PERFORMANCE")
        print("="*60)
        
        cm = confusion_matrix(y_true, y_pred)
        tn, fp, fn, tp = cm.ravel()
        
        metrics = {
            'accuracy': (tp + tn) / (tp + tn + fp + fn),
            'precision': tp / (tp + fp) if (tp + fp) > 0 else 0,
            'recall': tp / (tp + fn) if (tp + fn) > 0 else 0,
            'specificity': tn / (tn + fp) if (tn + fp) > 0 else 0,
            'roc_auc': roc_auc_score(y_true, y_pred_proba),
            'avg_precision': average_precision_score(y_true, y_pred_proba),
            'brier_score': brier_score_loss(y_true, y_pred_proba)
        }
        
        metrics['f1'] = (
            2 * metrics['precision'] * metrics['recall'] /
            (metrics['precision'] + metrics['recall'])
            if (metrics['precision'] + metrics['recall']) > 0 else 0
        )
        
        # Print
        print(f"\nROC-AUC:      {metrics['roc_auc']:.4f} ⭐")
        print(f"Accuracy:     {metrics['accuracy']:.4f}")
        print(f"Precision:    {metrics['precision']:.4f}")
        print(f"Recall:       {metrics['recall']:.4f}")
        print(f"Specificity:  {metrics['specificity']:.4f}")
        print(f"F1-Score:     {metrics['f1']:.4f}")
        print(f"Avg Precision: {metrics['avg_precision']:.4f}")
        print(f"Brier Score:  {metrics['brier_score']:.4f}")
        
        if metrics['roc_auc'] >= 0.85:
            print(f"\n✅ MEETS HACKATHON REQUIREMENT (AUC >= 0.85)")
        else:
            print(f"\n⚠️ Below target AUC of 0.85")
        
        return metrics
    
    def _plot_calibration(self, y_true, y_pred_proba):
        """Calibration curve"""
        fraction_pos, mean_pred = calibration_curve(y_true, y_pred_proba, n_bins=10)
        
        plt.figure(figsize=(8, 6))
        plt.plot(mean_pred, fraction_pos, marker='o', linewidth=2, label='XGBoost')
        plt.plot([0, 1], [0, 1], 'k--', label='Perfectly Calibrated')
        plt.xlabel('Mean Predicted Probability')
        plt.ylabel('Fraction of Positives')
        plt.title('Calibration Curve')
        plt.legend()
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig('data/output/calibration_curve.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("✅ Calibration curve saved")
    
    def _plot_precision_recall(self, y_true, y_pred_proba):
        """Precision-recall curve"""
        precision, recall, _ = precision_recall_curve(y_true, y_pred_proba)
        avg_prec = average_precision_score(y_true, y_pred_proba)
        
        plt.figure(figsize=(8, 6))
        plt.plot(recall, precision, linewidth=2, label=f'AP={avg_prec:.3f}')
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title('Precision-Recall Curve')
        plt.legend()
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig('data/output/precision_recall_curve.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("✅ Precision-recall curve saved")
    
    def _plot_risk_distribution(self, y_pred_proba):
        """Risk score distribution"""
        plt.figure(figsize=(10, 6))
        plt.hist(y_pred_proba, bins=50, edgecolor='black', alpha=0.7)
        plt.axvline(0.2, color='green', linestyle='--', label='Low Threshold')
        plt.axvline(0.6, color='orange', linestyle='--', label='High Threshold')
        plt.xlabel('Risk Score')
        plt.ylabel('Number of Patients')
        plt.title('Risk Score Distribution')
        plt.legend()
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig('data/output/risk_distribution.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("✅ Risk distribution saved")
    
    def _generate_report(self, metrics):
        """Markdown report"""
        report = f"""
# Health Deterioration Risk Model - Evaluation Report

## Model Performance

### Key Metrics
- **ROC-AUC**: {metrics['roc_auc']:.4f} {'✅' if metrics['roc_auc'] >= 0.85 else '⚠️'}
- **Accuracy**: {metrics['accuracy']:.4f}
- **Precision**: {metrics['precision']:.4f}
- **Recall**: {metrics['recall']:.4f}
- **F1-Score**: {metrics['f1']:.4f}

### Clinical Impact
- Identifies {metrics['recall']*100:.1f}% of patients who will deteriorate
- {metrics['precision']*100:.1f}% of flagged patients actually deteriorate
- Enables proactive intervention for high-risk members

## Artifacts
- Model: `models/xgb_risk_model.pkl`
- Features: `models/feature_names.pkl`
- SHAP: `models/shap_explainer.pkl`

Generated: {pd.Timestamp.now()}
"""
        
        with open('data/output/evaluation_report.md', 'w') as f:
            f.write(report)
        
        print("✅ Report saved")

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    evaluator = ModelEvaluator()
    metrics = evaluator.evaluate()
    
    print("\n✅ EVALUATION COMPLETE!")