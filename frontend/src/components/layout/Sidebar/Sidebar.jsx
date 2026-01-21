import React from 'react';
import { Home, Upload, AlertTriangle, BarChart3, FileText, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = ({ activePage, onNavigate, isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'upload', label: 'Upload Data', icon: Upload, path: '/upload' },
    { id: 'high-risk', label: 'High-Risk Members', icon: AlertTriangle, path: '/high-risk-members' },
    { id: 'roi', label: 'ROI Tracking', icon: BarChart3, path: '/roi' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
    { id: 'members', label: 'All Members', icon: Users, path: '/members' }
  ];

  const handleMenuItemClick = (item) => {
    onNavigate(item.id);
    navigate(item.path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <nav className={styles.nav}>
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item)}
              className={`${styles.menuItem} ${
                isActive(item.path) ? styles.active : ''
              }`}
              title={isOpen ? '' : item.label}
            >
              <Icon className={styles.icon} />
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;