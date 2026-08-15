import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Building2, ShieldCheck, Tags, ScrollText } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import Spinner from '../components/ui/Spinner';

const AdminSettings = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [dash, depts, roles, cats, logs] = await Promise.all([
                    api.get('dashboard/admin/'),
                    api.get('departments/'),
                    api.get('roles/'),
                    api.get('categories/'),
                    api.get('logs/'),
                ]);
                setData({
                    totalUsers: dash.data.totalUsers || 0,
                    departments: depts.data || [],
                    roles: roles.data || [],
                    categories: cats.data || [],
                    logs: logs.data || [],
                });
            } catch { } finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) return <Spinner label="Loading system configuration..." />;

    const cards = [
        { icon: Users, label: 'Total Users', value: data?.totalUsers, tone: 'text-blue-600' },
        { icon: Building2, label: 'Departments', value: (data?.departments || []).length, tone: 'text-emerald-600' },
        { icon: ShieldCheck, label: 'Roles', value: (data?.roles || []).length, tone: 'text-violet-600' },
        { icon: Tags, label: 'Categories', value: (data?.categories || []).length, tone: 'text-fuchsia-600' },
        { icon: ScrollText, label: 'Activity Logs', value: (data?.logs || []).length, tone: 'text-slate-600' },
    ];

    return (
        <MainLayout title="System Settings">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {cards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                            <Icon size={22} className={c.tone} />
                            <p className="text-3xl font-black text-slate-800 mt-3">{c.value}</p>
                            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Departments</h3>
                    <div className="flex flex-wrap gap-2">
                        {(data?.departments || []).map((d) => (
                            <span key={d.id} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm">{d.name}</span>
                        ))}
                        {(data?.departments || []).length === 0 && <p className="text-sm text-slate-400">No departments configured.</p>}
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">Roles & Permissions</h3>
                    <div className="flex flex-wrap gap-2">
                        {(data?.roles || []).map((r) => (
                            <span key={r.id} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm">{r.name}</span>
                        ))}
                        {(data?.roles || []).length === 0 && <p className="text-sm text-slate-400">No roles configured.</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><SettingsIcon size={18} className="text-fuchsia-600" /> System Status</h3>
                <p className="text-sm text-slate-500">The campus complaint portal is operational. User management, departments, roles, categories and activity logs are managed from the sidebar.</p>
            </div>
        </MainLayout>
    );
};

export default AdminSettings;
