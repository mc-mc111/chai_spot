import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('chaispot_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && user.token) {
        try {
          const res = await authAPI.getMe();
          setUser(prev => ({
            ...prev,
            ...res.data
          }));
        } catch (err) {
          console.error('Failed to refresh user profile:', err);
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const signup = async (name, email, password) => {
    const res = await authAPI.signup({ name, email, password });
    const userData = res.data;
    localStorage.setItem('chaispot_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const userData = res.data;
    localStorage.setItem('chaispot_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('chaispot_user');
    setUser(null);
  };

  const updateUserPointsAndCoupons = (points, coupons) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        ...(points !== undefined && { points }),
        ...(coupons !== undefined && { coupons })
      };
      localStorage.setItem('chaispot_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signup,
      login,
      logout,
      updateUserPointsAndCoupons
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
