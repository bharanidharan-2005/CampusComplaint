import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const ActiveDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await api.get('departments/');
                setDepartments(response.data);
            } catch (err) {
                setError('Failed to fetch department data from the system.');
            } finally {
                setLoading(false);
            }
        };
        fetchDepartments();
    }, []);

    const filteredDepartments = departments.filter(
        (dept) => dept.name && dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Spinner label="Loading Database Records..." />;

    return (
        <MainLayout title="Active Departments">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                    <input type="text" placeholder="Search departments..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-slate-700 w-full" />
                </div>
                <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
                    <Plus className="w-4 h-4" /> Add Department
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl mb-6">{error}</div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                {filteredDepartments.length === 0 ? (
                    <EmptyState icon={Search} title="No department records found" description="Departments will appear here once added." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4 font-semibold">Department Name</th>
                                    <th className="py-3 px-4 font-semibold">Head of Department</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDepartments.map((dept, index) => (
                                    <tr key={dept.id || index} className="hover:bg-slate-50 transition">
                                        <td className="py-4 px-4 font-medium text-slate-800">{dept.name || 'N/A'}</td>
                                        <td className="py-4 px-4 text-slate-500">{dept.hod_name || 'Not Assigned'}</td>
                                        <td className="py-4 px-4"><Badge tone="emerald">Active</Badge></td>
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

export default ActiveDepartments;
