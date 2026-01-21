import React, { useState } from 'react';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import styles from './Layout.module.css';

const Layout = ({ children, activePage, onNavigate, showSidebar = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={styles.layout}>
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`${styles.main} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
        {showSidebar && (
          <Sidebar 
            activePage={activePage} 
            onNavigate={onNavigate}
            isOpen={sidebarOpen}
            onToggle={setSidebarOpen}
          />
        )}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;