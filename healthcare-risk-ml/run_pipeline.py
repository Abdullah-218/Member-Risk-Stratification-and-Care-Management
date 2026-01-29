# run_pipeline.py

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
EVALUATION_DIR = PROJECT_ROOT / 'evaluation'
DATA_DIR = PROJECT_ROOT / 'data'
MODELS_DIR = PROJECT_ROOT / 'models'

# Ensure data and models directories exist
DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / 'raw').mkdir(exist_ok=True)
(DATA_DIR / 'processed').mkdir(exist_ok=True)
(DATA_DIR / 'output').mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

# Define pipeline steps: (folder, script_name, description)
PIPELINE_STEPS = [
    # Data preparation steps (src/)
    (SRC_DIR, '01_create_curated_dataset.py', 'Creating curated dataset'),
    (SRC_DIR, '02_feature_engineering.py', 'Performing feature engineering'),
    (SRC_DIR, '03_create_targets.py', 'Creating target variables'),
    (SRC_DIR, '04_model_train_test.py', 'Training and testing models'),
    
    # Evaluation and analysis steps (evaluation/)
    (EVALUATION_DIR, '01_shap_explainer.py', 'Generating SHAP explanations'),
    (EVALUATION_DIR, '02_roi_calculation.py', 'Calculating ROI metrics'),
]


def run_script(script_folder: Path, script_name: str, description: str) -> bool:
    """
    Run a single pipeline script.
    
    Args:
        script_folder: Folder containing the script (src/ or evaluation/)
        script_name: Name of the script to run
        description: Description of what the script does
        
    Returns:
        True if successful, False otherwise
    """
    script_path = script_folder / script_name
    
    if not script_path.exists():
        logger.error(f"Script not found: {script_path}")
        return False
    
    logger.info(f"{'='*60}")
    logger.info(f"Step: {description}")
    logger.info(f"Running: {script_name}")
    logger.info(f"Location: {script_folder.name}/")
    logger.info(f"{'='*60}")
    
    # Use the project's virtual environment Python
    venv_python = PROJECT_ROOT / 'hackathon_dept' / 'bin' / 'python'
    python_executable = str(venv_python) if venv_python.exists() else sys.executable
    
    try:
        result = subprocess.run(
            [python_executable, str(script_path)],
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
    logger.info(f"Source directory: {SRC_DIR}")
    logger.info(f"Evaluation directory: {EVALUATION_DIR}")
    logger.info(f"Data directory: {DATA_DIR}")
    logger.info(f"Models directory: {MODELS_DIR}")
    
    failed_steps = []
    successful_steps = []
    
    for script_folder, script_name, description in PIPELINE_STEPS:
        if run_script(script_folder, script_name, description):
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
