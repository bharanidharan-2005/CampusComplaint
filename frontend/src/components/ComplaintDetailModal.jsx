import React, { useState, useEffect } from 'react';
import { X, User, FileText, Calendar, AlertTriangle, Loader } from 'lucide-react';
import api from '../services/api';
import StatusBadge from './ui/StatusBadge';

const Field = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm text-slate-800 font-medium break-words">{value || '—'}</p>
    </div>
);

const ComplaintDetailModal = ({ complaintId, onClose }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!complaintId) return;
        setLoading(true);
        setError(null);
        api.get(`complaints/${complaintId}/detail/`)
            .then((res) => setDetail(res.data))
            .catch(() => setError('Failed to load complaint details.'))
            .finally(() => setLoading(false));
    }, [complaintId]);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">
                        Complaint {detail ? `#${detail.id}` : ''}
                        {detail && (
                            <span className="ml-3">
                                <StatusBadge status={detail.status} />
                            </span>
                        )}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-200"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-16 text-slate-400">
                            <Loader className="animate-spin mr-3" size={22} />
                            Loading details...
                        </div>
                    )}

                    {!loading && error && (
                        <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-4 text-center">
                            {error}
                        </div>
                    )}

                    {!loading && !error && detail && (
                        <div className="space-y-6">
                            {/* Student / Faculty Identity */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <User size={16} className="text-indigo-500" />
                                    <h4 className="font-bold text-slate-800">
                                        {detail.raised_by_role === 'Faculty' ? 'Faculty Details' : 'Student Details'}
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                                    <Field label="Full Name" value={detail.student.name} />
                                    {detail.raised_by_role !== 'Faculty' && (
                                        <Field label="Register Number" value={detail.student.register_number} />
                                    )}
                                    <Field label="Department" value={detail.student.department} />
                                    {detail.raised_by_role !== 'Faculty' && (
                                        <Field label="Year" value={detail.student.year} />
                                    )}
                                    <Field label="Email" value={detail.student.email} />
                                </div>
                            </div>

                            {/* Issue Details */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText size={16} className="text-indigo-500" />
                                    <h4 className="font-bold text-slate-800">Issue Details</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Title" value={detail.title} />
                                    <Field label="Category" value={detail.category} />
                                    <Field label="Priority" value={detail.priority} />
                                    <Field label="Location" value={detail.location} />
                                    <Field label="Person Involved" value={detail.person_name} />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">Description</h4>
                                <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 whitespace-pre-wrap">
                                    {detail.description || 'No description provided.'}
                                </p>
                            </div>

                            {/* Meta / Image */}
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Calendar size={14} />
                                Raised on {detail.created_at || 'Unknown'}
                                {detail.person_name && (
                                    <span className="inline-flex items-center gap-1">
                                        <AlertTriangle size={14} /> This complaint references a person
                                    </span>
                                )}
                            </div>

                            {detail.image && (
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2">Attachment</h4>
                                    <img
                                        src={detail.image}
                                        alt="Complaint attachment"
                                        className="rounded-xl border border-slate-200 max-h-80 object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetailModal;