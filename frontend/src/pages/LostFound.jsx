import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PackageCheck, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const categories = ['Electronics', 'Wallets/IDs', 'Keys', 'Clothing', 'Other'];

const LostFound = () => {
    const [itemType, setItemType] = useState('Lost');
    const [itemName, setItemName] = useState('');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuth();
    const role = (user?.role || '').toLowerCase();
    const homePath = ['faculty', 'staff'].includes(role) ? '/faculty/dashboard' : '/student/dashboard';

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('type', itemType);
        formData.append('item_name', itemName);
        formData.append('category', category === 'Other' ? customCategory : category);
        formData.append('date', date);
        formData.append('location', location);
        formData.append('description', description);
        if (image) formData.append('image', image);

        try {
            await api.post('lost-found/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccessMsg(`${itemType} item reported successfully!`);
            setTimeout(() => navigate(homePath), 2000);
        } catch (err) {
            console.error('Submission error:', err);
            setError('Failed to submit report. Please check your connection.');
            setLoading(false);
        }
    };

    const field = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200';

    return (
        <MainLayout title="Lost & Found">
            <div className="max-w-3xl mx-auto">
                {successMsg && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-2xl mb-6 font-semibold">
                        <CheckCircle2 /> {successMsg}
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-600 px-5 py-4 rounded-2xl mb-6 font-semibold">
                        <AlertCircle /> {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h2 className="text-2xl font-bold text-slate-800">Report an Item</h2>

                    <form onSubmit={handleSubmit} className="mt-6">
                        <label className="block text-sm font-bold text-slate-700 mb-3">Are you reporting a Lost or Found item?</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {[{ v: 'Lost', label: 'I Lost Something', icon: Search }, { v: 'Found', label: 'I Found Something', icon: PackageCheck }].map((o) => (
                                <button type="button" key={o.v} onClick={() => setItemType(o.v)}
                                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition ${
                                        itemType === o.v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}>
                                    <o.icon size={20} />
                                    <span className="font-semibold">{o.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <input className={field} placeholder="Item Name" required value={itemName} onChange={(e) => setItemName(e.target.value)} />
                            <select className={field} required value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option value="" disabled>Select Category</option>
                                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {category === 'Other' && (
                                <input className={`${field} sm:col-span-2`} placeholder="Please specify the product / item name" required
                                    value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
                            )}
                            <input type="date" className={field} required value={date} onChange={(e) => setDate(e.target.value)} />
                            <input className={field} placeholder={`Location ${itemType}`} required value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>

                        <textarea className={`${field} mb-4`} placeholder="Detailed Description" required rows={4}
                            value={description} onChange={(e) => setDescription(e.target.value)} />

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
                            <p className="text-sm font-semibold text-slate-600 mb-1">Upload an Image (Highly Recommended)</p>
                            <input type="file" accept="image/*" onChange={handleImageChange}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60">
                            <Send size={18} /> {loading ? 'Submitting...' : `Submit ${itemType} Report`}
                        </button>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
};

export default LostFound;
