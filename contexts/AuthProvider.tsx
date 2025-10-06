// Dentro de AuthProvider.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import { User, Branch } from '../types';

// 🔗 URL de tu Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz6pU6jo5r6PouXuKwS4HNpw_lc1EOLodmZtuv8Dp9cksOwR7hDshspQeD2jYONPcHHmA/exec";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('sportclub-crm-user');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id && parsedUser.role) {
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error al leer usuario del localStorage:", error);
        localStorage.removeItem('sportclub-crm-user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${SCRIPT_URL}?action=getUser&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      );
      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem('sportclub-crm-user', JSON.stringify(data.user));
        setUser(data.user);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error("Error en login:", err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('sportclub-crm-user');
    setUser(null);
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    branch: Branch
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(
        `${SCRIPT_URL}?action=saveUser&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&pin=${encodeURIComponent(password)}&branch=${encodeURIComponent(branch)}`
      );
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error en signup:", err);
      return { success: false, message: "Error al registrar el usuario." };
    }
  };

  const authContextValue = useMemo(() => ({ user, login, logout, signup }), [user]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

