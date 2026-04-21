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
        const decoded = JSON.parse(atob(jwt.split('.')[1]));
        userRole = decoded.role;
        // Read the real DB user id directly from the JWT claim
        userObj = { id: decoded.userId, email: decoded.sub, role: decoded.role, name: decoded.sub?.split('@')[0] };
      } catch (e) {
        console.error("Failed to parse JWT", e);
      }
    } else {
      // Object format: handles { token, role } from OTP verify
      // and { user, token } from any future format
      jwt      = data.token || data.accessToken;
      userRole = data.role  || data.user?.role;

      if (data.user) {
        userObj = data.user;
      } else if (jwt) {
        // Parse JWT to extract user info (email is in 'sub', real DB id is in 'userId')
        try {
          const decoded = JSON.parse(atob(jwt.split('.')[1]));
          userRole = userRole || decoded.role;
          // Read the real DB user id directly from the JWT claim
          userObj = { id: decoded.userId, email: decoded.sub, role: userRole, name: decoded.sub?.split('@')[0] };
        } catch (e) {
          console.error('Failed to parse JWT payload', e);
        }
      }
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
