import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { getPriorityBadgeClass, getStatusBadgeClass, formatStatus } from '../styles/theme';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import {
    Inbox, TrendingUp, Clock, AlertCircle, Search, Eye, RefreshCw, Building2, ShieldAlert,
} from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Legend,
} from 'recharts';

const PrincipalDashboard = () => {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const CHART = ['#a21caf', '#7c3aed', '#4f46e5', '#f59e0b', '#10b981', '#ef4444'];
    const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const [aRes, cRes] = await Promise.all([
                api.get('dashboard/principal/analytics/'),
                api.get('complaints/all/'),
            ]);
            const a = aRes.data || {};
            setAnalytics({
                total: a.total || 0,
                today: a.today || 0,
                pending: a.pending || 0,
                resolved: a.resolved || 0,
                critical: a.critical || 0,
                lostFound: a.lostFound || 0,
                resolutionRate: a.resolutionRate ?? (a.total ? Math.round((a.resolved / a.total) * 100) : 0),
                activeDepartments: a.activeDepartments ?? (a.departmentPerformance || []).length,
                statusBreakdown: a.statusBreakdown || [],
                monthlyTrend: a.monthlyTrend || [],
                categoryDistribution: a.categoryDistribution || [],
                departmentPerformance: a.departmentPerformance || [],
            });
            const list = Array.isArray(cRes.data?.results)
                ? cRes.data.results
                : (Array.isArray(cRes.data) ? cRes.data : []);
            setComplaints(list);
            setError(null);
        } catch {
            setError('Failed to load campus analytics.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const watchlist = useMemo(() => complaints
        .filter((c) => c.status === 'Escalated' || (c.priority && ['High', 'Critical'].includes(c.priority)))
        .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0))
        .slice(0, 5), [complaints, priorityWeight]);

    const highPriority = useMemo(() => [...complaints]
        .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0))
        .slice(0, 8), [complaints, priorityWeight]);

    const statusData = useMemo(() => (analytics
        ? analytics.statusBreakdown.map((s) => ({ name: formatStatus(s.status), key: s.status, value: s.count }))
        : []), [analytics]);
    const trendData = analytics?.monthlyTrend || [];
    const categoryData = analytics?.categoryDistribution || [];
    const deptData = analytics?.departmentPerformance || [];

    if (loading) return <Spinner label="Loading Campus Command Center..." />;
    if (error) return (
        <MainLayout title="Principal Dashboard">
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-8 rounded-2xl text-center max-w-md mx-auto">{error}</div>
        </MainLayout>
    );
    if (!analytics) return null;

    const kpis = [
        { title: 'Total Complaints', value: analytics.total, icon: Inbox, grad: 'from-fuchsia-600 to-purple-600', sub: `${analytics.today} filed today` },
        { title: 'Resolution Rate', value: `${analytics.resolutionRate}%`, icon: TrendingUp, grad: 'from-violet-600 to-indigo-600', sub: `${analytics.resolved} resolved` },
        { title: 'Pending Review', value: analytics.pending, icon: Clock, grad: 'from-amber-500 to-orange-600', sub: 'Awaiting action' },
        { title: 'Escalated', value: analytics.critical, icon: AlertCircle, grad: 'from-rose-600 to-red-600', sub: 'Need attention' },
        { title: 'Active Departments', value: analytics.activeDepartments, icon: Building2, grad: 'from-emerald-600 to-teal-600', sub: 'Across campus' },
        { title: 'Lost & Found', value: analytics.lostFound, icon: Search, grad: 'from-slate-600 to-slate-700', sub: 'Items tracked' },
    ];

    return (
        <MainLayout title="Principal Dashboard">
            {/* Executive hero header */}
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-700 via-purple-700 to-indigo-700 p-6 mb-6 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">Campus Executive Command Center</p>
                    <h1 className="text-2xl font-bold mt-1">Welcome, {user?.name || 'Principal'}</h1>
                    <p className="text-sm text-white/80 mt-1">Strategic oversight of campus operations, escalations and resolution performance.</p>
                </div>
                <button onClick={fetchData} disabled={refreshing}
                    className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur transition">
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {kpis.map((k) => (
                    <div key={k.title} className={`bg-gradient-to-br ${k.grad} rounded-2xl p-4 text-white shadow-md`}>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">{k.title}</p>
                            <k.icon size={16} />
                        </div>
                        <p className="text-2xl font-bold leading-none">{k.value}</p>
                        <p className="text-[11px] opacity-80 mt-1">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Trend + status distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Complaint Volume Trend</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="pcTrend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a21caf" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#a21caf" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} dy={8} />
                            <YAxis axisLine={false} tickLine={false} dx={-8} allowDecimals={false} />
                            <RechartsTooltip />
                            <Area type="monotone" dataKey="complaints" stroke="#a21caf" strokeWidth={3} fill="url(#pcTrend)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={190}>
                        <PieChart>
                            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
                                {statusData.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                            </Pie>
                            <RechartsTooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
                        {statusData.map((s, i) => (
                            <span key={s.key} className="flex items-center gap-1 text-xs text-slate-500">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART[i % CHART.length] }}></span>
                                {s.name} ({s.value})
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Department performance + category */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Department Resolution Performance</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={deptData} barSize={18}>
                            <XAxis dataKey="department" axisLine={false} tickLine={false} dy={8} />
                            <YAxis axisLine={false} tickLine={false} dx={-8} allowDecimals={false} />
                            <RechartsTooltip cursor={{ fill: 'transparent' }} />
                            <Legend />
                            <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="escalated" fill="#ef4444" name="Escalated" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Category Breakdown</h3>
                    <ResponsiveContainer width="100%" height={190}>
                        <PieChart>
                            <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78} paddingAngle={3}>
                                {categoryData.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                            </Pie>
                            <RechartsTooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
                        {categoryData.map((c, i) => (
                            <span key={c.name} className="flex items-center gap-1 text-xs text-slate-500">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART[i % CHART.length] }}></span>
                                {c.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Watchlist + high-priority table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert size={18} className="text-fuchsia-600" />
                        <h3 className="text-lg font-bold text-slate-800">Executive Watchlist</h3>
                    </div>
                    {watchlist.length === 0 ? (
                        <p className="text-sm text-slate-500">No escalated or critical items. Campus is stable.</p>
                    ) : watchlist.map((c) => (
                        <div key={c.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                            <div className="min-w-0 pr-2">
                                <p className="text-sm font-semibold text-slate-800 truncate">{c.title}</p>
                                <p className="text-xs text-slate-500 truncate">{c.department} · {c.student_name || c.reporter || '—'}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Badge className={getStatusBadgeClass(c.status)}>{formatStatus(c.status)}</Badge>
                                <button onClick={() => setSelectedComplaint(c.id)} className="text-fuchsia-600 hover:text-fuchsia-800">
                                    <Eye size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                    <h3 className="text-lg font-bold text-slate-800 p-6 pb-3">Recent High-Priority Issues</h3>
                    <table className="w-full text-left border-collapse min-w-[640px]">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider bg-slate-50/50">
                                <th className="p-4 font-semibold">ID</th>
                                <th className="p-4 font-semibold">Reporter & Dept</th>
                                <th className="p-4 font-semibold">Category</th>
                                <th className="p-4 font-semibold">Priority</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {highPriority.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No high-priority issues recorded.</td></tr>
                            ) : highPriority.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-bold text-slate-600">#{c.id}</td>
                                    <td className="p-4">
                                        <p className="font-medium text-slate-800">{c.student_name || c.reporter || 'Student'}</p>
                                        <p className="text-xs text-slate-500">{c.department || 'General'}</p>
                                    </td>
                                    <td className="p-4 font-medium text-slate-600">{c.category || 'General'}</td>
                                    <td className="p-4"><Badge className={getPriorityBadgeClass(c.priority)}>{c.priority || 'Low'}</Badge></td>
                                    <td className="p-4"><Badge className={getStatusBadgeClass(c.status)}>{formatStatus(c.status)}</Badge></td>
                                    <td className="p-4">
                                        <button onClick={() => setSelectedComplaint(c.id)}
                                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-fuchsia-50 hover:text-fuchsia-600">
                                            <Eye size={14} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedComplaint && (
                <ComplaintDetailModal complaintId={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
            )}
        </MainLayout>
    );
};

export default PrincipalDashboard;
