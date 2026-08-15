import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hammer, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SubmitComplaint = () => {
    const [category, setCategory] = useState('Construction');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [image, setImage] = useState(null);
    const [personName, setPersonName] = useState('');
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
        formData.append('category', category);
        formData.append('title', title);
        formData.append('description', description);
        if (category === 'Construction') {
            formData.append('location', location);
            if (image) formData.append('image', image);
        } else if (category === 'Behavior') {
            formData.append('person_name', personName);
        }

        try {
            await api.post('complaints/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccessMsg('Complaint submitted successfully!');
            setTimeout(() => navigate(homePath), 2000);
        } catch (err) {
            console.error('Submission error:', err);
            setError('Failed to submit complaint. Ensure all required fields are filled.');
            setLoading(false);
        }
    };

    const categories = [
        { value: 'Construction', label: 'Construction / Maintenance', icon: Hammer },
        { value: 'Behavior', label: 'Behavioral Issue', icon: AlertTriangle },
    ];

    return (
        <MainLayout title="Submit a Complaint">
            <div className="max-w-3xl mx-auto">
                {successMsg && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-2xl mb-6 font-semibold">
                        <CheckCircle2 /> {successMsg}
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-600 px-5 py-4 rounded-2xl mb-6 font-semibold">
                        <AlertTriangle /> {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h2 className="text-2xl font-bold text-slate-800">Raise a New Issue</h2>
                    <p className="text-sm text-slate-500 mt-1 mb-6">
                        Your identity details are automatically attached to this report.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Complaint Category</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {categories.map((c) => (
                                <button type="button" key={c.value} onClick={() => setCategory(c.value)}
                                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition ${
                                        category === c.value
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}>
                                    <c.icon size={20} />
                                    <span className="font-semibold">{c.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
                            {category === 'Construction' ? (
                                <>
                                    <input className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-3"
                                        placeholder="Specific Location (e.g., Ground Floor Restroom)" required
                                        value={location} onChange={(e) => setLocation(e.target.value)} />
                                    <p className="text-sm font-semibold text-slate-600 mb-1">Upload Image (Highly Recommended)</p>
                                    <input type="file" accept="image/*" onChange={handleImageChange}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                </>
                            ) : (
                                <input className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    placeholder="Name of the Person Involved" required
                                    value={personName} onChange={(e) => setPersonName(e.target.value)} />
                            )}
                        </div>

                        <input className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-4"
                            placeholder="Title / Short Summary" required
                            value={title} onChange={(e) => setTitle(e.target.value)} />
                        <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-6"
                            placeholder="Detailed Description of the Issue" required rows={4}
                            value={description} onChange={(e) => setDescription(e.target.value)} />

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-60">
                            <Send size={18} /> {loading ? 'Submitting...' : 'Submit Complaint'}
                        </button>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
};

export default SubmitComplaint;
