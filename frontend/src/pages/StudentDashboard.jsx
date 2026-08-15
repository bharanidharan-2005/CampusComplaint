import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    PlusCircle, Search, Eye, ArrowUpRight, AlertCircle, FileText, Clock, CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import { getStatusStep } from '../styles/theme';

const StudentDashboard = () => {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lostFoundData, setLostFoundData] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const navigate = useNavigate();

    const getLocalUserInfo = () => {
        const userStorage = localStorage.getItem('campusUser');
        if (userStorage) {
            try { return JSON.parse(userStorage); } catch (e) { return null; }
        }
        return null;
    };

    const fetchDashboardInfo = async () => {
        try {
            const [studentRes, lostFoundRes] = await Promise.all([
                api.get('dashboard/student/'),
                api.get('lost-found/'),
            ]);
            setStudentData(studentRes.data);
            const rawLostFound = Array.isArray(lostFoundRes.data) ? lostFoundRes.data : [];
            setLostFoundData(rawLostFound.map((item) => ({
                id: item.item_id || item.id,
                type: item.type || (item.date_reported ? 'Lost' : 'Found'),
                item_name: item.title || item.item_name || 'Unnamed Item',
                category: item.category || 'General',
                date: item.date_reported || item.date_found || item.date || 'N/A',
                status: item.status || 'Open',
            })));
            setError(null);
        } catch (err) {
            setError((err.response && err.response.data && err.response.data.message) || 'Failed to fetch dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDashboardInfo(); }, []);

    const localUser = getLocalUserInfo();
    const activeEmail = studentData?.email || studentData?.user?.email || localUser?.email || localStorage.getItem('email');
    const extractNameFromEmail = (email) => {
        if (!email) return null;
        const match = email.match(/^([a-zA-Z]+)\d{4,5}@mountzion\.ac\.in$/i);
        if (match && match[1]) {
            const raw = match[1];
            return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        }
        return null;
    };
    const displayUsername =
        extractNameFromEmail(activeEmail) ||
        studentData?.name || localUser?.name || activeEmail || 'Student';

    const filteredComplaints = (studentData?.recentComplaints || []).filter((item) => {
        const matchesSearch = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' ? true :
            statusFilter === 'Pending' ? (item.status === 'Pending' || item.status === 'Submitted') :
                item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <Spinner label="Loading Student Workspace..." />;
    if (error) {
        return (
            <MainLayout title="Student Dashboard">
                <div className="text-center p-8 bg-white border border-red-100 rounded-2xl shadow-sm max-w-md mx-auto">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Unable to Load Dashboard</h3>
                    <p className="text-slate-500 text-sm mb-6">{error}</p>
                    <button onClick={() => fetchDashboardInfo(true)}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl">
                        Try Again
                    </button>
                </div>
            </MainLayout>
        );
    }
    if (!studentData) return null;

    return (
        <MainLayout title="Student Dashboard">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-800">
                    Welcome, {displayUsername}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    {studentData.registerNumber && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-lg text-xs font-bold">
                            {studentData.registerNumber}
                        </span>
                    )}
                    {studentData.department ? (
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-medium">
                            {studentData.department}{studentData.year && ` • Year ${studentData.year}`}
                        </span>
                    ) : (
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-medium">
                            {activeEmail || 'No Email Provided'}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button onClick={() => navigate('/student/submit-complaint')}
                    className="group bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg transition-all flex items-center justify-between">
                    <div>
                        <span className="text-indigo-200 text-xs font-bold tracking-wider uppercase block">Quick Action</span>
                        <h3 className="text-xl font-bold mt-1">File Campus Complaint</h3>
                        <p className="text-indigo-100 text-sm opacity-90">Report infrastructure, academics or hostel issues</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl"><PlusCircle size={28} /></div>
                </button>
                <button onClick={() => navigate('/student/lost-found')}
                    className="group bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg transition-all flex items-center justify-between">
                    <div>
                        <span className="text-amber-100 text-xs font-bold tracking-wider uppercase block">Quick Action</span>
                        <h3 className="text-xl font-bold mt-1">Lost & Found Portal</h3>
                        <p className="text-amber-100 text-sm opacity-90">Report misplaced items or list discoveries</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl"><Search size={28} /></div>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Raised" value={studentData.totalComplaints || 0} icon={FileText} tone="indigo"
                    onClick={() => setStatusFilter('All')} active={statusFilter === 'All'} />
                <StatCard label="In Progress" value={studentData.inProgress || 0} icon={Clock} tone="blue"
                    onClick={() => setStatusFilter('In Progress')} active={statusFilter === 'In Progress'} />
                <StatCard label="Resolved" value={studentData.resolved || 0} icon={CheckCircle} tone="emerald"
                    onClick={() => setStatusFilter('Resolved')} active={statusFilter === 'Resolved'} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">My Complaints</h3>
                            <p className="text-slate-400 text-xs">Track real-time progress and resolutions</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Search title..." value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full" />
                            </div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none">
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                    </div>

                    {filteredComplaints.length === 0 ? (
                        <EmptyState icon={FileText} title="No complaints found"
                            description="Try adjusting your filters or raise a new complaint." />
                    ) : (
                        <div className="overflow-x-auto flex-grow">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-semibold">ID</th>
                                        <th className="p-4 font-semibold">Complaint</th>
                                        <th className="p-4 font-semibold">Tracker</th>
                                        <th className="p-4 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredComplaints.map((item, idx) => {
                                        const rawId = item.id ?? item.complaintId ?? item.pk ?? idx + 1;
                                        const step = getStatusStep(item.status);
                                        return (
                                            <tr key={rawId} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 text-xs font-bold text-slate-400">#{rawId}</td>
                                                <td className="p-4">
                                                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{item.category || 'General'}</span>
                                                        <span className="text-xs text-slate-400">{item.date || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 min-w-[200px]">
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <StatusBadge status={item.status} />
                                                            <span className="text-slate-400 font-medium">{step}/3</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => setSelectedComplaint(rawId)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600">
                                                        <Eye size={14} /> View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">My Lost & Found</h3>
                        <button onClick={() => navigate('/student/lost-found')}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
                            Open Portal <ArrowUpRight size={14} />
                        </button>
                    </div>
                    {lostFoundData.length === 0 ? (
                        <EmptyState icon={Search} title="No items reported"
                            description="Found or lost belongings will appear here." />
                    ) : (
                        <div className="divide-y divide-slate-100 overflow-y-auto max-h-[480px]">
                            {lostFoundData.map((item, idx) => (
                                <div key={item.id || idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.type === 'Found' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-slate-400">{item.category}</span>
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-800">{item.item_name}</h4>
                                        <p className="text-xs text-slate-400 mt-0.5">{item.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedComplaint && (
                <ComplaintDetailModal complaintId={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
            )}
        </MainLayout>
    );
};

export default StudentDashboard;
