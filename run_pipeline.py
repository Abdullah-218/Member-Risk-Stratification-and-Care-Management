import subprocess
import sys

def run_script(script_name):
    """Run a Python script and handle errors"""
    print(f"\n{'='*60}")
    print(f"Running: {script_name}")
    print(f"{'='*60}\n")
    
    result = subprocess.run([sys.executable, f'src/{script_name}'], 
                          capture_output=False)
    
    if result.returncode != 0:
        print(f"\n❌ Error in {script_name}")
        sys.exit(1)
    
    print(f"\n✅ {script_name} completed successfully")

def main():
    """Run complete pipeline"""
    print("="*60)
    print("HEALTHCARE RISK STRATIFICATION - ML PIPELINE")
    print("="*60)
    
    scripts = [
        '01_data_loading.py',
        '02_feature_engineering.py',
        '03_target_creation.py',
        '04_model_training.py',
        '05_shap_explainer.py',
        '06_model_evaluation.py'
    ]
    
    for script in scripts:
        run_script(script)
    
    print("\n" + "="*60)
    print("✅ COMPLETE ML PIPELINE FINISHED!")
    print("="*60)
    print("\nOutputs:")
    print("  Models: models/")
    print("  Visualizations: data/output/")
    print("  Report: data/output/evaluation_report.md")

if __name__ == "__main__":
    main()