"""
Utility functions for Healthcare Risk ML Pipeline
Provides common functionality for data loading, logging, and file operations.
"""

import logging
import sys
from pathlib import Path
from typing import Optional, Tuple
import pandas as pd
from config import PROJECT_ROOT, create_directories

# Configure logging for scripts
def setup_logging(script_name: str, log_file: Optional[str] = None) -> logging.Logger:
    """
    Setup logging for a script.
    
    Args:
        script_name: Name of the script (for logger identification)
        log_file: Optional log file path. If None, uses script_name.log
        
    Returns:
        Configured logger instance
    """
    if log_file is None:
        log_file = f"{script_name}.log"
    
    logger = logging.getLogger(script_name)
    logger.setLevel(logging.DEBUG)
    
    # File handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger


def load_csv(file_path: Path, logger: Optional[logging.Logger] = None, **kwargs) -> pd.DataFrame:
    """
    Load a CSV file with error handling.
    
    Args:
        file_path: Path to CSV file
        logger: Optional logger instance
        **kwargs: Additional arguments to pass to pd.read_csv()
        
    Returns:
        Loaded DataFrame
        
    Raises:
        FileNotFoundError: If file doesn't exist
        pd.errors.ParserError: If file can't be parsed
    """
    file_path = Path(file_path)
    
    if not file_path.exists():
        error_msg = f"File not found: {file_path}"
        if logger:
            logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    
    try:
        df = pd.read_csv(file_path, **kwargs)
        if logger:
            logger.info(f"Loaded {file_path.name}: {df.shape[0]} rows, {df.shape[1]} columns")
        return df
    except pd.errors.ParserError as e:
        error_msg = f"Error parsing {file_path}: {str(e)}"
        if logger:
            logger.error(error_msg)
        raise


def save_csv(df: pd.DataFrame, file_path: Path, logger: Optional[logging.Logger] = None, 
             **kwargs) -> Path:
    """
    Save a DataFrame to CSV with error handling.
    
    Args:
        df: DataFrame to save
        file_path: Path where to save the CSV
        logger: Optional logger instance
        **kwargs: Additional arguments to pass to df.to_csv()
        
    Returns:
        Path to saved file
        
    Raises:
        IOError: If file can't be written
    """
    file_path = Path(file_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # Don't include index by default unless specified
        if 'index' not in kwargs:
            kwargs['index'] = False
        
        df.to_csv(file_path, **kwargs)
        if logger:
            logger.info(f"Saved {file_path.name}: {df.shape[0]} rows, {df.shape[1]} columns")
        return file_path
    except IOError as e:
        error_msg = f"Error saving {file_path}: {str(e)}"
        if logger:
            logger.error(error_msg)
        raise


def verify_file_exists(file_path: Path, description: str = "", 
                       logger: Optional[logging.Logger] = None) -> bool:
    """
    Verify that a file exists and log status.
    
    Args:
        file_path: Path to verify
        description: Description of what the file is
        logger: Optional logger instance
        
    Returns:
        True if file exists, False otherwise
    """
    file_path = Path(file_path)
    exists = file_path.exists()
    
    if exists:
        if logger:
            msg = f"✓ {description or file_path.name} exists"
            logger.info(msg)
    else:
        if logger:
            msg = f"✗ {description or file_path.name} not found: {file_path}"
            logger.error(msg)
    
    return exists


def verify_multiple_files(file_paths: list, logger: Optional[logging.Logger] = None) -> Tuple[bool, list]:
    """
    Verify multiple files exist.
    
    Args:
        file_paths: List of file paths to verify
        logger: Optional logger instance
        
    Returns:
        Tuple of (all_exist: bool, missing_files: list)
    """
    missing_files = []
    
    for file_path in file_paths:
        if not Path(file_path).exists():
            missing_files.append(file_path)
            if logger:
                logger.error(f"Missing file: {file_path}")
    
    all_exist = len(missing_files) == 0
    
    if all_exist and logger:
        logger.info(f"✓ All {len(file_paths)} required files found")
    elif logger:
        logger.warning(f"✗ {len(missing_files)} required files missing")
    
    return all_exist, missing_files


def get_script_info() -> Tuple[str, Path]:
    """
    Get information about the calling script.
    
    Returns:
        Tuple of (script_name, script_path)
    """
    script_path = Path(sys.argv[0]).resolve()
    script_name = script_path.stem
    return script_name, script_path


def print_header(title: str, width: int = 60):
    """Print a formatted header."""
    print(f"\n{'='*width}")
    print(f"{title.center(width)}")
    print(f"{'='*width}\n")


def print_section(title: str, width: int = 60):
    """Print a formatted section title."""
    print(f"\n{'-'*width}")
    print(f"{title}")
    print(f"{'-'*width}")


# Example template for new scripts
SCRIPT_TEMPLATE = '''
"""
Script Template for Healthcare Risk ML Pipeline
"""

import sys
from pathlib import Path
from config import (
    PROJECT_ROOT, create_directories, 
    # Import paths you need:
    # PROCESSED_DATA_DIR, OUTPUT_DIR, MODELS_DIR, etc.
)
from utils import setup_logging, load_csv, save_csv, verify_file_exists

# Setup logging
script_name, script_path = Path(sys.argv[0]).stem, Path(sys.argv[0])
logger = setup_logging(script_name)

def main():
    """Main script logic."""
    
    # Ensure all directories exist
    create_directories()
    
    logger.info(f"Starting {script_name}")
    logger.info(f"Project root: {PROJECT_ROOT}")
    
    try:
        # Your code here
        logger.info(f"Completed successfully")
        return 0
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return 1

if __name__ == '__main__':
    sys.exit(main())
'''
