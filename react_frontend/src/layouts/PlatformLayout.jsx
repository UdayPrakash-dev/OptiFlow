import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React, { useState } from 'react';

import { Bell } from "lucide-react";

import { platformNav } from '../config/nav/platform.nav';

//importing the custom CSS module
import styles from './PlatformLayout.module.css';

function PlatformLayout() {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  //arrow function to toggle Sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <aside
        className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded
          }`}
      >
        <div className={styles.sidebarHeader}>
          {/* sidebar expanding and closing */}
          {!sidebarCollapsed && <div>OptiFlow Platform Admin</div>}
          <button className={styles.toggleBtn} onClick={toggleSidebar}>
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        {/*map list for items in Navbar of platform admin */}
        <nav>
          <ul className={styles.navList}>
            {platformNav.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  <span className={styles.iconBadge}>{item.label.slice(0, 2).toUpperCase()}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>

            ))}
          </ul>
        </nav>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.badge}>
              Platform Admin Console
            </span>
          </div>

          <div className={styles.topbarActions}>
            <button className={styles.toggleBtn} aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={20}></Bell>
             </button> 
            
          </div>

          <div className={styles.userInfo}>
            {/*Handled Edge case properly */}
            <span className={styles.userName}>{user?.fullName || 'Platform Admin'}</span>
            <span className={styles.userEmail}>{user?.email || 'admin@optiflow.io'}</span>
          </div>

          <button className={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </header>

        <main className={styles.contentArea}>
          <Outlet />
        </main>
      </div>

    </div>
  );
}

export default PlatformLayout;
