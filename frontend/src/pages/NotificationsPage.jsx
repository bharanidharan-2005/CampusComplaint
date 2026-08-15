import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

const NotificationsPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await api.get('notifications/');
            setItems(res.data || []);
        } catch { } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const markRead = async (id) => {
        await api.post('notifications/', { id }).catch(() => {});
        setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    };
    const markAll = async () => {
        await api.post('notifications/', {}).catch(() => {});
        setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    };

    if (loading) return <Spinner label="Loading notifications..." />;

    return (
        <MainLayout title="Notifications">
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-slate-500">{items.filter((i) => !i.is_read).length} unread</p>
                <button onClick={markAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
                    <CheckCheck size={16} /> Mark all read
                </button>
            </div>
            {items.length === 0 ? (
                <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                    {items.map((n) => (
                        <div key={n.id} className={`p-4 flex items-start gap-3 ${n.is_read ? '' : 'bg-indigo-50/40'}`}>
                            <div className={`mt-1 w-2 h-2 rounded-full ${n.is_read ? 'bg-slate-300' : 'bg-indigo-500'}`} />
                            <div className="flex-1">
                                <p className={`text-sm ${n.is_read ? 'text-slate-600' : 'text-slate-800 font-semibold'}`}>{n.message}</p>
                                <p className="text-xs text-slate-400 mt-1">{n.created_at_display || (n.created_at ? new Date(n.created_at).toLocaleString() : '')}</p>
                            </div>
                            {!n.is_read && (
                                <button onClick={() => markRead(n.id)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                                    <Check size={14} /> Read
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    );
};

export default NotificationsPage;
