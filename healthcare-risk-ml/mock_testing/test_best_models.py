# mock_testing/test_best_models.py

"""
TEST BEST MODELS & ACCURACY REPORTING
======================================

Test the optimized best models selected in step 07 and report accuracy metrics
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.metrics import (
    classification_report, roc_auc_score, accuracy_score,
    precision_score, recall_score, f1_score, confusion_matrix
)
import matplotlib.pyplot as plt
import seaborn as sns

class BestModelsAccuracyTest:
    """Test best models and generate accuracy reports"""
    
    def __init__(self):
        Path('data/output/accuracy').mkdir(parents=True, exist_ok=True)
    
    def load_data_and_models(self):
        """Load test data and best models"""
        print("="*70)
        print("LOADING TEST DATA AND BEST MODELS")
        print("="*70)
        
        # Load test data
        self.X_test = pd.read_csv('data/processed/X_test.csv')
        self.y_30_test = pd.read_csv('data/processed/y_30_test.csv').values.ravel()
        self.y_60_test = pd.read_csv('data/processed/y_60_test.csv').values.ravel()
        self.y_90_test = pd.read_csv('data/processed/y_90_test.csv').values.ravel()
        
        print(f"  ✅ Test set: {self.X_test.shape}")
        print(f"  ✅ 30-day positive rate: {self.y_30_test.mean()*100:.1f}%")
        print(f"  ✅ 60-day positive rate: {self.y_60_test.mean()*100:.1f}%")
        print(f"  ✅ 90-day positive rate: {self.y_90_test.mean()*100:.1f}%\n")
        
        # Load best models
        self.best_models = {}
        for window in ['30_day', '60_day', '90_day']:
            model_path = f'models/best_{window}_model.pkl'
            try:
                model_data = joblib.load(model_path)
                self.best_models[window] = model_data
                print(f"  ✅ Loaded: best_{window}_model.pkl ({model_data['name']})")
            except FileNotFoundError:
                print(f"  ❌ Not found: {model_path}")
        
        print()
    
    def evaluate_window(self, window, y_test):
        """Evaluate best model for a specific window"""
        
        model_data = self.best_models[window]
        model = model_data['model']
        threshold = model_data['threshold']
        model_name = model_data['name']
        
        # Get predictions
        y_pred_proba = model.predict_proba(self.X_test)[:, 1]
        y_pred = (y_pred_proba >= threshold).astype(int)
        
        # Calculate metrics
        auc = roc_auc_score(y_test, y_pred_proba)
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        # Confusion matrix
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        # Top-K metrics
        k_threshold = np.percentile(y_pred_proba, 90)
        top_k_mask = y_pred_proba >= k_threshold
        recall_top10 = y_test[top_k_mask].sum() / y_test.sum() if y_test.sum() > 0 else 0
        precision_top10 = y_test[top_k_mask].sum() / top_k_mask.sum() if top_k_mask.sum() > 0 else 0
        
        return {
            'window': window,
            'model': model_name,
            'threshold': threshold,
            'auc': auc,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'specificity': specificity,
            'recall_top10': recall_top10,
            'precision_top10': precision_top10,
            'tp': tp, 'tn': tn, 'fp': fp, 'fn': fn,
            'y_pred': y_pred,
            'y_pred_proba': y_pred_proba
        }
    
    def test_all_models(self):
        """Test best models for all windows"""
        
        print("="*70)
        print("TESTING BEST MODELS - ACCURACY REPORT")
        print("="*70)
        print()
        
        self.results = []
        
        # 30-day
        result_30 = self.evaluate_window('30_day', self.y_30_test)
        self.results.append(result_30)
        
        print(f"{'30-DAY WINDOW':-^70}")
        print(f"  Model: {result_30['model']} (Threshold: {result_30['threshold']:.3f})")
        print(f"  ├─ ROC-AUC: {result_30['auc']:.4f}")
        print(f"  ├─ Accuracy: {result_30['accuracy']:.2%}")
        print(f"  ├─ Precision: {result_30['precision']:.2%}")
        print(f"  ├─ Recall: {result_30['recall']:.2%}")
        print(f"  ├─ F1-Score: {result_30['f1']:.4f}")
        print(f"  ├─ Specificity: {result_30['specificity']:.2%}")
        print(f"  ├─ Recall@Top10%: {result_30['recall_top10']:.2%}")
        print(f"  └─ Precision@Top10%: {result_30['precision_top10']:.2%}\n")
        
        # 60-day
        result_60 = self.evaluate_window('60_day', self.y_60_test)
        self.results.append(result_60)
        
        print(f"{'60-DAY WINDOW':-^70}")
        print(f"  Model: {result_60['model']} (Threshold: {result_60['threshold']:.3f})")
        print(f"  ├─ ROC-AUC: {result_60['auc']:.4f}")
        print(f"  ├─ Accuracy: {result_60['accuracy']:.2%}")
        print(f"  ├─ Precision: {result_60['precision']:.2%}")
        print(f"  ├─ Recall: {result_60['recall']:.2%}")
        print(f"  ├─ F1-Score: {result_60['f1']:.4f}")
        print(f"  ├─ Specificity: {result_60['specificity']:.2%}")
        print(f"  ├─ Recall@Top10%: {result_60['recall_top10']:.2%}")
        print(f"  └─ Precision@Top10%: {result_60['precision_top10']:.2%}\n")
        
        # 90-day
        result_90 = self.evaluate_window('90_day', self.y_90_test)
        self.results.append(result_90)
        
        print(f"{'90-DAY WINDOW':-^70}")
        print(f"  Model: {result_90['model']} (Threshold: {result_90['threshold']:.3f})")
        print(f"  ├─ ROC-AUC: {result_90['auc']:.4f}")
        print(f"  ├─ Accuracy: {result_90['accuracy']:.2%}")
        print(f"  ├─ Precision: {result_90['precision']:.2%}")
        print(f"  ├─ Recall: {result_90['recall']:.2%}")
        print(f"  ├─ F1-Score: {result_90['f1']:.4f}")
        print(f"  ├─ Specificity: {result_90['specificity']:.2%}")
        print(f"  ├─ Recall@Top10%: {result_90['recall_top10']:.2%}")
        print(f"  └─ Precision@Top10%: {result_90['precision_top10']:.2%}\n")
    
    def generate_detailed_reports(self):
        """Generate detailed classification reports"""
        
        print("="*70)
        print("DETAILED CLASSIFICATION REPORTS")
        print("="*70)
        print()
        
        windows = ['30_day', '60_day', '90_day']
        y_tests = [self.y_30_test, self.y_60_test, self.y_90_test]
        
        for result, window, y_test in zip(self.results, windows, y_tests):
            print(f"\n{window.upper()} - {result['model'].upper()}")
            print("-"*70)
            print(classification_report(y_test, result['y_pred'], 
                                       target_names=['No Deterioration', 'Deterioration']))
    
    def plot_accuracy_metrics(self):
        """Generate accuracy comparison visualizations"""
        
        print("\n" + "="*70)
        print("GENERATING ACCURACY VISUALIZATIONS")
        print("="*70 + "\n")
        
        # Create metrics dataframe
        metrics_data = []
        for result in self.results:
            metrics_data.append({
                'Window': result['window'].replace('_', '-'),
                'AUC': result['auc'],
                'Accuracy': result['accuracy'],
                'Precision': result['precision'],
                'Recall': result['recall'],
                'F1-Score': result['f1']
            })
        
        df_metrics = pd.DataFrame(metrics_data)
        
        # 1. Accuracy Metrics Comparison
        fig, ax = plt.subplots(figsize=(12, 6))
        
        metrics_to_plot = ['AUC', 'Accuracy', 'Precision', 'Recall', 'F1-Score']
        x = np.arange(len(df_metrics))
        width = 0.15
        
        for i, metric in enumerate(metrics_to_plot):
            offset = width * (i - 2)
            ax.bar(x + offset, df_metrics[metric], width, label=metric, alpha=0.8)
        
        ax.set_xlabel('Prediction Window', fontsize=12, fontweight='bold')
        ax.set_ylabel('Score', fontsize=12, fontweight='bold')
        ax.set_title('Best Models Accuracy Metrics Comparison', fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(df_metrics['Window'])
        ax.legend(loc='lower right')
        ax.grid(axis='y', alpha=0.3)
        ax.set_ylim([0, 1])
        
        plt.tight_layout()
        plt.savefig('data/output/accuracy/accuracy_metrics.png', dpi=150)
        plt.close()
        print("  ✅ Saved: accuracy_metrics.png")
        
        # 2. Confusion Matrices
        fig, axes = plt.subplots(1, 3, figsize=(15, 4))
        
        for idx, result in enumerate(self.results):
            ax = axes[idx]
            cm = np.array([[result['tn'], result['fp']], 
                          [result['fn'], result['tp']]])
            
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax, 
                       cbar=False, xticklabels=['No Event', 'Event'],
                       yticklabels=['No Event', 'Event'])
            
            ax.set_title(f"{result['window'].replace('_', '-')} - {result['model']}")
            ax.set_ylabel('True Label')
            ax.set_xlabel('Predicted Label')
        
        plt.tight_layout()
        plt.savefig('data/output/accuracy/confusion_matrices.png', dpi=150)
        plt.close()
        print("  ✅ Saved: confusion_matrices.png")
        
        # 3. Top-K Metrics
        top_k_data = []
        for result in self.results:
            top_k_data.append({
                'Window': result['window'].replace('_', '-'),
                'Recall@Top10%': result['recall_top10'],
                'Precision@Top10%': result['precision_top10']
            })
        
        df_top_k = pd.DataFrame(top_k_data)
        
        fig, ax = plt.subplots(figsize=(10, 6))
        
        x = np.arange(len(df_top_k))
        width = 0.35
        
        ax.bar(x - width/2, df_top_k['Recall@Top10%'], width, label='Recall@Top10%', alpha=0.8)
        ax.bar(x + width/2, df_top_k['Precision@Top10%'], width, label='Precision@Top10%', alpha=0.8)
        
        ax.set_xlabel('Prediction Window', fontsize=12, fontweight='bold')
        ax.set_ylabel('Score', fontsize=12, fontweight='bold')
        ax.set_title('Top-10% Metrics Comparison', fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(df_top_k['Window'])
        ax.legend()
        ax.grid(axis='y', alpha=0.3)
        ax.set_ylim([0, 1])
        
        plt.tight_layout()
        plt.savefig('data/output/accuracy/top_k_metrics.png', dpi=150)
        plt.close()
        print("  ✅ Saved: top_k_metrics.png")
    
    def save_accuracy_report(self):
        """Save accuracy report to text file"""
        
        print("\n" + "="*70)
        print("SAVING ACCURACY REPORT")
        print("="*70 + "\n")
        
        report = []
        report.append("="*70)
        report.append("BEST MODELS ACCURACY TEST REPORT")
        report.append("="*70)
        report.append("")
        
        report.append("TEST DATASET")
        report.append("-"*70)
        report.append(f"Total samples: 3,000")
        report.append(f"30-day positive rate: {self.y_30_test.mean()*100:.1f}%")
        report.append(f"60-day positive rate: {self.y_60_test.mean()*100:.1f}%")
        report.append(f"90-day positive rate: {self.y_90_test.mean()*100:.1f}%")
        report.append("")
        
        for result in self.results:
            window_name = result['window'].replace('_', '-').upper()
            report.append(f"{window_name} MODEL")
            report.append("-"*70)
            report.append(f"Model: {result['model']}")
            report.append(f"Optimal Threshold: {result['threshold']:.3f}")
            report.append("")
            report.append("Metrics:")
            report.append(f"  • ROC-AUC: {result['auc']:.4f}")
            report.append(f"  • Accuracy: {result['accuracy']:.2%}")
            report.append(f"  • Precision: {result['precision']:.2%}")
            report.append(f"  • Recall (Sensitivity): {result['recall']:.2%}")
            report.append(f"  • Specificity: {result['specificity']:.2%}")
            report.append(f"  • F1-Score: {result['f1']:.4f}")
            report.append("")
            report.append("Confusion Matrix:")
            report.append(f"  • True Positives: {result['tp']}")
            report.append(f"  • True Negatives: {result['tn']}")
            report.append(f"  • False Positives: {result['fp']}")
            report.append(f"  • False Negatives: {result['fn']}")
            report.append("")
            report.append("Top-10% Metrics:")
            report.append(f"  • Recall@Top10%: {result['recall_top10']:.2%}")
            report.append(f"  • Precision@Top10%: {result['precision_top10']:.2%}")
            report.append("")
        
        report.append("="*70)
        report.append("INTERPRETATION")
        report.append("="*70)
        report.append("")
        report.append("• AUC (0.0-1.0): Higher is better - measures discrimination ability")
        report.append("• Accuracy: Percentage of correct predictions overall")
        report.append("• Precision: Of positive predictions, how many were correct")
        report.append("• Recall (Sensitivity): Of actual positives, how many were caught")
        report.append("• Specificity: Of actual negatives, how many were correctly identified")
        report.append("• F1-Score: Harmonic mean of precision and recall")
        report.append("• Recall@Top10%: Can we capture deteriorating patients in top 10%?")
        report.append("• Precision@Top10%: How many flagged in top 10% actually deteriorate?")
        report.append("")
        
        report_text = '\n'.join(report)
        with open('data/output/accuracy/accuracy_report.txt', 'w') as f:
            f.write(report_text)
        
        print(report_text)
        print("\n  ✅ Saved: accuracy_report.txt")
    
    def run_full_test(self):
        """Execute complete accuracy test pipeline"""
        self.load_data_and_models()
        self.test_all_models()
        self.generate_detailed_reports()
        self.plot_accuracy_metrics()
        self.save_accuracy_report()

# ============================================
# MAIN EXECUTION
# ============================================

if __name__ == "__main__":
    tester = BestModelsAccuracyTest()
    tester.run_full_test()
    
    print("\n" + "="*70)
    print("✅ BEST MODELS ACCURACY TEST COMPLETE!")
    print("="*70)
    print("\nGenerated outputs:")
    print("  📊 data/output/accuracy/accuracy_metrics.png")
    print("  📊 data/output/accuracy/confusion_matrices.png")
    print("  📊 data/output/accuracy/top_k_metrics.png")
    print("  📄 data/output/accuracy/accuracy_report.txt")
    print("\n🎯 All best models tested and accuracy metrics saved!")
