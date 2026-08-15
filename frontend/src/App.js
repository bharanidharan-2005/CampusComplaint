import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import Existing Pages 
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';
import DeanDashboard from './pages/DeanDashboard';
import HODDashboard from './pages/HodDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import LostFound from './pages/LostFound';
import NotFound from './pages/404Page';

// Import Admin Sub-pages
import ManageUsers from './pages/ManageUsers';
import SystemRoles from './pages/SystemRoles';
import ActiveDepartments from './pages/ActiveDepartments';
import SystemLogs from './pages/SystemLogs';
import ConfigureCategories from './pages/ConfigureCategories';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';

// Import Role-aware Workflow Pages
import ComplaintsPage from './pages/ComplaintsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LostFoundPage from './pages/LostFoundPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
    return ( <
        ThemeProvider >
        <
        AuthProvider >
        <
        Router >
        <
        Routes > { /* Public Routes */ } <
        Route path = "/"
        element = { < Navigate to = "/login"
            replace / >
        }
        /> <
        Route path = "/login"
        element = { < Login / > }
        />

        { /* Admin Routes */ } <
        Route path = "/admin/dashboard"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Admin', 'admin', 'superuser']
            } >
            <
            AdminDashboard / >
            <
            /ProtectedRoute>
        }
        /> <
        Route path = "/admin/users"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Admin', 'admin', 'superuser']
            } >
            <
            ManageUsers / >
            <
            /ProtectedRoute>
        }
        /> <
        Route path = "/admin/roles"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Admin', 'admin', 'superuser']
            } >
            <
            SystemRoles / >
            <
            /ProtectedRoute>
        }
        /> <
        Route path = "/admin/departments"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Admin', 'admin', 'superuser']
            } >
            <
            ActiveDepartments / >
            <
            /ProtectedRoute>
        }
        /> <
        Route path = "/admin/logs"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Admin', 'admin', 'superuser']
            } >
            <
            SystemLogs / >
            <
            /ProtectedRoute>
        }
        /> <
        Route path = "/admin/categories"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Admin', 'admin', 'superuser']
            } >
            <
            ConfigureCategories / >
            <
            /ProtectedRoute>
        }
        />
        <
        Route path = "/admin/reports"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Admin', 'admin', 'superuser']
            } >
            <
            AdminReports / >
            <
            /ProtectedRoute>
        }
        />
        <
        Route path = "/admin/settings"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Admin', 'admin', 'superuser']
            } >
            <
            AdminSettings / >
            <
            /ProtectedRoute>
        }
        />

        { /* Principal Routes */ } <
        Route path = "/principal/dashboard"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Principal', 'principal']
            } >
            <
            PrincipalDashboard / >
            <
            /ProtectedRoute>
        }
        />

        { /* Dean Routes */ } <
        Route path = "/dean/dashboard"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Dean', 'dean']
            } >
            <
            DeanDashboard / >
            <
            /ProtectedRoute>
        }
        />

        { /* HOD Routes */ } <
        Route path = "/hod/dashboard"
        element = { <
            ProtectedRoute allowedRoles = {
                ['HOD', 'hod']
            } >
            <
            HODDashboard / >
            <
            /ProtectedRoute>
        }
        />

        { /* Faculty / Staff Routes */ } <
        Route path = "/faculty/dashboard"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Faculty', 'faculty', 'Staff', 'staff']
            } >
            <
            FacultyDashboard / >
            <
            /ProtectedRoute>
        }
        />

        { /* Route alias to capture staff logins and redirect to Faculty dashboard */ } <
        Route path = "/staff/dashboard"
        element = { < Navigate to = "/faculty/dashboard"
            replace / >
        }
        />

        { /* Student Routes */ } <
        Route path = "/student/dashboard"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Student', 'student']
            } >
            <
            StudentDashboard / >
            <
            /ProtectedRoute>
        }
        />         <
        Route path = "/student/submit-complaint"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Student', 'student', 'Faculty', 'faculty', 'Staff', 'staff']
            } >
            <
            SubmitComplaint / >
            <
            /ProtectedRoute>
        }
        /> <
        Route path = "/student/lost-found"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Student', 'student', 'Faculty', 'faculty', 'Staff', 'staff']
            } >
            <
            LostFound / >
            <
            /ProtectedRoute>
        }
        />

        { /* Role-aware Workflow Pages (consolidated) */ } <
        Route path = "/complaints"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Student', 'student', 'Faculty', 'faculty', 'Staff', 'staff', 'HOD', 'hod', 'Dean', 'dean', 'Principal', 'principal', 'Admin', 'admin']
            } >
            <
            ComplaintsPage / >
            <
            /ProtectedRoute>
        }
        /> <
        Route path = "/analytics"
        element = { <
            ProtectedRoute allowedRoles = {
                ['HOD', 'hod', 'Dean', 'dean', 'Principal', 'principal']
            } >
            <
            AnalyticsPage / >
            <
            /ProtectedRoute>
        }
        /> <
        Route path = "/lost-found"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Student', 'student', 'Faculty', 'faculty', 'Staff', 'staff', 'HOD', 'hod', 'Dean', 'dean', 'Principal', 'principal']
            } >
            <
            LostFoundPage / >
            <
            /ProtectedRoute>
        }
        /> <
        Route path = "/notifications"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Student', 'student', 'Faculty', 'faculty', 'Staff', 'staff', 'HOD', 'hod', 'Dean', 'dean', 'Principal', 'principal', 'Admin', 'admin']
            } >
            <
            NotificationsPage / >
            <
            /ProtectedRoute>
        }
        /> <
        Route path = "/profile"
        element = { <
            ProtectedRoute allowedRoles = {
                ['Student', 'student', 'Faculty', 'faculty', 'Staff', 'staff', 'HOD', 'hod', 'Dean', 'dean', 'Principal', 'principal', 'Admin', 'admin']
            } >
            <
            ProfilePage / >
            <
            /ProtectedRoute>
        }
        />

        { /* 404 Page */ } <
        Route path = "*"
        element = { < NotFound / > }
        />          < /
        Routes > <
        /Router> < /
        AuthProvider > < /
        ThemeProvider >
    );
}

export default App;