import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

const SystemRoles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await api.get('roles/');
                setRoles(response.data);
            } catch (err) {
                setError('Failed to fetch role data from the system.');
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, []);

    if (loading) return <Spinner label="Loading Roles..." />;

    return (
        <MainLayout title="System Roles">
            <div className="flex items-center justify-end mb-6">
                <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                    <Plus className="w-4 h-4" /> Create Role
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl mb-6">{error}</div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                {roles.length === 0 ? (
                    <EmptyState icon={MoreVertical} title="No system roles found" description="Roles will appear here once configured." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4 font-semibold">Role Name</th>
                                    <th className="py-3 px-4 font-semibold">Description</th>
                                    <th className="py-3 px-4 font-semibold">User Count</th>
                                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roles.map((role, index) => (
                                    <tr key={role.id || index} className="hover:bg-slate-50 transition">
                                        <td className="py-4 px-4 font-medium text-purple-700">{role.name || 'N/A'}</td>
                                        <td className="py-4 px-4 text-slate-500">{role.description || 'No description provided.'}</td>
                                        <td className="py-4 px-4 text-slate-600">{role.user_count || 0} Users</td>
                                        <td className="py-4 px-4 text-right">
                                            <button className="text-slate-400 hover:text-slate-700 transition">
                                                <MoreVertical className="w-5 h-5 inline" />
                                            </button>
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

export default SystemRoles;
