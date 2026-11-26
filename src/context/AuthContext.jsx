import { createContext, useContext, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mifus_user');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  });

  async function login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('mifus_token', data.token);
    localStorage.setItem('mifus_user', JSON.stringify(data.user));
    localStorage.removeItem('simdes_token');
    localStorage.removeItem('simdes_user');
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('mifus_token');
    localStorage.removeItem('mifus_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
