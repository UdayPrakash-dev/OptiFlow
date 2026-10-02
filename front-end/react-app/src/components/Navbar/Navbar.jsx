import styles from './Navbar.module.css';

function Navbar({ title }) {
  return (
    <header className={styles.navbar}>
      <h1 className={styles.title}>{title}</h1>
      <button className={styles.bellButton} type="button" aria-label="Notifications">
        🔔
      </button>
    </header>
  );
}

export default Navbar;
