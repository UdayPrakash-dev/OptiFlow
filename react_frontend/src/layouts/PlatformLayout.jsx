import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function PlatformLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="platform-layout">
      <header>Platform Admin | User: {user?.fullName} <button onClick={logout}>Logout</button></header>
      <div style={{ display: 'flex' }}>
        <aside style={{ width: '200px', borderRight: '1px solid #ccc' }}>Platform Sidebar</aside>
        <main style={{ padding: '20px', flex: 1 }}><Outlet /></main>
      </div>
    </div>
  );
}
