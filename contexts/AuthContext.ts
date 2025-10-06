
import React from 'react';
import { User, Branch } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, password: string, branch: Branch) => Promise<{success: boolean, message: string}>;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  signup: async () => ({ success: false, message: "Not implemented" }),
});
