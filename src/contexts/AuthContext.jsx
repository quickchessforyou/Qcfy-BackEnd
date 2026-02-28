import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // ------------------ USER AUTH ------------------
  const [user, setUser] = useState(() => {
    try {
      const item = localStorage.getItem("user");
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn("Error parsing user from localStorage:", e);
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const isUserAuthenticated = !!token;

  const userLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

  const userLogout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // ------------------ ADMIN AUTH ------------------
  const [admin, setAdmin] = useState(() => {
    try {
      const item = localStorage.getItem("admin");
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn("Error parsing admin from localStorage:", e);
      return null;
    }
  });
  const [atoken, setAToken] = useState(localStorage.getItem("atoken") || null);

  const isAdminAuthenticated = !!atoken;

  const adminLogin = (adminData, adminToken) => {
    setAdmin(adminData);
    setAToken(adminToken);

    localStorage.setItem("admin", JSON.stringify(adminData));
    localStorage.setItem("atoken", adminToken);
  };

  const adminLogout = () => {
    setAdmin(null);
    setAToken(null);

    localStorage.removeItem("admin");
    localStorage.removeItem("atoken");
  };

  // --------------- GET AUTH HEADER BASED ON USER/ADMIN ---------------
  const getAuthHeader = () => {
    if (atoken) return { Authorization: `Bearer ${atoken}` }; // admin first
    if (token) return { Authorization: `Bearer ${token}` };   // user next
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        // user auth
        user,
        token,
        isUserAuthenticated,
        userLogin,
        userLogout,

        // legacy aliases for backwards compatibility
        // (so existing components using login/logout/isAuthenticated keep working)
        isAuthenticated: isUserAuthenticated,
        login: userLogin,
        logout: userLogout,

        // admin auth
        admin,
        atoken,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,

        // shared
        getAuthHeader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
