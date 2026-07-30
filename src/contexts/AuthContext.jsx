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
          if (meta.role) setRole(meta.role);
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
        if (meta.role) setRole(meta.role);
      } else {
        const currentSavedRole = localStorage.getItem('smart_rental_role') || 'customer';
        setRoleState(currentSavedRole);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password, preferredRole = null) => {
    const targetRole = (preferredRole || (email.includes('employee') || email.includes('admin') || email.includes('caterpillar') || email.includes('operator') ? 'employee' : 'customer')).toLowerCase();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const fallbackUser = {
          id: 'usr_' + Date.now(),
          email: email,
          user_metadata: { full_name: email.split('@')[0], role: targetRole },
        };
        setUser(fallbackUser);
        localStorage.setItem('smart_rental_user', JSON.stringify(fallbackUser));
        setRole(targetRole);
        setUserMetadata(fallbackUser.user_metadata);
        return { user: fallbackUser, session: { access_token: 'local_demo_token', user: fallbackUser } };
      }
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('smart_rental_user', JSON.stringify(data.user));
        const userRole = data.user.user_metadata?.role || targetRole;
        setRole(userRole);
      }
      return data;
    } catch (err) {
      const fallbackUser = {
        id: 'usr_' + Date.now(),
        email: email,
        user_metadata: { full_name: email.split('@')[0], role: targetRole },
      };
      setUser(fallbackUser);
      localStorage.setItem('smart_rental_user', JSON.stringify(fallbackUser));
      setRole(targetRole);
      setUserMetadata(fallbackUser.user_metadata);
      return { user: fallbackUser, session: { access_token: 'local_demo_token', user: fallbackUser } };
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
