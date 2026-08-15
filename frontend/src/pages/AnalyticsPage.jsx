import React, { useState, useEffect, useMemo } from 'react';

import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { LayoutDashboard, Building2, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#94a3b8', '#ef4444'];

const AnalyticsPage = () => {
    const { user } = useAuth();
    const role = (user?.role || '').toLowerCase();

    const endpoint = role === 'hod' ? 'dashboard/hod/'
        : role === 'dean' ? 'dashboard/dean/'
        : role === 'principal' ? 'dashboard/principal/analytics/' : null;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!endpoint) { setLoading(false); return; }
        setLoading(true);
        api.get(endpoint).then((res) => { setData(res.data); setError(null); })
            .catch(() => setError('Failed to load analytics.'))
            .finally(() => setLoading(false));
    }, [endpoint]);

    const statusData = useMemo(() => {
        if (!data) return [];
        const src = data.complaints_by_status || data.all_complaints_by_status || [];
        return src.map((s) => ({ name: s.status, value: s.count }));
    }, [data]);

    const deptData = useMemo(() => {
        if (!data || !data.complaints_by_department) return [];
        return data.complaints_by_department.map((d) => ({ name: d.department, value: d.count }));
    }, [data]);

    const categoryData = useMemo(() => {
        if (!data || !data.complaints_by_category) return [];
        return data.complaints_by_category.map((c) => ({ name: c.category, value: c.count }));
    }, [data]);

    if (!endpoint) return (
        <MainLayout title="Analytics">
            <EmptyState icon={PieIcon} title="Analytics not available" description="This view is not available for your role." />
        </MainLayout>
    );
    if (loading) return <Spinner label="Loading analytics..." />;
    if (error) return <MainLayout title="Analytics"><div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl">{error}</div></MainLayout>;

    const title = role === 'hod' ? 'Department Analytics'
        : role === 'dean' ? 'College Analytics & Reports'
        : 'Executive Analytics & Reports';

    const stats = [
        { label: 'Total', value: data.total_complaints || data.total || statusData.reduce((a, b) => a + b.value, 0), icon: LayoutDashboard, tone: 'indigo' },
        { label: 'Pending', value: data.pending ?? (statusData.find((s) => s.name === 'Pending')?.value || 0), icon: PieIcon, tone: 'amber' },
        { label: 'Resolved', value: data.resolved ?? (statusData.find((s) => s.name === 'Resolved')?.value || 0), icon: BarChart3, tone: 'emerald' },
        { label: 'In Progress', value: data.in_process ?? (statusData.find((s) => s.name === 'In Progress')?.value || 0), icon: Building2, tone: 'blue' },
    ];

    return (
        <MainLayout title={title}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((s) => <StatCard key={s.label} {...s} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-800 mb-3">Complaints by Status</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {deptData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                        <h3 className="font-bold text-slate-800 mb-3">Complaints by Department</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={deptData}>
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {categoryData.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                    <h3 className="font-bold text-slate-800 mb-3">Complaints by Category</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={categoryData}>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {data.recent_complaints && data.recent_complaints.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-800 mb-3">Recent Complaints</h3>
                    <div className="divide-y divide-slate-100">
                        {data.recent_complaints.slice(0, 8).map((c) => (
                            <div key={c.id} className="flex justify-between items-center py-2.5">
                                <span className="text-sm font-medium text-slate-700 truncate max-w-md">{c.title}</span>
                                <span className="text-xs text-slate-400">{c.status} · {c.department}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default AnalyticsPage;
