import { Link } from 'react-router';
import styles from './AdminDashboard.module.css';

export function AdminDashboard() {
  return (
    <div className={styles.container}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, admin! Use the button below to manage users.</p>
      <Link to="/admin/users" className={styles.button}>User Management</Link>
    </div>
  );
}
