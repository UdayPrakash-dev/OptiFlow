import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { PATHS } from '../../../app/paths';
import { Link, useNavigate } from 'react-router-dom';

export default function PlatformLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { platformLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await platformLogin({ email, password });
      navigate('/'); 
    } catch (err) {
      setError(err.message || 'Platform login failed. Access denied.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert("Please contact the Database Administrator to reset Platform credentials.");
  };

  return (
    // Reverted to a clean, professional background (slate-50 instead of the standard blue)
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      <main className="flex-1 flex justify-center items-center p-8">
        {/* Standard white card, but with a subtle top border accent to indicate Admin */}
        <div className="bg-white p-10 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.05)] w-full max-w-[480px] border-t-4 border-slate-800">
          
          <div className="text-center mb-8">
            <p className="uppercase text-xs text-slate-500 font-bold tracking-wider mb-2">
              OfficeSync Platform
            </p>
            <h1 className="text-2xl text-slate-900 font-bold">
              Administrator Login
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full p-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Admin Password
                </label>
                <button 
                  onClick={handleForgotPassword}
                  type="button" 
                  className="text-xs text-slate-500 hover:text-slate-700 hover:underline transition-colors focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 pr-10 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              // Twist: Using a very dark slate color instead of bright blue for the admin button
              className="w-full p-3.5 mt-6 bg-slate-800 text-white rounded-md text-base font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm">
            <Link to={PATHS.PUBLIC.LOGIN} className="text-slate-500 hover:text-slate-800 font-medium transition-colors">
              &larr; Return to Standard Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
