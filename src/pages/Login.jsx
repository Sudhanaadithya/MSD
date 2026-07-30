import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessType, setAccessType] = useState('customer'); // 'customer' | 'employee'
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const data = await login(email, password);
      const userRole = (data?.user?.user_metadata?.role || accessType).toLowerCase();
      addToast(`Authenticated successfully as ${data?.user?.user_metadata?.role || accessType}`, 'success', 'Command Station Active');

      if (userRole === 'customer') {
        navigate('/customer/equipment');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      const msg = err.message || 'Invalid email or password. Please try again.';
      setErrorMsg(msg);
      addToast(msg, 'error', 'Authentication Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col lg:flex-row items-stretch overflow-hidden bg-surface font-body-md text-on-surface">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105" 
          style={{ backgroundImage: "url('/bg_industrial.png')" }}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* Content Area (Left side on Desktop) */}
      <div className="relative z-10 w-full lg:w-3/5 xl:w-2/3 flex flex-col justify-end lg:justify-between p-gutter lg:p-xl min-h-[40vh] lg:min-h-screen">
        <div className="hidden lg:block">
          <span className="font-label-bold text-surface-white/20 text-xl tracking-[0.5em] [writing-mode:vertical-rl] absolute top-12 right-12">
            SMART RENTAL TRACKING
          </span>
        </div>
        <div className="max-w-xl">
          <div className="flex items-center gap-xs mb-4">
            <div className="h-1 w-12 bg-primary"></div>
            <span className="font-label-bold text-surface-white tracking-widest uppercase">Heavy Duty Operations</span>
          </div>
          <h1 className="font-display-lg text-surface-white mb-4 leading-tight">
            BUILDING THE <br/>FUTURE OF FLEET.
          </h1>
          <p className="font-body-lg text-surface-white/90 max-w-md">
            Uncompromising clarity for the high-stakes world of heavy machinery and industrial logistics.
          </p>
        </div>
      </div>

      {/* Login Interface (Right side on Desktop) */}
      <div className="relative z-20 w-full lg:w-2/5 xl:w-1/3 bg-surface min-h-screen lg:min-h-full flex flex-col items-center justify-center px-gutter lg:px-xl py-xl shadow-2xl">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="mb-xl">
            <div className="inline-flex items-center justify-center p-base bg-primary mb-lg rounded-lg shadow-md">
              <span className="material-symbols-outlined text-on-primary-fixed text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
            </div>
            <h2 className="font-headline-lg text-on-surface mb-base">Command Center</h2>
            <p className="font-body-md text-secondary">Enter your credentials to manage your site fleet.</p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-lg p-md bg-error/10 border-l-4 border-error text-error text-sm rounded-r flex items-center gap-sm">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="flex flex-col gap-lg" onSubmit={handleLogin}>
            <div className="flex border-b border-outline-variant mb-4">
              <button 
                className={`flex-1 py-2 font-label-bold uppercase tracking-wider ${accessType === 'customer' ? 'text-primary border-b-2 border-primary' : 'text-outline hover:text-on-surface'}`} 
                type="button"
                onClick={() => setAccessType('customer')}
              >
                Customer Access
              </button>
              <button 
                className={`flex-1 py-2 font-label-bold uppercase tracking-wider ${accessType === 'employee' ? 'text-primary border-b-2 border-primary' : 'text-outline hover:text-on-surface'}`} 
                type="button"
                onClick={() => setAccessType('employee')}
              >
                Caterpillar Employee
              </button>
            </div>
            
            <div className="flex flex-col gap-xs">
              <label className={`font-label-bold ${emailFocus ? 'text-primary' : 'text-on-surface-variant'}`} htmlFor="email">EMAIL ADDRESS</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-on-surface transition-colors">mail</span>
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-surface-white border-2 border-outline-variant rounded-lg font-body-md focus:border-on-surface focus:outline-none transition-all placeholder:text-outline/50 shadow-sm" 
                  id="email" 
                  placeholder="name@company.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center">
                <label className={`font-label-bold ${passwordFocus ? 'text-primary' : 'text-on-surface-variant'}`} htmlFor="password">PASSWORD</label>
                <Link className="font-label-bold text-primary hover:text-on-primary-container transition-colors text-xs" to="#">FORGOT PASSWORD?</Link>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-on-surface transition-colors">lock</span>
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-surface-white border-2 border-outline-variant rounded-lg font-body-md focus:border-on-surface focus:outline-none transition-all placeholder:text-outline/50 shadow-sm" 
                  id="password" 
                  placeholder="••••••••" 
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  onFocus={() => setPasswordFocus(true)}
                  onBlur={() => setPasswordFocus(false)}
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors" 
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  <span className="material-symbols-outlined">{passwordVisible ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-sm">
              <input className="w-5 h-5 accent-primary border-2 border-outline rounded cursor-pointer" id="remember" type="checkbox"/>
              <label className="font-body-sm text-secondary cursor-pointer select-none" htmlFor="remember">Remember this station</label>
            </div>
            
            <button 
              className="group relative overflow-hidden bg-primary text-on-primary-fixed py-4 px-lg rounded-lg font-headline-sm uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-50" 
              type="submit"
              disabled={isSubmitting}
            >
              <span className="relative z-10">{isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <span className="material-symbols-outlined relative z-10 transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>
          </form>

          {/* Employee SSO info */}
          <div className="mt-lg p-gutter bg-on-primary-fixed/5 rounded-lg border border-outline-variant flex flex-col gap-sm">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">badge</span>
              <span className="font-label-bold text-on-surface uppercase tracking-widest text-xs">Employee Portal</span>
            </div>
            <p className="font-body-sm text-secondary">Internal staff and field operators should use corporate SSO credentials.</p>
          </div>

          {/* Footer Actions */}
          <div className="mt-xl flex flex-col items-center gap-md">
            <div className="w-full flex items-center gap-md">
              <div className="h-[1px] flex-1 bg-outline-variant"></div>
              <span className="font-label-bold text-outline text-[10px]">NEW TO THE SYSTEM?</span>
              <div className="h-[1px] flex-1 bg-outline-variant"></div>
            </div>
            <Link to="/signup" className="w-full block text-center py-3 px-lg border-2 border-on-surface text-on-surface font-headline-sm uppercase tracking-widest hover:bg-on-surface hover:text-surface-white transition-all rounded-lg active:scale-[0.98]">
              Create Account
            </Link>
          </div>

          {/* Version Tag */}
          <div className="mt-12 flex justify-between items-center text-[10px] font-label-bold text-outline uppercase tracking-widest opacity-60">
            <span>v4.2.1-INDUSTRIAL</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">verified_user</span>
              Secure Supabase Auth
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
