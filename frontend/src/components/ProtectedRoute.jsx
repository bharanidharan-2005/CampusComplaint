import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    // 1. Check for 'campusUser', but add a fallback just in case AuthContext saved it as 'user'
    const userStorage = localStorage.getItem('campusUser');
    const backupStorage = localStorage.getItem('user'); 
    
    const rawData = userStorage || backupStorage;
    const parsedUser = rawData ? JSON.parse(rawData) : null;

    // 2. If no data is found in storage, block access
    if (!parsedUser) {
        console.error("🛑 ProtectedRoute: No user data found in localStorage! Bouncing to Login.");
        return <Navigate to="/login" replace />;
    }

    // 3. Safely extract the user's role, force it to lowercase, and remove trailing spaces
    const userRole = parsedUser.role ? String(parsedUser.role).toLowerCase().trim() : null;

    // 4. Clean up the allowedRoles array so everything matches perfectly
    const safeAllowedRoles = allowedRoles ? allowedRoles.map(role => role.toLowerCase().trim()) : [];

    // 5. Check if the user's role is in the allowed list
    if (allowedRoles && (!userRole || !safeAllowedRoles.includes(userRole))) {
        console.error(`🛑 ProtectedRoute: Access Denied! User role is '${userRole}', but route requires:`, safeAllowedRoles);
        return <Navigate to="/login" replace />;
    }

    // 6. If they pass all checks, render the dashboard!
    return children;
};

export default ProtectedRoute;