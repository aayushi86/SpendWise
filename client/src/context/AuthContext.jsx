import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('spendwise_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.getMe();
        if (response.success) {
          setUser(response.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await api.login({ email, password });
    if (response.success) {
      localStorage.setItem('spendwise_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return response;
    }
  };

  const register = async (name, email, password) => {
    const response = await api.register({ name, email, password });
    if (response.success) {
      localStorage.setItem('spendwise_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return response;
    }
  };

  const logout = () => {
    localStorage.removeItem('spendwise_token');
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = async (data) => {
    const response = await api.updateProfile(data);
    if (response.success) {
      setUser(response.user);
    }
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
