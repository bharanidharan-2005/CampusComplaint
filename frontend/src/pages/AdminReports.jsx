import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, BarChart3, RefreshCw, FileText, Printer } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import Spinner from '../components/ui/Spinner';
import { getStatusBadgeClass, formatStatus } from '../styles/theme';
import Badge from '../components/ui/Badge';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Legend,
} from 'recharts';

const CHART = ['#a21caf', '#7c3aed', '#4f46e5', '#f59e0b', '#10b981', '#ef4444'];

const TABS = [
    { key: 'analytics', label: 'Reports & Analytics', icon: TrendingUp },
    { key: 'statistics', label: 'Complaint Statistics', icon: BarChart3 },
    { key: 'status', label: 'Complaint Status', icon: RefreshCw },
    { key: 'generate', label: 'Generate Reports', icon: FileText },
];

const AdminReports = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'analytics';
    const [analytics, setAnalytics] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [aRes, cRes] = await Promise.all([
                    api.get('dashboard/principal/analytics/'),
                    api.get('complaints/all/'),
                ]);
                setAnalytics(aRes.data || {});
                setComplaints(Array.isArray(cRes.data?.results) ? cRes.data.results
                    : (Array.isArray(cRes.data) ? cRes.data : []));
                setError(null);
            } catch { setError('Failed to load analytics data.'); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const setTab = (k) => setSearchParams({ tab: k });

    const statusData = (analytics?.statusBreakdown || []).map((s) => ({ name: formatStatus(s.status), value: s.count }));
    const trendData = analytics?.monthlyTrend || [];
    const categoryData = analytics?.categoryDistribution || [];
    const deptData = analytics?.departmentPerformance || [];

    const byStatus = useMemo(() => {
        const m = {};
        complaints.forEach((c) => { const s = (c.status || 'Unknown').toLowerCase(); m[s] = (m[s] || 0) + 1; });
        return m;
    }, [complaints]);

    if (loading) return <Spinner label="Loading analytics..." />;

    return (
        <MainLayout title="Reports & Analytics">
            {error && <div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl mb-6">{error}</div>}

            <div className="flex flex-wrap gap-2 mb-6">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.key;
                    return (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                                active ? 'bg-fuchsia-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                            <Icon size={16} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {tab === 'analytics' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Kpi label="Total Complaints" value={analytics?.total || 0} />
                        <Kpi label="Resolution Rate" value={`${analytics?.resolutionRate ?? 0}%`} />
                        <Kpi label="Pending" value={analytics?.pending || 0} />
                        <Kpi label="Escalated" value={analytics?.critical || 0} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Complaint Volume Trend">
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a21caf" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#a21caf" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} dy={8} />
                                    <YAxis axisLine={false} tickLine={false} dx={-8} allowDecimals={false} />
                                    <RechartsTooltip />
                                    <Area type="monotone" dataKey="complaints" stroke="#a21caf" strokeWidth={3} fill="url(#ar)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Status Distribution">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                                        {statusData.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Category Breakdown">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={3}>
                                        {categoryData.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Department Performance">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={deptData} barSize={16}>
                                    <XAxis dataKey="department" axisLine={false} tickLine={false} dy={8} />
                                    <YAxis axisLine={false} tickLine={false} dx={-8} allowDecimals={false} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                    <Legend />
                                    <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="escalated" fill="#ef4444" name="Escalated" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                </div>
            )}

            {tab === 'statistics' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-1">
                        <h3 className="font-bold text-slate-800 mb-4">By Status</h3>
                        <div className="space-y-3">
                            {Object.entries(byStatus).map(([s, n]) => (
                                <div key={s} className="flex items-center justify-between">
                                    <Badge className={getStatusBadgeClass(s)}>{formatStatus(s)}</Badge>
                                    <span className="font-bold text-slate-700">{n}</span>
                                </div>
                            ))}
                            {Object.keys(byStatus).length === 0 && <p className="text-sm text-slate-400">No data.</p>}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                        <h3 className="font-bold text-slate-800 mb-4">By Department</h3>
                        <div className="space-y-3">
                            {deptData.map((d) => (
                                <div key={d.department} className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="text-sm font-medium text-slate-700">{d.department}</span>
                                    <span className="text-xs text-slate-500">Resolved {d.resolved} · Pending {d.pending} · Esc {d.escalated}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'status' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider bg-slate-50/50">
                                <th className="p-4 font-semibold">ID</th>
                                <th className="p-4 font-semibold">Title</th>
                                <th className="p-4 font-semibold">Department</th>
                                <th className="p-4 font-semibold">Category</th>
                                <th className="p-4 font-semibold">Priority</th>
                                <th className="p-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {complaints.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No complaints recorded.</td></tr>
                            ) : complaints.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-bold text-slate-600">#{c.id}</td>
                                    <td className="p-4 font-medium text-slate-800">{c.title}</td>
                                    <td className="p-4 text-slate-500">{c.department}</td>
                                    <td className="p-4 text-slate-500">{c.category}</td>
                                    <td className="p-4"><Badge className={getStatusBadgeClass(c.status)}>{formatStatus(c.status)}</Badge></td>
                                    <td className="p-4 text-slate-500">{c.priority || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'generate' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 print-area">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Campus Complaint Report</h2>
                            <p className="text-sm text-slate-400">Generated {new Date().toLocaleString()}</p>
                        </div>
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-fuchsia-600 text-white font-semibold hover:bg-fuchsia-700">
                            <Printer size={16} /> Print / Save PDF
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Kpi label="Total" value={analytics?.total || 0} />
                        <Kpi label="Resolved" value={analytics?.resolved || 0} />
                        <Kpi label="Pending" value={analytics?.pending || 0} />
                        <Kpi label="Escalated" value={analytics?.critical || 0} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-3">Status Summary</h3>
                    <ul className="space-y-2">
                        {Object.entries(byStatus).map(([s, n]) => (
                            <li key={s} className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-slate-600">{formatStatus(s)}</span><span className="font-semibold">{n}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </MainLayout>
    );
};

const Kpi = ({ label, value }) => (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <p className="text-2xl font-black text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
);

const ChartCard = ({ title, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
        {children}
    </div>
);

export default AdminReports;
