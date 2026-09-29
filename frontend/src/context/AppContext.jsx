import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getPublicSettings, getMe } from "@/lib/api";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const s = await getPublicSettings();
      setSettings(s);
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    const token = localStorage.getItem("ss_token");
    if (token) {
      getMe()
        .then((u) => setUser(u))
        .catch(() => localStorage.removeItem("ss_token"))
        .finally(() => setLoadingUser(false));
    } else {
      setLoadingUser(false);
    }
  }, [refreshSettings]);

  const loginUser = (token, u) => {
    localStorage.setItem("ss_token", token);
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("ss_token");
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ settings, refreshSettings, user, setUser, loginUser, logout, loadingUser }}>
      {children}
    </AppContext.Provider>
  );
};
