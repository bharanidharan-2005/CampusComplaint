import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';
import { API_URL } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // 1. Check local storage FIRST when the app loads
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('campusUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [loading, setLoading] = useState(true);

    // Bootstrap: validate any existing session on first load. If the stored
    // access token is dead and cannot be refreshed, clear it immediately so the
    // user is sent cleanly to login instead of mid-navigation.
    useEffect(() => {
        const bootstrap = async () => {
            const access = localStorage.getItem('access');
            const campusUserRaw = localStorage.getItem('campusUser');
            if (!access || !campusUserRaw) {
                setLoading(false);
                return;
            }
            try {
                await api.get('profile/');
            } catch {
                // The response interceptor already attempted a refresh; if that
                // failed it removed the session from storage. Sync React state.
                if (!localStorage.getItem('campusUser')) setUser(null);
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, []);

    const login = async(email, password) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/login/`, {
                email: email,
                password: password
            });

            // The backend returns the role under `user.role` (staff login) or
            // as a top-level `role` (student login). Normalize both shapes.
            const rd = response.data;
            const nested = rd.user || {};
            const userData = {
                role: nested.role || rd.role || 'user',
                token: rd.access,
                name: nested.name || rd.name || null,
                email: nested.email || rd.email || null,
            };

            setUser(userData);

            // Persist the raw JWTs separately. The api interceptor attaches
            // `access` on every request and, on a 401, silently refreshes it using
            // `refresh`. Previously only `campusUser.token` was stored, so a 401
            // had no refresh token to use and force-logged the user out on the
            // next navigation (e.g. returning to the dashboard after expiry).
            localStorage.setItem('access', rd.access);
            if (rd.refresh) localStorage.setItem('refresh', rd.refresh);

            // 2. Save the user data to the browser memory!
            localStorage.setItem('campusUser', JSON.stringify(userData));

            return userData;
        } catch (error) {
            console.error("Authentication failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        // 3. Clear memory on logout
        localStorage.removeItem('campusUser');
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};