import React from 'react';
import styles from './StatCard.module.css';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className={`${styles.card} ${styles.loading}`}>
        <span>Loading metric...</span>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
      </div>

      <div className={styles.body}>
        <span className={styles.value}>{value ?? '—'}</span>
        {trend && <span className={styles.trend}>{trend}</span>}
      </div>

      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
};

export default StatCard;
