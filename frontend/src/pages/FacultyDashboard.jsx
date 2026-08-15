import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    MessageSquare, Clock, Inbox, User, Eye, PlusCircle, Search,
} from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import ComplaintDetailModal from '../components/ComplaintDetailModal';

const FacultyDashboard = () => {
    const [facultyData, setFacultyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const complaintsRef = useRef(null);

    const fetchFacultyData = async () => {
        try {
            const response = await api.get('dashboard/faculty/');
            setFacultyData(response.data);
            setError(null);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Session expired or unauthorized. Please log in again.');
            } else {
                setError('Failed to load dashboard data.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFacultyData(); }, []);

    useEffect(() => {
        const section = searchParams.get('section');
        if (!section) return;
        if (complaintsRef.current) {
            setTimeout(() => complaintsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        }
    }, [searchParams, facultyData]);

    const handleStatusChange = async (complaintId, newStatus) => {
        try {
            await api.patch(`complaints/${complaintId}/status/`, { status: newStatus });
            fetchFacultyData();
        } catch (error) {
            alert('Error updating status. Please try again.');
        }
    };

    if (loading) return <Spinner label="Syncing Faculty Workspace..." />;
    if (error) {
        return (
            <MainLayout title="Faculty Dashboard">
                <div className="text-center p-8 bg-white border border-red-100 rounded-2xl shadow-sm max-w-md mx-auto">
                    <p className="text-red-500 font-semibold mb-6">{error}</p>
                    <button onClick={() => navigate('/login')}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700">
                        Go to Login
                    </button>
                </div>
            </MainLayout>
        );
    }
    if (!facultyData) return null;

    const studentComplaints = facultyData.assignedComplaintsList || [];
    const pendingCount = studentComplaints.filter((c) => c.status === 'Pending').length;
    const resolvedCount = studentComplaints.filter(
        (c) => c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Completed'
    ).length;

    return (
        <MainLayout title="Faculty Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Student Complaints" value={studentComplaints.length} icon={MessageSquare} tone="blue" />
                <StatCard label="Pending" value={pendingCount} icon={Clock} tone="amber" />
                <StatCard label="Resolved" value={resolvedCount} icon={User} tone="emerald" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button onClick={() => navigate('/student/submit-complaint')}
                    className="group bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg transition-all flex items-center justify-between">
                    <div>
                        <span className="text-indigo-200 text-xs font-bold tracking-wider uppercase block">Quick Action</span>
                        <h3 className="text-xl font-bold mt-1">Raise a Complaint</h3>
                        <p className="text-indigo-100 text-sm opacity-90">Report infrastructure, academics or hostel issues</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl"><PlusCircle size={28} /></div>
                </button>
                <button onClick={() => navigate('/student/lost-found')}
                    className="group bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg transition-all flex items-center justify-between">
                    <div>
                        <span className="text-amber-100 text-xs font-bold tracking-wider uppercase block">Quick Action</span>
                        <h3 className="text-xl font-bold mt-1">Lost &amp; Found</h3>
                        <p className="text-amber-100 text-sm opacity-90">Report misplaced items or list discoveries</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl"><Search size={28} /></div>
                </button>
            </div>

            <div ref={complaintsRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Student Complaints</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                        {studentComplaints.length} Total
                    </span>
                </div>
                <div className="p-6">
                    {studentComplaints.length === 0 ? (
                        <EmptyState icon={Inbox} title="No complaints yet" description="Student complaints lodged will appear here for review." />
                    ) : (
                        <div className="space-y-4">
                            {studentComplaints.map((item) => (
                                <div key={item.id} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all flex justify-between items-center gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="bg-slate-100 p-2 rounded-lg mt-0.5">
                                            <User size={18} className="text-slate-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{item.title}</p>
                                            <p className="text-sm font-medium text-slate-500 mt-0.5">
                                                Reg: <span className="text-slate-700">{item.registerNumber}</span>
                                                {item.department && item.department !== 'General' && <span className="text-slate-700"> · {item.department}</span>}
                                                {item.year && item.year !== 'N/A' && <span className="text-slate-700"> · Year {item.year}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => setSelectedComplaint(item.id)}
                                            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                                            <Eye size={14} /> View
                                        </button>
                                        <select value={item.status}
                                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                            className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none">
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
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

export default FacultyDashboard;
