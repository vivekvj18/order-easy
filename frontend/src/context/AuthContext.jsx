import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLE_HOME_ROUTES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser  = localStorage.getItem('user');
      const storedRole  = localStorage.getItem('role');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
      }
    } catch {
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((data) => {
    let jwt = '';
    let userRole = '';
    let userObj = {};

    if (typeof data === 'string') {
      jwt = data;
      try {
        const payloadStr = atob(jwt.split('.')[1]);
        const payload = JSON.parse(payloadStr);
        userRole = payload.role;
        // The backend JWT uses 'sub' for email
        // Generate a deterministic integer ID based on email since it's not present in token
        let genId = 1;
        if (payload.sub) {
          for (let i = 0; i < payload.sub.length; i++) {
            genId += payload.sub.charCodeAt(i);
          }
        }
        userObj = { id: genId, email: payload.sub, role: payload.role, name: payload.sub.split('@')[0] };
      } catch (e) {
        console.error("Failed to parse JWT", e);
      }
    } else {
      // Fallback for object format
      userObj  = data.user  || { id: data.userId, email: data.email, name: data.name };
      userRole = data.role  || data.user?.role;
      jwt      = data.token || data.accessToken;
    }

    if (!jwt) return null;

    localStorage.setItem('token', jwt);
    localStorage.setItem('user',  JSON.stringify(userObj));
    localStorage.setItem('role',  userRole);

    setToken(jwt);
    setUser(userObj);
    setRole(userRole);

    return userRole;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    sessionStorage.removeItem('cart');

    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, role, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
