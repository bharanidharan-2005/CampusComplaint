import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, PlusCircle, Search, Users, ShieldCheck,
    Building2, Tags, ScrollText, LogOut, Menu, GraduationCap,
    ClipboardList, PenTool, TrendingUp, PieChart, BarChart, Bell, User, AlertTriangle,
    RefreshCw, Package, FileText, Settings, Sun, Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NAV_BY_ROLE } from '../styles/theme';
import api from '../services/api';
import { useEffect } from 'react';

const ICONS = {
    LayoutDashboard, PlusCircle, Search, Users, ShieldCheck, Building2, Tags, ScrollText,
    ClipboardList, PenTool, GraduationCap, TrendingUp, PieChart, BarChart, Bell, User, AlertTriangle,
    RefreshCw, Package, FileText, Settings,
};

const MainLayout = ({ children, title }) => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const role = (user?.role || '').toString().toLowerCase();
    const navItems = NAV_BY_ROLE[role] || (role.includes('admin') ? NAV_BY_ROLE.admin : NAV_BY_ROLE.student);
    const isGrouped = navItems.length > 0 && Array.isArray(navItems[0]?.items);

    const renderNavItem = (item) => {
        const Icon = ICONS[item.icon] || LayoutDashboard;
        const active = `${location.pathname}${location.search}` === item.path
            || (location.pathname === item.path.split('?')[0] && !item.path.includes('?'));
        return (
            <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                }`}
            >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.label === 'Notifications' && unread > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                )}
            </button>
        );
    };

    const [unread, setUnread] = useState(0);
    useEffect(() => {
        let active = true;
        api.get('notifications/')
            .then((res) => {
                if (active) setUnread((res.data || []).filter((n) => !n.is_read).length);
            })
            .catch(() => {});
        return () => { active = false; };
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const SidebarContent = (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
                <div className="p-2 bg-white/10 rounded-xl">
                    <GraduationCap className="text-white" size={24} />
                </div>
                <div>
                    <p className="text-white font-bold leading-tight">Smart Campus</p>
                    <p className="text-indigo-200 text-xs leading-tight">Complaint Portal</p>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto">
                {isGrouped ? navItems.map((group, gi) => (
                    <div key={gi}>
                        {group.group && (
                            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">{group.group}</p>
                        )}
                        <div className="space-y-1">{group.items.map((item) => renderNavItem(item))}</div>
                    </div>
                )) : navItems.map((item) => renderNavItem(item))}
            </nav>

            <div className="p-3 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-200 hover:bg-rose-500/20 hover:text-white transition-colors"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex w-64 bg-indigo-700 flex-col fixed inset-y-0 left-0 z-30">
                {SidebarContent}
            </aside>

            {/* Mobile sidebar */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/50"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="absolute inset-y-0 left-0 w-64 bg-indigo-700 flex flex-col z-50">
                        {SidebarContent}
                    </aside>
                </div>
            )}

            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="text-lg font-bold text-slate-800">
                            {title || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                            aria-label="Toggle theme"
                            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                            aria-label="Notifications"
                        >
                            <Bell size={20} />
                            {unread > 0 && (
                                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {unread > 9 ? '9+' : unread}
                                </span>
                            )}
                        </button>
                        {user && (
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-700 leading-tight">
                                        {user.name || user.email}
                                    </p>
                                    <p className="text-xs font-medium text-slate-400 capitalize">
                                        {role}
                                    </p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 font-sans">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
