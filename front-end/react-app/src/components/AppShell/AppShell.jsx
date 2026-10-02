import Navbar from '../Navbar/Navbar';
import styles from './AppShell.module.css';

function AppShell({ title, actions, children }) {
  return (
    <div className={styles.shell}>
      <Navbar title={title}>{actions}</Navbar>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export default AppShell;
