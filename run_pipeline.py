#!/usr/bin/env python3
"""
Healthcare Risk ML Pipeline Runner
Orchestrates all pipeline steps from data processing to model optimization.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent
SRC_DIR = PROJECT_ROOT / 'src'

# Define pipeline steps
PIPELINE_STEPS = [
    ('01_create_curated_dataset.py', 'Creating curated dataset'),
    ('02_feature_engineering.py', 'Performing feature engineering'),
    ('03_create_targets.py', 'Creating target variables'),
    ('04_train_models.py', 'Training models'),
    ('05_shap_explainer.py', 'Generating SHAP explanations'),
    ('06_roi_calculator.py', 'Calculating ROI metrics'),
    ('07_model_comparison_and_optimization.py', 'Comparing and optimizing models'),
    ('08_roi_with_best_models.py', 'Calculating ROI with best models'),
    ('09_final_hyperparameter_tuning.py', 'Final hyperparameter tuning'),
]


def run_script(script_name: str, description: str) -> bool:
    """
    Run a single pipeline script.
    
    Args:
        script_name: Name of the script to run
        description: Description of what the script does
        
    Returns:
        True if successful, False otherwise
    """
    script_path = SRC_DIR / script_name
    
    if not script_path.exists():
        logger.error(f"Script not found: {script_path}")
        return False
    
    logger.info(f"{'='*60}")
    logger.info(f"Step: {description}")
    logger.info(f"Running: {script_name}")
    logger.info(f"{'='*60}")
    
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=PROJECT_ROOT,
            check=True,
            capture_output=False
        )
        logger.info(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"✗ {description} failed with exit code {e.returncode}")
        return False
    except Exception as e:
        logger.error(f"✗ Error running {script_name}: {str(e)}")
        return False


def main():
    """Run the complete pipeline."""
    logger.info(f"Starting Healthcare Risk ML Pipeline")
    logger.info(f"Project root: {PROJECT_ROOT}")
    
    failed_steps = []
    successful_steps = []
    
    for script_name, description in PIPELINE_STEPS:
        if run_script(script_name, description):
            successful_steps.append(script_name)
        else:
            failed_steps.append(script_name)
            logger.warning(f"Pipeline halted at step: {script_name}")
            break  # Stop pipeline on first failure
    
    # Print summary
    logger.info(f"\n{'='*60}")
    logger.info("Pipeline Summary")
    logger.info(f"{'='*60}")
    logger.info(f"Successful steps: {len(successful_steps)}/{len(PIPELINE_STEPS)}")
    
    if successful_steps:
        logger.info("Completed:")
        for step in successful_steps:
            logger.info(f"  ✓ {step}")
    
    if failed_steps:
        logger.info("Failed:")
        for step in failed_steps:
            logger.info(f"  ✗ {step}")
        logger.error("Pipeline execution failed")
        return 1
    else:
        logger.info("All pipeline steps completed successfully!")
        return 0


if __name__ == '__main__':
    sys.exit(main())
