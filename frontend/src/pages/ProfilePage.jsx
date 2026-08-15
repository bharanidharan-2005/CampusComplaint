import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Building2, Save } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import Spinner from '../components/ui/Spinner';

const ProfilePage = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // Prefer the role returned by the profile API (authoritative); fall back to
    // the cached campusUser role so the field is never blank.
    const role = (profile?.role || user?.role || '').toLowerCase();
    const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
    const isStudent = role === 'student';
    // Dean and Principal are not tied to a single department, so hide that field.
    const showDepartment = !['dean', 'principal'].includes(role);

    useEffect(() => {
        api.get('profile/').then((r) => setProfile(r.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

    const save = async () => {
        setSaving(true);
        try {
            await api.patch('profile/update/', {
                name: profile.name, registerNumber: profile.register_number,
                year: profile.study_year, department: profile.department_name,
            });
            alert('Profile updated.');
        } catch { alert('Failed to update profile.'); } finally { setSaving(false); }
    };

    if (loading) return <Spinner label="Loading profile..." />;
    if (!profile) return <MainLayout title="My Profile"><p className="text-slate-500">Could not load profile.</p></MainLayout>;

    return (
        <MainLayout title="My Profile">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold">
                        {(profile.name || profile.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
                        <p className="text-sm text-slate-400">{displayRole}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Field icon={User} label="Full Name" value={profile.name}
                        editable={isStudent} onChange={(v) => update('name', v)} />
                    <Field icon={Mail} label="Email" value={profile.email} />
                    <Field icon={Shield} label="Role" value={displayRole} />
                    {showDepartment && (
                        <Field icon={Building2} label="Department" value={profile.department_name || '—'}
                            editable={isStudent} onChange={(v) => update('department_name', v)} />
                    )}
                    {isStudent && (
                        <>
                            <Field icon={User} label="Register Number" value={profile.register_number}
                                editable onChange={(v) => update('register_number', v)} />
                            <Field icon={User} label="Study Year" value={profile.study_year}
                                editable onChange={(v) => update('study_year', v)} />
                        </>
                    )}
                </div>

                {isStudent && (
                    <button onClick={save} disabled={saving}
                        className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50">
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>
        </MainLayout>
    );
};

const Field = ({ icon: Icon, label, value, editable, onChange }) => (
    <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><Icon size={18} /></div>
        <div className="flex-1">
            <p className="text-xs text-slate-400">{label}</p>
            {editable ? (
                <input value={value ?? ''} onChange={(e) => onChange(e.target.value)}
                    className="w-full text-sm font-medium text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none focus:border-indigo-400" />
            ) : (
                <p className="text-sm font-medium text-slate-800">{value ?? '—'}</p>
            )}
        </div>
    </div>
);

export default ProfilePage;
