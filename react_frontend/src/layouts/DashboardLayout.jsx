import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="dashboard-layout">
      <header>TopBar | User: {user?.fullName} ({user?.roleLabel}) <button onClick={logout}>Logout</button></header>
      <div style={{ display: 'flex' }}>
        <aside style={{ width: '200px', borderRight: '1px solid #ccc' }}>Sidebar</aside>
        <main style={{ padding: '20px', flex: 1 }}><Outlet /></main>
      </div>
    </div>
  );
}
