import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { saveUserProfile } from '../services/database';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smart_rental_user');
    return saved ? JSON.parse(saved) : null;
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
        } else {
          const saved = localStorage.getItem('smart_rental_user');
          if (!saved) setUser(null);
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
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('smart_rental_user');
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

    try {
      // 1. Supabase Cloud Authentication Check
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!error && data?.user) {
        setUser(data.user);
        localStorage.setItem('smart_rental_user', JSON.stringify(data.user));
        setRole(activeRole);
        return data;
      }

      // 2. Allow Demo Accounts or Registered Local Users
      const isDemoAccount = email === 'employee@smartrental.com' || email === 'customer@smartrental.com';
      const registeredList = JSON.parse(localStorage.getItem('smart_rental_registered_users') || '[]');
      const registeredMatch = registeredList.find((u) => u.email === email && (!u.password || u.password === password));
      const savedUser = localStorage.getItem('smart_rental_user');
      const savedUserMatch = savedUser && JSON.parse(savedUser).email === email ? JSON.parse(savedUser) : null;

      if (isDemoAccount || registeredMatch || savedUserMatch) {
        const authUser = registeredMatch?.user || savedUserMatch || {
          id: 'usr_' + (activeRole === 'employee' ? 'emp_101' : 'cust_101'),
          email: email,
          user_metadata: { full_name: email.split('@')[0], role: activeRole },
        };
        const finalRole = registeredMatch?.role || activeRole;
        setUser(authUser);
        localStorage.setItem('smart_rental_user', JSON.stringify(authUser));
        setRole(finalRole);
        setUserMetadata(authUser.user_metadata || {});
        return { user: authUser, session: { access_token: 'valid_session', user: authUser } };
      }

      // 3. Reject Unregistered / Wrong Credentials
      throw new Error('Invalid email or password. Please verify your credentials or click Create Account to register.');
    } catch (err) {
      throw err;
    }
  };

  const signUp = async ({ email, password, fullName, companyOrWorkId, regType }) => {
    const forcedRole = (regType === 'employee' ? 'employee' : 'customer').toLowerCase();
    const forcedRegType = regType || 'customer';

    // Save profile to Supabase user_profiles table & registered accounts store
    await saveUserProfile({
      email,
      fullName,
      role: forcedRole,
      companyOrWorkId,
    });

    let createdUser = {
      id: 'usr_' + Date.now(),
      email,
      user_metadata: {
        full_name: fullName,
        role: forcedRole,
        reg_type: forcedRegType,
        company_or_work_id: companyOrWorkId || '',
      },
    };

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

      if (!error && data?.user) {
        createdUser = data.user;
      }
    } catch (err) {
      console.warn('Supabase Auth signUp notice:', err.message);
    }

    // Persist registered credentials locally so login succeeds reliably
    const registeredList = JSON.parse(localStorage.getItem('smart_rental_registered_users') || '[]');
    const updated = registeredList.filter((u) => u.email !== email);
    updated.push({ email, password, role: forcedRole, user: createdUser });
    localStorage.setItem('smart_rental_registered_users', JSON.stringify(updated));

    setUser(createdUser);
    localStorage.setItem('smart_rental_user', JSON.stringify(createdUser));
    setRole(forcedRole);
    setUserMetadata(createdUser.user_metadata || {});

    return {
      user: createdUser,
      session: { access_token: 'active_session', user: createdUser },
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
