import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, AlertOctagon, GraduationCap, Eye, RefreshCw } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { getPriorityBadgeClass } from '../styles/theme';
import ComplaintDetailModal from '../components/ComplaintDetailModal';

const DeanDashboard = () => {
    const [data, setData] = useState({ stats: {}, escalations: [] });
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [searchParams] = useSearchParams();

    const studentRef = useRef(null);
    const facultyRef = useRef(null);

    useEffect(() => {
        const view = searchParams.get('view');
        if (!view) return;
        const target = view === 'faculty' ? facultyRef.current : studentRef.current;
        if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }, [searchParams, data]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('dashboard/dean/');
            setData(response.data);
        } catch (err) {
            console.error('Error fetching Dean data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleStatusChange = async (complaintId, newStatus) => {
        setUpdatingId(complaintId);
        try {
            await api.patch(`complaints/${complaintId}/status/`, { status: newStatus });
            setData((prev) => ({
                ...prev,
                escalations: (prev.escalations || []).map((i) => i.id === complaintId ? { ...i, status: newStatus } : i),
                student_escalations: (prev.student_escalations || []).map((i) => i.id === complaintId ? { ...i, status: newStatus } : i),
                faculty_escalations: (prev.faculty_escalations || []).map((i) => i.id === complaintId ? { ...i, status: newStatus } : i),
            }));
        } catch (err) {
            alert('Failed to update status.');
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) return <Spinner label="Loading Academic Overview..." />;

    const studentEsc = data.student_escalations || [];
    const facultyEsc = data.faculty_escalations || [];

    const renderRow = (esc, keyPrefix) => (
        <tr key={`${keyPrefix}-${esc.id}`} className="hover:bg-slate-50 transition">
            <td className="py-4 px-3 font-semibold text-slate-700">{esc.department || 'General'}</td>
            <td className="py-4 px-3 text-slate-800 font-medium">
                {esc.issue || esc.title || 'Untitled Issue'}
                <span className="block text-xs text-slate-500 mt-0.5">{esc.student_name || esc.faculty_name}</span>
            </td>
            <td className="py-4 px-3 text-slate-500 font-mono text-xs">{esc.register_number || '—'}</td>
            <td className="py-4 px-3">
                <Badge className={getPriorityBadgeClass(esc.urgency)}>{(esc.urgency || 'Normal')}</Badge>
            </td>
            <td className="py-4 px-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedComplaint(esc.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                        <Eye size={14} /> View
                    </button>
                    <select value={esc.status || 'Pending'} disabled={updatingId === esc.id}
                        onChange={(e) => handleStatusChange(esc.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 focus:outline-none">
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                        <option value="Escalated">Escalated</option>
                    </select>
                </div>
            </td>
        </tr>
    );

    return (
        <MainLayout title="Dean Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Depts Monitored" value={data.stats?.departments_monitored ?? 0} icon={BookOpen} tone="violet" />
                <StatCard label="Escalated Issues" value={data.stats?.escalated_issues ?? data.escalated_issues_count ?? 0} icon={AlertOctagon} tone="rose" />
                <StatCard label="Total Students" value={data.stats?.total_students ?? 0} icon={GraduationCap} tone="blue" />
            </div>

            <div className="space-y-6">
                <div ref={studentRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Student Complaints ({studentEsc.length})</h2>
                        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                            <RefreshCw size={16} className="text-indigo-600" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="pb-3 px-3 font-semibold">Department</th>
                                    <th className="pb-3 px-3 font-semibold">Issue / Title</th>
                                    <th className="pb-3 px-3 font-semibold">Reg. No</th>
                                    <th className="pb-3 px-3 font-semibold">Urgency</th>
                                    <th className="pb-3 px-3 font-semibold">Action / Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {studentEsc.length > 0 ? studentEsc.map((e) => renderRow(e, 's'))
                                    : <tr><td colSpan={5} className="py-8 text-center text-slate-500">No student complaints recorded.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div ref={facultyRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Faculty Complaints ({facultyEsc.length})</h2>
                        <span className="text-xs text-slate-400">Staff-raised issues shown separately</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="pb-3 px-3 font-semibold">Department</th>
                                    <th className="pb-3 px-3 font-semibold">Issue / Title</th>
                                    <th className="pb-3 px-3 font-semibold">Faculty</th>
                                    <th className="pb-3 px-3 font-semibold">Urgency</th>
                                    <th className="pb-3 px-3 font-semibold">Action / Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {facultyEsc.length > 0 ? facultyEsc.map((e) => renderRow(e, 'f'))
                                    : <tr><td colSpan={5} className="py-8 text-center text-slate-500">No faculty complaints recorded.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedComplaint && (
                <ComplaintDetailModal complaintId={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
            )}
        </MainLayout>
    );
};

export default DeanDashboard;
