import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading...', className = '' }) {
    return (
        <div className={`flex flex-col justify-center items-center min-h-screen gap-3 bg-slate-50 ${className}`}>
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-slate-600 font-semibold tracking-wide text-sm">{label}</p>
        </div>
    );
}
