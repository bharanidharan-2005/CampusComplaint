import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, X, CheckCircle } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const ConfigureCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('categories/');
                setCategories(response.data);
            } catch (err) {
                setError('Failed to fetch category data from the system.');
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await api.post('categories/', {
                name: newCategoryName,
                description: 'System generated category',
            });
            setCategories([...categories, response.data]);
            setSuccessMessage(`Category "${newCategoryName}" created successfully!`);
            setShowModal(false);
            setNewCategoryName('');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('Failed to save category. Please check your backend configuration.');
            setShowModal(false);
        }
    };

    const filteredCategories = categories.filter(
        (category) => category.name && category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Spinner label="Loading Categories..." />;

    return (
        <MainLayout title="Configure Categories">
            <div className="flex items-center justify-end mb-6">
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
                    <Plus className="w-4 h-4" /> Add Category
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl mb-6 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                </div>
            )}
            {successMessage && (
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-4 rounded-xl mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage(null)} className="hover:text-emerald-700 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="relative w-full sm:w-72 mb-6">
                    <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                    <input type="text" placeholder="Search categories..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-slate-700 w-full" />
                </div>

                {filteredCategories.length === 0 ? (
                    <EmptyState icon={Search} title="No category records found" description="Add a category to get started." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4 font-semibold">Category Name</th>
                                    <th className="py-3 px-4 font-semibold">Description</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCategories.map((category, index) => (
                                    <tr key={category.id || index} className="hover:bg-slate-50 transition">
                                        <td className="py-4 px-4 font-medium text-indigo-700">{category.name || 'N/A'}</td>
                                        <td className="py-4 px-4 text-slate-500">{category.description || 'No description provided.'}</td>
                                        <td className="py-4 px-4"><Badge tone="indigo">Active</Badge></td>
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

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800">Create New Category</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddCategory}>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Category Name</label>
                            <input type="text" required value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-slate-700"
                                placeholder="e.g., Maintenance, IT Support..." />
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                                <button type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition">Save Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default ConfigureCategories;
