import axios from 'axios';

// API base URL is configurable via environment variable so the app can be
// pointed at different back-ends (dev, staging, prod) without code changes.
export const API_URL =
    process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Automatically attach the JWT token to requests if it exists
api.interceptors.request.use(
    (config) => {
        let token = localStorage.getItem('access') || localStorage.getItem('token');

        // Fallback: Check if nested inside the campusUser object
        if (!token) {
            const userStorage = localStorage.getItem('campusUser');
            if (userStorage) {
                try {
                    const parsedUser = JSON.parse(userStorage);
                    if (parsedUser) {
                        token = parsedUser.access || parsedUser.token;
                    }
                } catch (e) {
                    console.error('Error parsing stored user token:', e);
                }
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Single-flight token refresh so a single 401 triggers one refresh that all
// in-flight requests wait on, instead of each firing its own refresh.
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token) => {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (token) resolve(token);
        else reject(error);
    });
    pendingQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        // Only attempt a refresh once per request and only on a 401.
        if (error.response && error.response.status === 401 && original && !original._retry) {
            if (isRefreshing) {
                // A refresh is already running — queue this request behind it.
                return new Promise((resolve, reject) => {
                    pendingQueue.push({
                        resolve: (token) => {
                            original.headers.Authorization = `Bearer ${token}`;
                            resolve(api(original));
                        },
                        reject: () => reject(error),
                    });
                });
            }

            original._retry = true;
            isRefreshing = true;

            const refresh = localStorage.getItem('refresh');
            try {
                if (!refresh) throw new Error('No refresh token available');

                const res = await axios.post(`${API_URL}/login/refresh/`, { refresh });
                const newAccess = res.data.access;
                if (!newAccess) throw new Error('Refresh did not return an access token');

                localStorage.setItem('access', newAccess);
                const userStorage = localStorage.getItem('campusUser');
                if (userStorage) {
                    try {
                        const parsed = JSON.parse(userStorage);
                        parsed.token = newAccess;
                        localStorage.setItem('campusUser', JSON.stringify(parsed));
                    } catch (e) {
                        /* ignore malformed storage */
                    }
                }
                if (res.data.refresh) localStorage.setItem('refresh', res.data.refresh);

                flushQueue(null, newAccess);
                original.headers.Authorization = `Bearer ${newAccess}`;
                return api(original);
            } catch (refreshError) {
                flushQueue(refreshError, null);
                // Refresh failed — clear the session and send the user to login.
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                localStorage.removeItem('campusUser');
                if (window.location.pathname !== '/login') {
                    window.location.assign('/login');
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
