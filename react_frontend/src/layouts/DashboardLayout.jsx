import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNavForRole } from '../config/nav';
import { Sidebar } from '../shared/components/Sidebar';
export default function DashboardLayout() {
  const { user, logout } = useAuth();

  //comment added by Uday
  //gets nav-items dynamically for user based on role
  const navItems = getNavForRole(user?.role);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Retractable Sidebar */}
      <Sidebar navItems={navItems} title="OptiFlow" />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
          <div className="text-sm font-medium">
            Logged in as: <span className="font-semibold">{user?.fullName || 'User'}</span> ({user?.role || 'team_member'})
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-lg border transition-colors dark:bg-slate-800 dark:border-slate-700"
          >
            Logout
          </button>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
