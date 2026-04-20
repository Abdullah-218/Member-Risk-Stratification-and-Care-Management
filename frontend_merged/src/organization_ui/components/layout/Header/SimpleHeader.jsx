import React from 'react';
import { Activity, Menu, LogOut, Upload, Download } from 'lucide-react';
import Button from '../../common/Button/Button';
import { logout } from "../../../utils/auth";
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

const SimpleHeader = ({ onToggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleUpload = () => {
    navigate('/org/upload');
  };

  const handleExport = () => {
    // Export functionality - you can implement this based on what data you want to export
    const data = {
      timestamp: new Date().toISOString(),
      message: 'Export functionality would be implemented here'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthcare-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          {onToggleSidebar && (
            <button
              className={styles.sidebarToggle}
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
          )}
          <Activity className={styles.logo} />
          <h1 className={styles.title}>HealthGuard AI</h1>
        </div>

        <div className={styles.actions}>
          <div className={styles.userInfo}>
            <span>Organization Dashboard</span>
          </div>
          <Button
            variant="secondary"
            onClick={handleUpload}
            className={styles.actionButton}
          >
            <Upload size={16} style={{ marginRight: '8px' }} />
            Upload
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            className={styles.actionButton}
          >
            <Download size={16} style={{ marginRight: '8px' }} />
            Export
          </Button>
          <Button
            variant="secondary"
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            <LogOut size={16} style={{ marginRight: '8px' }} />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
