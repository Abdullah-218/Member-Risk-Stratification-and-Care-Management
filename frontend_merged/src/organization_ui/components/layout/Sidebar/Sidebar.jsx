import React, { useState, useMemo } from 'react';
import { Home, Upload, AlertTriangle, BarChart3, FileText, Users, Building2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMembers } from '../../../context/MemberContext';
import styles from './Sidebar.module.css';

const Sidebar = ({ activePage, onNavigate, isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { members } = useMembers();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/org/dashboard' },
    { id: 'upload', label: 'Upload Data', icon: Upload, path: '/org/upload' },
    { id: 'departments', label: 'Departments', icon: Building2, path: '/org/departments' },
    { id: 'high-risk', label: 'High-Risk Members', icon: AlertTriangle, path: '/org/high-risk-members' },
    { id: 'roi', label: 'ROI Tracking', icon: BarChart3, path: '/org/roi' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/org/reports' },
    { id: 'members', label: 'All Members', icon: Users, path: '/org/members' }
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
              className={`${styles.menuItem} ${isActive(item.path) ? styles.active : ''
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