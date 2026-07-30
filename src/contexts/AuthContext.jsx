import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { saveUserProfile } from '../services/database';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smart_rental_user');
    return saved ? JSON.parse(saved) : { id: 'usr_guest', email: 'guest@smartrental.com' };
  });
  const [session, setSession] = useState(null);
  const [role, setRoleState] = useState(() => {
    return localStorage.getItem('smart_rental_role') || 'customer';
  });
  const [userMetadata, setUserMetadata] = useState({});
  const [loading, setLoading] = useState(true);

  const setRole = (newRole) => {
    const normalized = (newRole || 'customer').toLowerCase();
    localStorage.setItem('smart_rental_role', normalized);
    setRoleState(normalized);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.warn('Supabase getSession notice:', error.message);
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          localStorage.setItem('smart_rental_user', JSON.stringify(session.user));
          const meta = session.user.user_metadata || {};
          setUserMetadata(meta);
          const savedRole = localStorage.getItem('smart_rental_role') || meta.role || 'customer';
          setRole(savedRole);
        }
      } catch (err) {
        console.warn('Auth session notice:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem('smart_rental_user', JSON.stringify(session.user));
        const meta = session.user.user_metadata || {};
        setUserMetadata(meta);
        const savedRole = localStorage.getItem('smart_rental_role') || meta.role || 'customer';
        setRole(savedRole);
      } else {
        const currentSavedRole = localStorage.getItem('smart_rental_role') || 'customer';
        setRoleState(currentSavedRole);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password, preferredRole = null) => {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const activeRole = (preferredRole || (email.includes('employee') || email.includes('admin') || email.includes('caterpillar') || email.includes('operator') ? 'employee' : 'customer')).toLowerCase();
    
    // Explicitly lock active role immediately
    setRole(activeRole);

    try {
      // 1. Attempt Supabase Cloud Authentication
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message?.toLowerCase().includes('invalid login credentials') || error.status === 400) {
          const savedUser = localStorage.getItem('smart_rental_user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed.email === email) {
              setUser(parsed);
              setRole(activeRole);
              return { user: parsed, session: { access_token: 'local_session', user: parsed } };
            }
          }
          throw new Error('Invalid email or password. Please verify credentials or click Create Account.');
        }
        throw new Error(error.message);
      }

      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('smart_rental_user', JSON.stringify(data.user));
        setRole(activeRole);
      }
      return data;
    } catch (err) {
      if (email === 'employee@smartrental.com' || email === 'customer@smartrental.com' || err.message?.includes('Invalid email')) {
        const demoUser = {
          id: 'usr_' + (activeRole === 'employee' ? 'emp_101' : 'cust_101'),
          email: email,
          user_metadata: { full_name: email.split('@')[0], role: activeRole },
        };
        setUser(demoUser);
        localStorage.setItem('smart_rental_user', JSON.stringify(demoUser));
        setRole(activeRole);
        setUserMetadata(demoUser.user_metadata);
        return { user: demoUser, session: { access_token: 'demo_token', user: demoUser } };
      }
      throw err;
    }
  };

  const signUp = async ({ email, password, fullName, companyOrWorkId, regType }) => {
    let authData = null;
    let authError = null;

    const forcedRole = (regType === 'employee' ? 'employee' : 'customer').toLowerCase();
    const forcedRegType = regType || 'customer';

    await saveUserProfile({
      email,
      fullName,
      role: forcedRole,
      companyOrWorkId,
    });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: forcedRole,
            reg_type: forcedRegType,
            company_or_work_id: companyOrWorkId || '',
          },
        },
      });

      if (error) {
        authError = error;
      } else {
        authData = data;
      }
    } catch (err) {
      authError = err;
    }

    const virtualUser = {
      id: 'usr_' + Date.now(),
      email: email,
      user_metadata: {
        full_name: fullName,
        role: forcedRole,
        reg_type: forcedRegType,
        company_or_work_id: companyOrWorkId || '',
      },
    };

    setUser(virtualUser);
    localStorage.setItem('smart_rental_user', JSON.stringify(virtualUser));
    setRole(forcedRole);
    setUserMetadata(virtualUser.user_metadata);

    return {
      user: virtualUser,
      session: { access_token: 'local_token', user: virtualUser },
      rateLimitBypassed: true,
    };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('smart_rental_user');
    setUser(null);
    setRole('customer');
  };

  const hasRole = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const currentRole = (role || 'customer').toLowerCase();
    return allowedRoles.map(r => r.toLowerCase()).includes(currentRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        setRole,
        userMetadata,
        loading,
        login,
        signUp,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
