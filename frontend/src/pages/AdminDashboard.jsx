import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, LayoutDashboard, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const response = await api.get('dashboard/admin/');
                setDashboardData(response.data);
            } catch (err) {
                setError(
                    (err.response?.data?.detail) ||
                    (err.response?.data?.message) ||
                    err.message ||
                    'Failed to fetch admin metrics'
                );
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    if (loading) return <Spinner label="Loading System Data..." />;

    if (error) return (
        <MainLayout title="Admin Dashboard">
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-8 rounded-2xl text-center max-w-md mx-auto">
                <p className="font-semibold mb-6">{error}</p>
                <button onClick={() => navigate('/login')}
                    className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
                    Go to Login
                </button>
            </div>
        </MainLayout>
    );

    if (!dashboardData) return null;

    return (
        <MainLayout title="Admin Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard label="Total Active Users" value={dashboardData.totalUsers || 0} icon={Users} tone="blue"
                    onClick={() => navigate('/admin/users')} />
                <StatCard label="System Roles" value={dashboardData.totalRoles || 0} icon={ShieldAlert} tone="violet"
                    onClick={() => navigate('/admin/roles')} />
                <StatCard label="Active Departments" value={dashboardData.totalDepartments || 0} icon={LayoutDashboard} tone="emerald"
                    onClick={() => navigate('/admin/departments')} />
                <StatCard label="System Logs (24h)" value={dashboardData.systemLogsCount || 0} icon={Settings} tone="slate"
                    onClick={() => navigate('/admin/logs')} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
                </div>
                <div className="p-6 flex flex-wrap gap-4">
                    <button onClick={() => navigate('/admin/users')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl">
                        Manage Users
                    </button>
                    <button onClick={() => navigate('/admin/categories')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl">
                        Configure Categories
                    </button>
                </div>
            </div>
        </MainLayout>
    );
};

export default AdminDashboard;
