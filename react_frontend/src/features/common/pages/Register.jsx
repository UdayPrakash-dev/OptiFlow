import React, { useState, useEffect } from 'react';
import { PATHS } from '../../../app/paths';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/api/client';

export default function Register() {
  // --- 1. Wizard Step State ---
  const [step, setStep] = useState(1);

  // --- 2. Step 1 State (Registration Details) ---
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [companyLegalName, setCompanyLegalName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [planId, setPlanId] = useState('');
  
  // Data fetched from backend
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState('');

  // --- 3. Step 2 State (Fake Payment Details) ---
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const navigate = useNavigate();

  // Fetch Public Plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiClient('/auth/public-plans');
        setAvailablePlans(response);
        if (response.length > 0) setPlanId(response[0].id);
      } catch (err) {
        setError("Could not load pricing plans.");
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // --- Handle Transition to Step 2 ---
  const handleContinueToPayment = (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    
    // Move to payment screen
    setStep(2);
  };

  // --- Handle Final Submission & Payment ---
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessingPayment(true);

    try {
      // 1. Fake 2-second payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Build the payload for our actual backend registration
      const payload = {
        companyLegalName,
        ownerFullName,
        ownerEmail,
        password,
        planId,
        billingCycle
      };

      // 3. Call the real backend
      const response = await apiClient('/auth/register-company', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // 4. Save token and redirect
      sessionStorage.setItem('authToken', response.token);
      sessionStorage.setItem('isPlatform', 'false');
      
      // Fix for the back button: reset the processing state before we leave!
      setIsProcessingPayment(false);

      // Force reload to root. RoleRedirect will bounce the new company_owner to Executive Dashboard
      window.location.href = '/'; 

    } catch (err) {
      setError(err.message || 'Payment or Registration failed. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  // Calculate fake price for the UI based on selected cycle
  const priceDisplay = billingCycle === 'YEARLY' ? '$990.00' : '$99.00';

  return (
    <div className="min-h-screen bg-[#f0f4ff] flex flex-col font-sans py-8">
      <header className="flex justify-between items-center px-8 pb-6 max-w-7xl mx-auto w-full">
        <div className="text-xl font-bold text-gray-800">OfficeSync</div>
        <nav className="space-x-6">
          <Link to="/" className="text-gray-800 font-medium hover:text-blue-600">Home</Link>
          <Link to="/contact" className="text-gray-800 font-medium hover:text-blue-600">Contact</Link>
        </nav>
      </header>

      <main className="flex-1 flex justify-center items-center px-4">
        <div className="bg-white p-10 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.05)] w-full max-w-[600px] transition-all">
          
          <div className="text-center mb-8">
            <p className="uppercase text-xs text-blue-600 font-bold tracking-wider mb-2">
              Step {step} of 2
            </p>
            <h1 className="text-2xl text-gray-900 font-bold">
              {step === 1 ? 'Register your company' : 'Secure Payment'}
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm text-center font-medium">
              {error}
            </div>
          )}


          {step === 1 && (
            <form className="space-y-5 animate-in fade-in zoom-in-95 duration-300" onSubmit={handleContinueToPayment}>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Your Full Name</label>
                <input type="text" required value={ownerFullName} onChange={(e) => setOwnerFullName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Work Email</label>
                  <input type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="name@company.com" className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Company Legal Name</label>
                  <input type="text" required value={companyLegalName} onChange={(e) => setCompanyLegalName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Subscription Plan</label>
                  <select value={planId} onChange={(e) => setPlanId(e.target.value)} disabled={loadingPlans} className="w-full p-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600">
                    {loadingPlans ? <option>Loading plans...</option> : availablePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Billing Cycle</label>
                  <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600">
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly (Save 20%)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                  <input type="password" required minLength="8" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                  <input type="password" required minLength="8" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
                </div>
              </div>

              <button type="submit" disabled={loadingPlans} className="w-full p-3.5 mt-6 bg-blue-600 text-white rounded-md text-base font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                Continue to Payment &rarr;
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-5 animate-in slide-in-from-right-8 duration-300" onSubmit={handleProcessPayment}>
              
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg mb-6 flex justify-between items-center shadow-inner">
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Total due today</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {priceDisplay}
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-12 h-8 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-blue-800 italic">VISA</span>
                  </div>
                  <div className="w-12 h-8 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-red-500">MC</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Name on Card</label>
                <input type="text" required value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="John Doe" className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Card Number</label>
                <input type="text" required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" maxLength="19" className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-mono tracking-widest" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Expiry</label>
                  <input type="text" required value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength="5" className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-center" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">CVC</label>
                  <input type="password" required value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123" maxLength="4" className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-center tracking-widest" />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  disabled={isProcessingPayment}
                  className="w-1/3 p-3.5 bg-slate-100 text-slate-700 rounded-md text-base font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  &larr; Back
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessingPayment}
                  className="w-2/3 p-3.5 bg-green-600 text-white rounded-md text-base font-semibold hover:bg-green-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Processing...
                    </>
                  ) : (
                    'Pay & Register'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer Link */}
          {step === 1 && (
            <div className="text-center mt-6 text-sm text-gray-500">
              Already have an account? <Link to={PATHS.PUBLIC.LOGIN} className="text-blue-600 font-semibold hover:underline">Sign in instead</Link>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
