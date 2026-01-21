import React from 'react';
import { Activity, LogOut, Settings, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../common/Button/Button';
import styles from './Header.module.css';

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

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
        
        {user && (
          <div className={styles.actions}>
            <button className={styles.iconButton}>
              <Bell size={20} />
            </button>
            <button className={styles.iconButton}>
              <Settings size={20} />
            </button>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Welcome, {user.name}</span>
              <span className={styles.userRole}>{user.role}</span>
            </div>
            <Button variant="ghost" onClick={logout}>
              <LogOut size={16} />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;