import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, UserPlus, MoreVertical } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const ROLE_TITLES = {
    student: 'Student Management',
    faculty: 'Faculty Management',
    hod: 'HOD Management',
    dean: 'Dean Management',
    principal: 'Principal Management',
};

const ManageUsers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const roleFilter = (searchParams.get('role') || '').toLowerCase();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('users/');
                setUsers(response.data);
            } catch (err) {
                setError((err.response?.data?.detail) || 'Failed to fetch real user data from the system.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter((user) => {
        const matchesRole = !roleFilter || (user.role || '').toLowerCase() === roleFilter;
        const matchesSearch = !searchTerm
            || (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
            || (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesRole && matchesSearch;
    });

    if (loading) return <Spinner label="Loading Database Records..." />;

    return (
        <MainLayout title={roleFilter ? (ROLE_TITLES[roleFilter] || 'Manage Users') : 'Manage Users'}>
            {error && (
                <div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl mb-6">{error}</div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                        <input type="text" placeholder="Search active users..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-slate-700 w-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        {roleFilter && (
                            <button onClick={() => setSearchParams({})} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">
                                View All Users
                            </button>
                        )}
                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            <UserPlus className="w-4 h-4" /> Add User
                        </button>
                    </div>
                </div>

                {filteredUsers.length === 0 ? (
                    <EmptyState icon={Search} title="No users found" description="Try a different search term." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4 font-semibold">Name</th>
                                    <th className="py-3 px-4 font-semibold">Email</th>
                                    <th className="py-3 px-4 font-semibold">Role</th>
                                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user, index) => (
                                    <tr key={user.id || index} className="hover:bg-slate-50 transition">
                                        <td className="py-4 px-4 font-medium text-slate-800">{user.name || user.username || user.first_name || 'N/A'}</td>
                                        <td className="py-4 px-4 text-slate-500">{user.email || 'N/A'}</td>
                                        <td className="py-4 px-4">
                                            <Badge tone={user.is_staff ? 'violet' : 'slate'}>
                                                {user.is_staff ? 'Admin' : (user.role || 'User')}
                                            </Badge>
                                        </td>
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

export default ManageUsers;
