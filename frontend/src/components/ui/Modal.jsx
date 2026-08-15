import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, footer }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
                {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">{footer}</div>}
            </div>
        </div>
    );
};

export default Modal;
