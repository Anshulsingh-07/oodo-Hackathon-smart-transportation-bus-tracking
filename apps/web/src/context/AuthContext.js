import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { api, setAccessToken } from "../services/api";
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const refreshMe = useCallback(async () => {
        try {
            const me = await api.get("/auth/me");
            setUser(me.data);
        }
        catch {
            setUser(null);
        }
    }, []);
    useEffect(() => {
        const bootstrap = async () => {
            try {
                const refreshed = await api.post("/auth/refresh");
                setAccessToken(refreshed.data.accessToken);
                await refreshMe();
            }
            catch {
                setUser(null);
            }
            finally {
                setIsLoading(false);
            }
        };
        bootstrap();
    }, [refreshMe]);
    const login = useCallback(async (email, password) => {
        const response = await api.post("/auth/login", {
            email,
            password,
        });
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
    }, []);
    const logout = useCallback(async () => {
        await api.post("/auth/logout");
        setAccessToken("");
        setUser(null);
    }, []);
    const value = useMemo(() => ({ user, isLoading, login, logout, refreshMe }), [user, isLoading, login, logout, refreshMe]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return ctx;
};
