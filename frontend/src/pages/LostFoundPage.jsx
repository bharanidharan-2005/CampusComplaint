import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Check, X, PackageX, PackageCheck, ClipboardList } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

const LostFoundPage = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const view = searchParams.get('view') || 'student';

    const isStudent = view === 'student';
    const isManage = view === 'manage';
    const isOverview = view === 'overview';
    const isLost = view === 'lost';
    const isFound = view === 'found';

    const [me, setMe] = useState(null);
    const [items, setItems] = useState({ lost: [], found: [] });
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ type: 'Lost', item_name: '', description: '', location: '', category: 'Other', date: '' });
    const [claimFilter, setClaimFilter] = useState('Pending');

    useEffect(() => { api.get('profile/').then((r) => setMe(r.data.id)).catch(() => {}); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const m = await api.get('lost-found/manage/');
            setItems({ lost: m.data.lost || [], found: m.data.found || [] });
            if (isManage || isOverview) {
                const c = await api.get('lost-found/claims/?status=' + (isManage ? claimFilter : ''));
                setClaims(c.data || []);
            }
        } catch { } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [view, claimFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const allItems = useMemo(() => [
        ...items.lost.map((i) => ({ ...i, kind: 'Lost' })),
        ...items.found.map((i) => ({ ...i, kind: 'Found' })),
    ], [items]);

    const myItems = useMemo(() => allItems.filter((i) => i.reported_by === me), [allItems, me]);

    const displayItems = useMemo(
        () => isLost ? allItems.filter((i) => i.kind === 'Lost')
            : isFound ? allItems.filter((i) => i.kind === 'Found') : allItems,
        [allItems, isLost, isFound]
    );

    const submitForm = async () => {
        try {
            await api.post('lost-found/', {
                type: form.type, item_name: form.item_name, description: form.description,
                location: form.location, category: form.category, date: form.date || undefined,
            });
            setShowForm(false);
            setForm({ type: 'Lost', item_name: '', description: '', location: '', category: 'Other', date: '' });
            load();
        } catch { alert('Failed to submit report.'); }
    };

    const updateItemStatus = async (id, status) => {
        try { await api.patch(`lost-found/${id}/`, { status }); load(); }
        catch { alert('Failed to update.'); }
    };

    const actOnClaim = async (id, action) => {
        try { await api.patch(`lost-found/claims/${id}/`, { action }); load(); }
        catch { alert('Failed to process claim.'); }
    };

    if (loading) return <Spinner label="Loading Lost & Found..." />;

    if (isOverview) {
        const total = allItems.length;
        const openClaims = claims.filter((c) => c.status === 'Pending').length;
        return (
            <MainLayout title="Lost & Found Overview">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Stat label="Total Items" value={total} tone="indigo" />
                    <Stat label="Lost" value={items.lost.length} tone="amber" />
                    <Stat label="Found" value={items.found.length} tone="emerald" />
                    <Stat label="Open Claims" value={openClaims} tone="blue" />
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-800 mb-3">Recent Items</h3>
                    <div className="divide-y divide-slate-100 max-h-96 overflow-auto">
                        {allItems.slice(0, 20).map((i) => (
                            <div key={i.item_id} className="flex justify-between items-center py-2.5">
                                <span className="text-sm font-medium text-slate-700">{i.title} <Badge className="ml-2 bg-slate-100 text-slate-500">{i.kind}</Badge></span>
                                <StatusBadge status={i.status} />
                            </div>
                        ))}
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title={isStudent ? 'Lost & Found' : isLost ? 'Lost Items' : isFound ? 'Found Items' : 'Lost & Found Management'}>
            {isStudent && (
                <button onClick={() => setShowForm((s) => !s)} className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                    <Plus size={18} /> Report Lost / Found Item
                </button>
            )}

            {isManage && (
                <div className="flex gap-3 mb-6">
                    {['Pending', 'Approved', 'Rejected', 'All'].map((s) => (
                        <button key={s} onClick={() => setClaimFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${claimFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s} Claims</button>
                    ))}
                </div>
            )}

            {isStudent && showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                    <h3 className="font-bold text-slate-800 mb-4">Report an Item</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
                            <option>Lost</option><option>Found</option>
                        </select>
                        <input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="Item name" className="border border-slate-200 rounded-lg px-3 py-2" />
                        <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="border border-slate-200 rounded-lg px-3 py-2" />
                        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category (e.g. Electronics)" className="border border-slate-200 rounded-lg px-3 py-2" />
                        <input type={form.type === 'Found' ? 'date' : 'date'} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2" />
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="border border-slate-200 rounded-lg px-3 py-2 md:col-span-2" />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100">Cancel</button>
                        <button onClick={submitForm} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">Submit</button>
                    </div>
                </div>
            )}

            {isStudent && (
                <div className="mb-8">
                    <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><PackageX size={18} /> My Reports</h3>
                    {myItems.length === 0 ? <EmptyState icon={Search} title="No reports yet" description="Report a lost or found item above." /> : (
                        <div className="grid md:grid-cols-2 gap-4">{myItems.map((i) => <ItemCard key={i.item_id} item={i} />)}</div>
                    )}
                </div>
            )}

            {isManage && (
                <div className="mb-8">
                    <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><ClipboardList size={18} /> Claim Requests</h3>
                    {claims.length === 0 ? <EmptyState icon={ClipboardList} title="No claims" description={`No ${claimFilter} claims.`} /> : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                            {claims.map((c) => {
                                const it = allItems.find((x) => String(x.item_id) === String(c.item_id) && x.kind === c.item_type);
                                return (
                                    <div key={c.claim_id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{it ? it.title : `Item #${c.item_id}`} <Badge className="ml-2 bg-slate-100 text-slate-500">{c.item_type}</Badge></p>
                                            <p className="text-xs text-slate-500">{c.proof_description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={c.status} />
                                            {c.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => actOnClaim(c.claim_id, 'approve')} className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"><Check size={16} /></button>
                                                    <button onClick={() => actOnClaim(c.claim_id, 'reject')} className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"><X size={16} /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">{isStudent ? <PackageCheck size={18} /> : <PackageX size={18} />} {isStudent ? 'Browse All Items' : isLost ? 'Lost Items' : isFound ? 'Found Items' : 'All Reported Items'}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayItems.map((i) => (
                    <ItemCard key={i.item_id} item={i} manage={isManage} onResolve={() => updateItemStatus(i.item_id, 'Resolved')} />
                ))}
            </div>
        </MainLayout>
    );
};

const ItemCard = ({ item, manage, onResolve }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-slate-800">{item.title}</h4>
            <Badge className={item.kind === 'Lost' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}>{item.kind}</Badge>
        </div>
        <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
        <p className="text-xs text-slate-400 mt-2">📍 {item.location} · {item.date_reported || item.date_found}</p>
        <div className="flex items-center justify-between mt-3">
            <StatusBadge status={item.status} />
            {manage && item.status !== 'Resolved' && (
                <button onClick={onResolve} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600">Mark Resolved</button>
            )}
        </div>
    </div>
);

const Stat = ({ label, value, tone }) => {
    const tones = {
        indigo: 'text-indigo-600', amber: 'text-amber-600', emerald: 'text-emerald-600', blue: 'text-blue-600',
    };
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className={`text-3xl font-bold ${tones[tone] || 'text-slate-800'}`}>{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
        </div>
    );
};

export default LostFoundPage;
