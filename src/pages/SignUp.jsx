import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { addToast } = useToast();

  const [regType, setRegType] = useState('customer'); // 'customer' | 'employee'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyOrWorkId, setCompanyOrWorkId] = useState('');
  const [role, setRole] = useState('Manager'); // 'Manager' | 'Admin' | 'Operator'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match. Please verify credentials.';
      setErrorMsg(msg);
      addToast(msg, 'warning', 'Password Mismatch');
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setErrorMsg(msg);
      addToast(msg, 'warning', 'Weak Password');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await signUp({
        email: email.trim(),
        password,
        fullName,
        companyOrWorkId,
        regType,
      });

      if (data?.session || data?.user) {
        const msg = `${regType === 'employee' ? 'Employee' : 'Customer'} account created successfully!`;
        setSuccessMsg(msg);
        addToast(msg, 'success', 'Account Registered');
        setTimeout(() => {
          navigate(regType === 'employee' ? '/employee/dashboard' : '/customer/equipment');
        }, 1200);
      } else {
        const msg = 'Account created! Please check email or sign in.';
        setSuccessMsg(msg);
        addToast(msg, 'info', 'Verification Required');
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      }
    } catch (err) {
      console.error('Registration Catch:', err);
      const msg = err.message || 'Registration failed. Check network or email format.';
      setErrorMsg(msg);
      addToast(msg, 'error', 'Registration Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full bg-surface font-body-md text-on-surface min-h-screen">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Panel: Visual Section */}
        <div className="relative hidden lg:flex lg:w-3/5 xl:w-2/3 bg-inverse-surface overflow-hidden">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20000ms] ease-out scale-110 hover:scale-100" 
            style={{ backgroundImage: "url('/bg_industrial.png')" }}
          ></div>
          <div className="absolute inset-0 bg-black/30 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10"></div>
          <div className="absolute top-12 left-12 z-20 flex items-center gap-4 opacity-70">
            <div className="w-12 h-[2px] bg-primary"></div>
            <span className="font-label-bold text-white text-[11px] uppercase tracking-[0.4em]">SMRT-TK-001</span>
          </div>
          <div className="relative z-20 mt-auto p-xl lg:p-xl mb-xl max-w-3xl">
            <div className="flex items-center gap-xs mb-sm">
              <div className="h-[2px] w-8 bg-primary"></div>
              <span className="font-label-bold text-primary-container uppercase tracking-[0.2em] text-label-bold">Operational Excellence</span>
            </div>
            <h2 className="font-display-lg text-white text-[44px] lg:text-display-lg leading-[1.1] mb-md drop-shadow-lg">
              Orchestrate the fleet with <br/><span className="text-primary-container">uncompromising</span> precision.
            </h2>
            <p className="font-body-lg text-surface-container-low/90 text-body-lg max-w-xl leading-relaxed">
              The heavy-duty platform for the modern worksite. Track assets, manage operators, and optimize uptime across your entire project landscape.
            </p>
          </div>
        </div>

        {/* Right Panel: Sign Up Form */}
        <div className="w-full lg:w-2/5 xl:w-1/3 bg-surface flex flex-col justify-center px-gutter py-xl lg:px-xl relative overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            <header className="mb-lg">
              <div className="mb-sm text-primary flex">
                <span className="material-symbols-outlined text-[42px]" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
              </div>
              <h1 className="font-headline-lg text-on-surface text-headline-lg tracking-tight">Create Account</h1>
              <p className="font-body-md text-secondary mt-xs">Register your organization to begin tracking.</p>
            </header>
            
            {/* Feedback Banners */}
            {errorMsg && (
              <div className="mb-md p-md bg-error/10 border-l-4 border-error text-error text-sm rounded-r flex items-center gap-sm">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-md p-md bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded-r flex items-center gap-sm">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            <form className="space-y-sm" onSubmit={handleSignUp}>
              {/* Registration Type Toggle */}
              <div className="flex flex-col gap-base mb-md">
                <label className="font-label-bold text-on-surface-variant text-[11px] uppercase tracking-wider">Registration Type</label>
                <div className="grid grid-cols-2 gap-0 border border-outline-variant">
                  <button
                    type="button"
                    onClick={() => setRegType('customer')}
                    className={`p-sm text-center border-r border-outline-variant transition-all ${regType === 'customer' ? 'bg-primary-container/20 border-b-2 border-b-primary font-label-bold text-on-surface' : 'text-secondary'}`}
                  >
                    <span className="block font-label-bold text-[10px] uppercase">Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegType('employee')}
                    className={`p-sm text-center transition-all ${regType === 'employee' ? 'bg-primary-container/20 border-b-2 border-b-primary font-label-bold text-on-surface' : 'text-secondary'}`}
                  >
                    <span className="block font-label-bold text-[10px] uppercase">Employee</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-base">
                <label className="font-label-bold text-on-surface-variant text-[11px] uppercase tracking-wider" htmlFor="full_name">Full Name</label>
                <input 
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                  id="full_name" 
                  placeholder="John Doe" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                  type="text"
                />
              </div>
              
              {/* Email */}
              <div className="flex flex-col gap-base">
                <label className="font-label-bold text-on-surface-variant text-[11px] uppercase tracking-wider" htmlFor="email">Business Email</label>
                <input 
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                  id="email" 
                  placeholder="j.doe@contractor.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  type="email"
                />
              </div>
              
              {/* Company Name / Work ID */}
              <div className="flex flex-col gap-base">
                <label className="font-label-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                  {regType === 'customer' ? 'Company Name' : 'Work ID / Internal Ref'}
                </label>
                <input 
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                  placeholder={regType === 'customer' ? 'Iron Works Construction LLC' : 'EMP-99284'} 
                  value={companyOrWorkId}
                  onChange={(e) => setCompanyOrWorkId(e.target.value)}
                  required 
                  type="text"
                />
              </div>
              
              {/* Passwords */}
              <div className="grid grid-cols-2 gap-sm">
                <div className="flex flex-col gap-base">
                  <label className="font-label-bold text-on-surface-variant text-[11px] uppercase tracking-wider" htmlFor="password">Password</label>
                  <input 
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                    id="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    type="password"
                  />
                </div>
                <div className="flex flex-col gap-base">
                  <label className="font-label-bold text-on-surface-variant text-[11px] uppercase tracking-wider" htmlFor="confirm_password">Confirm</label>
                  <input 
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                    id="confirm_password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                    type="password"
                  />
                </div>
              </div>
              
              {/* Submit */}
              <div className="pt-sm">
                <button 
                  className="w-full bg-[#745b00] hover:bg-[#574400] text-white py-md px-lg font-headline-sm text-headline-sm transition-all duration-200 flex items-center justify-center gap-md group shadow-lg disabled:opacity-50" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'REGISTERING...' : 'INITIALIZE INTERFACE'} 
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </form>

            <footer className="mt-lg text-center">
              <p className="font-body-sm text-secondary">
                Already managing a fleet? 
                <Link className="text-on-surface font-label-bold border-b border-primary hover:text-primary transition-colors ml-xs uppercase text-[11px] tracking-widest" to="/login">Log In Here</Link>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SignUp;
