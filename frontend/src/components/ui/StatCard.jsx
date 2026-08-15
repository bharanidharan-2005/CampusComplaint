import Card from './Card';

const TONES = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    sky: 'bg-sky-50 text-sky-600',
};

export default function StatCard({ label, value, icon: Icon, tone = 'indigo', onClick, active = false }) {
    return (
        <Card
            onClick={onClick}
            className={`p-6 transition-all ${
                onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md' : ''
            } ${active ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}`}
        >
            <div className="flex items-center justify-between mb-3">
                <p className="text-slate-500 font-semibold text-sm">{label}</p>
                {Icon && (
                    <div className={`p-2.5 rounded-xl ${TONES[tone] || TONES.indigo}`}>
                        <Icon size={22} />
                    </div>
                )}
            </div>
            <h2 className="text-3xl font-black text-slate-800">{value}</h2>
        </Card>
    );
}
