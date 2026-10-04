import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

/**
 * Reusable Sidebar component
 * @param {Array} navItems - Navigation links array [{ label, path, icon }]
 * @param {string} title - Workspace or platform brand title
 */
export const Sidebar = ({ navItems = [], title = 'OptiFlow' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <aside
      className={`${styles.sidebar} ${
        collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded
      }`}
    >
      {/* Brand Header */}
      <div className={styles.sidebarHeader}>
        {!collapsed && (
          <div className={styles.brandWrapper}>
            <div className={styles.logoBadge}>OF</div>
            <span className={styles.brandTitle}>{title}</span>
          </div>
        )}

        <button
          className={styles.toggleBtn}
          onClick={toggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {/* Navigation List */}
      <nav className={styles.navContainer}>
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li
              key={item.path}
              className={styles.navItem}
              onMouseEnter={() => collapsed && setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <div className={styles.iconBadge}>
                  {item.label.slice(0, 2).toUpperCase()}
                </div>
                {!collapsed && <span className={styles.linkLabel}>{item.label}</span>}
              </NavLink>

              {/* Tooltip when collapsed */}
              {collapsed && hoveredItem === item.path && (
                <div className={styles.tooltip}>{item.label}</div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;