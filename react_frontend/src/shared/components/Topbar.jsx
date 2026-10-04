import React from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Topbar.module.css';

/**
 * Reusable Topbar component
 * @param {Object} props
 * @param {string} [props.title] - Optional title or breadcrumb context
 * @param {Function} [props.onNotificationClick] - Optional notification bell handler
 */
export const Topbar = ({ title, onNotificationClick }) => {
  const { user, logout } = useAuth();

  // Format role string (e.g. 'project_manager' -> 'Project Manager')
  const formattedRole = user?.role
    ? user.role.replace(/_/g, ' ')
    : 'User';

  return (
    <header className={styles.topbar}>
      {/* Left: Role / Title badge */}
      <div className={styles.leftSection}>
        <span className={styles.badge}>
          <span className={styles.roleDot}></span>
          {title || formattedRole}
        </span>
      </div>

      {/* Right: Notifications, User Info, Logout */}
      <div className={styles.topbarActions}>
        {/* Notification Bell */}
        <button
          type="button"
          className={styles.notificationBtn}
          onClick={onNotificationClick}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={20} />
          <span className={styles.bellDot}></span>
        </button>

        {/* User Details */}
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user?.fullName || 'User'}</span>
          <span className={styles.userEmail}>{user?.email || 'user@optiflow.io'}</span>
        </div>

        {/* Logout Control */}
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={logout}
          title="Log out of session"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
