import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('logs/');
                setLogs(response.data);
            } catch (err) {
                setError('Failed to fetch system logs.');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <Spinner label="Fetching Audit Trail..." />;

    return (
        <MainLayout title="System Logs">
            {error && (
                <div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl mb-6">{error}</div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                {logs.length === 0 ? (
                    <EmptyState icon={Search} title="No system logs available" description="Recent activity will appear here." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                                    <th className="py-3 px-4 font-semibold">User Activity</th>
                                    <th className="py-3 px-4 font-semibold">IP / Source</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log, index) => (
                                    <tr key={log.id || index} className="hover:bg-slate-50 transition text-sm">
                                        <td className="py-4 px-4 text-slate-400">{log.timestamp || 'Unknown Time'}</td>
                                        <td className="py-4 px-4 font-medium text-slate-700">{log.action || 'Unknown Action'}</td>
                                        <td className="py-4 px-4 text-slate-400">{log.ip_address || 'System'}</td>
                                        <td className="py-4 px-4">
                                            <Badge tone={log.status === 'Success' ? 'emerald' : 'rose'}>{log.status || 'Logged'}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default SystemLogs;
