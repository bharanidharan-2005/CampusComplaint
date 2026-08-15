import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, AlertTriangle, ShieldCheck, Eye, RefreshCw, Trash2, GraduationCap, FileText } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import ComplaintDetailModal from '../components/ComplaintDetailModal';

const HodDashboard = () => {
    const [data, setData] = useState({ stats: {}, department_activity: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const [activeTab, setActiveTab] = useState('complaints');
    const [searchParams] = useSearchParams();
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [deletingStudentId, setDeletingStudentId] = useState(null);

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const response = await api.get('dashboard/hod/');
            setData(response.data || { stats: {}, department_activity: [] });
        } catch (err) {
            console.error('Error fetching HOD data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
            const response = await api.get('students/');
            setStudents(response.data || []);
        } catch (err) {
            console.error('Error fetching student list:', err);
        } finally {
            setLoadingStudents(false);
        }
    };

    useEffect(() => { fetchData(); fetchStudents(); }, []);

    // Deep-link: ?tab=students / ?tab=complaints selects the matching tab.
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'students' || tab === 'complaints') setActiveTab(tab);
    }, [searchParams]);

    const handleStatusChange = async (complaintId, newStatus) => {
        setUpdatingId(complaintId);
        try {
            await api.patch(`complaints/${complaintId}/status/`, { status: newStatus });
            setData((prev) => ({
                ...prev,
                department_activity: (prev.department_activity || []).map((item) =>
                    item.id === complaintId ? { ...item, status: newStatus } : item),
            }));
        } catch (err) {
            alert('Failed to update complaint status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteStudent = async (studentId) => {
        if (!window.confirm('Are you sure you want to deactivate this student account?')) return;
        setDeletingStudentId(studentId);
        try {
            await api.delete(`students/${studentId}/delete/`);
            setStudents((prev) => prev.filter((s) => s.id !== studentId && s.student_id !== studentId));
            alert('Student account deactivated successfully.');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to deactivate student account.');
        } finally {
            setDeletingStudentId(null);
        }
    };

    if (loading) return <Spinner label="Loading Department Overview..." />;

    const studentComplaints = data.student_complaints || [];
    const facultyComplaints = data.faculty_complaints || [];

    const renderComplaintRow = (item, keyPrefix) => (
        <tr key={`${keyPrefix}-${item.id}`} className="hover:bg-slate-50 transition">
            <td className="py-4 px-3 font-medium text-slate-800">
                {item.title || 'Untitled Complaint'}
                {item.student_name && <span className="block text-xs text-slate-500 mt-0.5">{item.student_name}</span>}
                {item.faculty_name && <span className="block text-xs text-slate-500 mt-0.5">{item.faculty_name}</span>}
            </td>
            <td className="py-4 px-3 text-slate-500 text-sm">{item.register_number || item.faculty_name || '—'}</td>
            <td className="py-4 px-3 text-slate-500 text-sm">{item.department}</td>
            <td className="py-4 px-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedComplaint(item.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                        <Eye size={14} /> View
                    </button>
                    <select value={item.status || 'Pending'} disabled={updatingId === item.id}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
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
        <MainLayout title="HOD Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Department Staff" value={data.stats?.total_staff ?? data.stats?.department_staff ?? 0} icon={Users} tone="indigo" />
                <StatCard label="Active Issues" value={data.stats?.active_complaints ?? data.stats?.active_issues ?? 0} icon={AlertTriangle} tone="amber" />
                <StatCard label="Resolved" value={data.stats?.resolved_this_month ?? 0} icon={ShieldCheck} tone="emerald" />
            </div>

            <div className="flex border-b border-slate-200 mb-6 gap-2">
                {[
                    { id: 'complaints', label: `Complaints (${studentComplaints.length + facultyComplaints.length})`, icon: FileText },
                    { id: 'students', label: `Manage Students (${students.length})`, icon: GraduationCap },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}>
                            <Icon size={18} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'complaints' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Student Complaints ({studentComplaints.length})</h2>
                            <button onClick={fetchData} disabled={refreshing}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                                <RefreshCw size={16} className={refreshing ? 'animate-spin text-indigo-600' : ''} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="pb-3 px-3 font-semibold">Issue / Title</th>
                                        <th className="pb-3 px-3 font-semibold">Reg. No</th>
                                        <th className="pb-3 px-3 font-semibold">Dept & Year</th>
                                        <th className="pb-3 px-3 font-semibold">Action / Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {studentComplaints.length > 0 ? studentComplaints.map((i) => renderComplaintRow(i, 's'))
                                        : <tr><td colSpan={4} className="py-8 text-center text-slate-500">No student complaints recorded.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Faculty Complaints ({facultyComplaints.length})</h2>
                            <span className="text-xs text-slate-400">Staff-raised issues shown separately</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="pb-3 px-3 font-semibold">Issue / Title</th>
                                        <th className="pb-3 px-3 font-semibold">Faculty</th>
                                        <th className="pb-3 px-3 font-semibold">Department</th>
                                        <th className="pb-3 px-3 font-semibold">Action / Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {facultyComplaints.length > 0 ? facultyComplaints.map((i) => renderComplaintRow(i, 'f'))
                                        : <tr><td colSpan={4} className="py-8 text-center text-slate-500">No faculty complaints recorded.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'students' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Registered Students</h2>
                        <button onClick={fetchStudents} disabled={loadingStudents}
                            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                            <RefreshCw size={16} className={loadingStudents ? 'animate-spin text-indigo-600' : ''} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="pb-3 px-3 font-semibold">Student Name</th>
                                    <th className="pb-3 px-3 font-semibold">Register No.</th>
                                    <th className="pb-3 px-3 font-semibold">Dept & Year</th>
                                    <th className="pb-3 px-3 font-semibold">Email</th>
                                    <th className="pb-3 px-3 font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.length > 0 ? students.map((student) => {
                                    const targetId = student.id || student.student_id;
                                    return (
                                        <tr key={targetId} className="hover:bg-slate-50 transition">
                                            <td className="py-4 px-3 font-medium text-slate-800">{student.name || 'N/A'}</td>
                                            <td className="py-4 px-3 text-slate-500 font-mono text-xs">{student.register_number || 'N/A'}</td>
                                            <td className="py-4 px-3 text-slate-500 text-sm">{student.department || 'General'} {student.year ? `(Year ${student.year})` : ''}</td>
                                            <td className="py-4 px-3 text-slate-500 text-sm">{student.email || 'N/A'}</td>
                                            <td className="py-4 px-3">
                                                <button disabled={deletingStudentId === targetId} onClick={() => handleDeleteStudent(targetId)}
                                                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50">
                                                    {deletingStudentId === targetId ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    Deactivate
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No registered student records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedComplaint && (
                <ComplaintDetailModal complaintId={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
            )}
        </MainLayout>
    );
};

export default HodDashboard;
