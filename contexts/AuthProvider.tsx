// contexts/AuthProvider.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import { User, Branch } from '../types';

// ✅ URL del Apps Script (POST)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwGH0okDIxOlw6CQBNTI6x3ob1sI8pO7dO7VwX48w18uLpbLmqBqJ_iCpa2rCVehfjglg/exec";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("sportclub-crm-user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser && parsedUser.email) {
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error al leer usuario del localStorage:", error);
        localStorage.removeItem("sportclub-crm-user");
      }
    }
  }, []);

  // ✅ LOGIN via POST
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append("action", "getUser");
      formData.append("email", email);
      formData.append("password", password);

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("🔍 Respuesta login:", data);

      if (data.success && data.user) {
        localStorage.setItem("sportclub-crm-user", JSON.stringify(data.user));
        setUser(data.user);
        return true;
      } else {
        console.warn("❌ Login fallido:", data.message);
        return false;
      }
    } catch (err) {
      console.error("Error en login:", err);
      return false;
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem("sportclub-crm-user");
    setUser(null);
  };

  // ✅ REGISTRO via POST
  const signup = async (
    name: string,
    email: string,
    password: string,
    branch: Branch
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const formData = new FormData();
      formData.append("action", "saveUser");
      formData.append("name", name);
      formData.append("email", email);
      formData.append("pin", password);
      formData.append("branch", branch);

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("🆕 Respuesta registro:", data);
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