import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_ACCOUNTS } from '../data/demoAccounts.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('techavenue_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return null; // Start at login page if not previously logged in
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('techavenue_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('techavenue_user');
    }
  }, [currentUser]);

  const login = (username, password) => {
    const user = DEMO_ACCOUNTS.find(
      (acc) =>
        acc.username.toLowerCase() === username.trim().toLowerCase() &&
        acc.password === password.trim()
    );

    if (user) {
      setCurrentUser(user);
      return { success: true, user };
    }
    return { success: false, message: 'Invalid username or password. Please try again.' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('techavenue_user');
  };

  const switchRole = (roleKey) => {
    const target = DEMO_ACCOUNTS.find((acc) => acc.role === roleKey);
    if (target) {
      setCurrentUser(target);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
