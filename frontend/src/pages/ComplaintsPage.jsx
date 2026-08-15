import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, MessageSquarePlus, UserPlus, Search, Filter } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ComplaintDetailModal from '../components/ComplaintDetailModal';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Closed', 'Escalated'];

const ComplaintsPage = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const view = searchParams.get('view') || (isExecutive ? 'all' : 'mine');

    const role = (user?.role || '').toLowerCase();
    const isExecutive = ['dean', 'principal', 'admin'].includes(role);
    const [me, setMe] = useState({ id: null, department: null });
    const [complaints, setComplaints] = useState([]);
    const [users, setUsers] = useState([]);
    const [allDepartments, setAllDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');

    const [remarkComplaint, setRemarkComplaint] = useState(null);
    const [remarks, setRemarks] = useState([]);
    const [remarkText, setRemarkText] = useState('');
    const [assignComplaint, setAssignComplaint] = useState(null);
    const [assignTarget, setAssignTarget] = useState('');
    const [detailId, setDetailId] = useState(null);

    // Resolve the current user's id + department for filtering/assignment.
    useEffect(() => {
        api.get('profile/').then((res) => {
            setMe({ id: res.data.id, department: res.data.department_name });
        }).catch(() => {});
        api.get('users/').then((res) => setUsers(res.data || [])).catch(() => {});
        // Master department list (all departments, even those with no complaints
        // yet) so executives can filter/analyse every department.
        api.get('departments/').then((res) => {
            setAllDepartments((res.data || []).map((d) => d.name).filter(Boolean));
        }).catch(() => {});
    }, []);

    // Decide dataset + capability based on role + view.
    const isMine = view === 'mine';
    const canManage = (role === 'faculty' && view === 'manage')
        || (role === 'hod' && (view === 'control' || view === 'department'))
        || role === 'dean' || role === 'principal' || role === 'admin';
    const canAssign = (role === 'faculty' && view === 'manage')
        || (role === 'hod' && (view === 'control' || view === 'department'));

    // Show the "Assigned To" column only when the user can act on assignment
    // (HOD/Faculty) or owns the complaint (Student). Executives (Dean/Principal/
    // Admin) cannot assign, so the column would just render an empty "—".
    const showAssignedTo = canAssign || role === 'student' || isMine;

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = isMine
                ? 'complaints/'
                : (role === 'faculty' && view === 'manage')
                    ? 'complaints/faculty/'
                    : 'complaints/all/';
            const res = await api.get(url);
            setComplaints(res.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load complaints.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [view, role, me.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = useMemo(() => {
        let list = [...complaints];
        if (view === 'manage' && role !== 'faculty') list = list.filter((c) => c.assigned_to === me.id);
        else if (view === 'department') list = list.filter((c) => c.department === me.department);
        else if (view === 'control') list = list.filter((c) => c.department === me.department);
        else if (view === 'escalated') list = list.filter((c) => c.status === 'Escalated');

        if (statusFilter !== 'All') list = list.filter((c) => c.status === statusFilter);
        if (deptFilter !== 'All') list = list.filter((c) => c.department === deptFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((c) =>
                (c.title || '').toLowerCase().includes(q) ||
                (c.category || '').toLowerCase().includes(q) ||
                (c.department || '').toLowerCase().includes(q));
        }
        return list;
    }, [complaints, view, me.id, me.department, statusFilter, deptFilter, search]);

    const departments = useMemo(
        () => ['All', ...Array.from(new Set(complaints.map((c) => c.department).filter(Boolean)))],
        [complaints]
    );

    // Department-wise analysis for executives (Dean / Principal / Admin): every
    // department (from the master list, including ones with no complaints yet)
    // with its total and status breakdown, so they can analyse complaints across
    // all departments, not just their own.
    const deptAnalysis = useMemo(() => {
        if (!isExecutive) return [];
        const map = {};
        allDepartments.forEach((d) => {
            map[d] = { department: d, total: 0, pending: 0, inProgress: 0, resolved: 0, escalated: 0 };
        });
        complaints.forEach((c) => {
            const d = c.department || 'Unknown';
            const bucket = map[d] || (map[d] = { department: d, total: 0, pending: 0, inProgress: 0, resolved: 0, escalated: 0 });
            bucket.total += 1;
            const s = (c.status || '').toLowerCase();
            if (s === 'pending') bucket.pending += 1;
            else if (s === 'in progress') bucket.inProgress += 1;
            else if (s === 'resolved') bucket.resolved += 1;
            else if (s === 'escalated') bucket.escalated += 1;
        });
        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [complaints, isExecutive, allDepartments]);

    const handleStatus = async (id, status) => {
        try {
            await api.patch(`complaints/${id}/status/`, { status });
            setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
        } catch { alert('Failed to update status.'); }
    };

    const openRemarks = async (c) => {
        setRemarkComplaint(c);
        setRemarkText('');
        try {
            const res = await api.get(`complaints/${c.id}/remarks/`);
            setRemarks(res.data || []);
        } catch { setRemarks([]); }
    };

    const submitRemark = async () => {
        if (!remarkText.trim() || !remarkComplaint) return;
        try {
            const res = await api.post(`complaints/${remarkComplaint.id}/remarks/`, { text: remarkText });
            setRemarks((prev) => [...prev, res.data]);
            setRemarkText('');
            setComplaints((prev) => prev.map((c) => c.id === remarkComplaint.id ? { ...c, remarks: [...(c.remarks || []), res.data] } : c));
        } catch { alert('Failed to add remark.'); }
    };

    const submitAssign = async (forward) => {
        if (!assignComplaint) return;
        try {
            if (forward) {
                await api.post(`complaints/${assignComplaint.id}/assign/`, { forward_to_role: 'Dean' });
            } else {
                await api.post(`complaints/${assignComplaint.id}/assign/`, { user_id: Number(assignTarget) });
            }
            setAssignTarget('');
            setAssignComplaint(null);
            fetchData();
        } catch { alert('Failed to assign/forward.'); }
    };

    const assignableUsers = users.filter((u) => u.role && u.role.toLowerCase() === 'faculty' && u.department === me.department);

    if (loading) return <Spinner label="Loading Complaints..." />;

    return (
        <MainLayout title={view === 'mine' ? 'My Complaints' : view === 'manage' ? 'Complaint Management'
            : view === 'department' ? 'Department Complaints' : view === 'control' ? 'Complaint Control'
            : view === 'escalated' ? 'Escalated Complaints' : 'All Complaints'}>
            {error && <div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl mb-6">{error}</div>}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, category, department..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none">
                    <option>All</option>
                    {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
                {(role === 'dean' || role === 'principal' || role === 'admin') && (
                    <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none">
                        {(isExecutive ? ['All', ...allDepartments] : departments).map((d) => <option key={d}>{d}</option>)}
                    </select>
                )}
            </div>

            {isExecutive && deptAnalysis.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Complaints by Department</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {deptAnalysis.map((d) => (
                            <div key={d.department} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                <p className="text-sm font-bold text-slate-800 truncate">{d.department}</p>
                                <p className="text-2xl font-black text-slate-700 mt-1">{d.total}<span className="text-xs font-medium text-slate-400 ml-1">total</span></p>
                                <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">Pending {d.pending}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">In Prog {d.inProgress}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">Resolved {d.resolved}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200">Esc {d.escalated}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                {filtered.length === 0 ? (
                    <EmptyState icon={Filter} title="No complaints found" description="Try adjusting your filters." />
                ) : (
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider bg-slate-50/50">
                                <th className="p-4 font-semibold">ID</th>
                                <th className="p-4 font-semibold">Title</th>
                                <th className="p-4 font-semibold">Category</th>
                                <th className="p-4 font-semibold">Department</th>
                                <th className="p-4 font-semibold">Raised By</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Priority</th>
                                {showAssignedTo && <th className="p-4 font-semibold">Assigned To</th>}
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-bold text-slate-600">#{c.id}</td>
                                    <td className="p-4 font-medium text-slate-800 max-w-xs truncate">{c.title}</td>
                                    <td className="p-4 text-slate-500">{c.category}</td>
                                    <td className="p-4 text-slate-500">{c.department}</td>
                                    <td className="p-4 text-slate-500">{c.raised_by_role}{c.student_name ? ` · ${c.student_name}` : ''}</td>
                                    <td className="p-4">
                                        {canManage ? (
                                            <select value={c.status} onChange={(e) => handleStatus(c.id, e.target.value)}
                                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 focus:outline-none">
                                                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        ) : (
                                            <StatusBadge status={c.status} />
                                        )}
                                    </td>
                                    <td className="p-4"><Badge className={getPriorityClass(c.priority)}>{c.priority}</Badge></td>
                                    {showAssignedTo && <td className="p-4 text-slate-500">{c.assigned_to_name || c.forwarded_to_name || '—'}</td>}
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setDetailId(c.id)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                                                <Eye size={14} /> View
                                            </button>
                                            <button onClick={() => openRemarks(c)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                                                <MessageSquarePlus size={14} /> Remarks{(c.remarks || []).length > 0 ? ` (${(c.remarks || []).length})` : ''}
                                            </button>
                                            {canAssign && (
                                                <button onClick={() => setAssignComplaint(c)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                                                    <UserPlus size={14} /> Assign
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Remarks Modal */}
            <Modal open={!!remarkComplaint} onClose={() => setRemarkComplaint(null)} title={`Remarks · #${remarkComplaint?.id}`}
                footer={<button onClick={submitRemark} disabled={!remarkText.trim()}
                    className="px-5 py-2 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">Add Remark</button>}>
                {remarkComplaint && (
                    <>
                        <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                            {(remarks || []).length === 0 ? (
                                <p className="text-sm text-slate-400">No remarks yet.</p>
                            ) : remarks.map((r) => (
                                <div key={r.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-sm text-slate-700">{r.text}</p>
                                    <p className="text-xs text-slate-400 mt-1">— {r.user_name} · {new Date(r.created_at).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                        <textarea value={remarkText} onChange={(e) => setRemarkText(e.target.value)} rows={3}
                            placeholder="Add a remark..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                    </>
                )}
            </Modal>

            {/* Assign / Forward Modal */}
            <Modal open={!!assignComplaint} onClose={() => { setAssignComplaint(null); setAssignTarget(''); }} title={`Assign / Forward · #${assignComplaint?.id}`}
                footer={<>
                    <button onClick={() => setAssignComplaint(null)} className="px-5 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                    <button onClick={() => submitAssign(true)} className="px-5 py-2 rounded-xl font-semibold bg-amber-600 text-white hover:bg-amber-700">Forward to Dean</button>
                    <button onClick={() => submitAssign(false)} disabled={!assignTarget} className="px-5 py-2 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">Assign</button>
                </>}>
                {assignComplaint && (
                    <div>
                        <p className="text-sm text-slate-500 mb-3">Assign this complaint to a faculty member in <b>{me.department}</b>, or forward it to the Dean.</p>
                        <select value={assignTarget} onChange={(e) => setAssignTarget(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none">
                            <option value="">Select faculty to assign…</option>
                            {assignableUsers.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                        </select>
                    </div>
                )}
            </Modal>

            {detailId && <ComplaintDetailModal complaintId={detailId} onClose={() => setDetailId(null)} />}
        </MainLayout>
    );
};

const getPriorityClass = (priority) => {
    const map = {
        Critical: 'bg-rose-50 text-rose-700 ring-rose-200',
        High: 'bg-orange-50 text-orange-700 ring-orange-200',
        Medium: 'bg-blue-50 text-blue-700 ring-blue-200',
        Low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    };
    return map[(priority || '').toLowerCase()] || 'bg-slate-100 text-slate-600 ring-slate-200';
};

export default ComplaintsPage;
