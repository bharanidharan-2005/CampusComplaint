export default function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                    {title}
                </h1>
                {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}
