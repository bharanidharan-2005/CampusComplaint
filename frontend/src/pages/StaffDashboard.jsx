import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import api from '../services/api';

const StaffDashboard = () => {
    const [data, setData] = useState({ stats: {}, recent_tasks: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('dashboard/faculty/');
                setData(response.data);
            } catch (err) {
                console.error('Error fetching staff data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Spinner label="Loading Staff Portal..." />;

    const tasks = data.recent_tasks || [];

    return (
        <MainLayout title="Staff Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Assigned Tasks" value={data.stats?.assigned_tasks || 0} icon={ClipboardList} tone="blue" />
                <StatCard label="Completed" value={data.stats?.completed_tasks || 0} icon={CheckCircle} tone="emerald" />
                <StatCard label="Pending Reviews" value={data.stats?.pending_reviews || 0} icon={Clock} tone="amber" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">My Task Queue</h2>
                {tasks.length === 0 ? (
                    <EmptyState icon={ClipboardList} title="No tasks assigned" description="You're all caught up." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="pb-3 font-semibold">Task</th>
                                    <th className="pb-3 font-semibold">Priority</th>
                                    <th className="pb-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-slate-50 transition">
                                        <td className="py-4 font-medium text-slate-800">{task.task}</td>
                                        <td className="py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="py-4"><StatusBadge status={task.status} /></td>
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

export default StaffDashboard;
