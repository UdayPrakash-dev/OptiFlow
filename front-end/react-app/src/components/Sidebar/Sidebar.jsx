import styles from './Sidebar.module.css';

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.logo}>OfficeSync</h2>

      <nav className={styles.navigation}>
        <a className={styles.link} href="#dashboard">Dashboard</a>
        <a className={styles.link} href="#projects">Projects</a>
        <a className={styles.link} href="#tasks">Tasks</a>
      </nav>
    </aside>
  );
}

export default Sidebar;


