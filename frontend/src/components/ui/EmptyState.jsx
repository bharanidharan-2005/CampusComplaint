export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            {Icon && <Icon size={48} className="mb-3 opacity-30" />}
            <p className="font-semibold text-slate-600">{title}</p>
            {description && (
                <p className="text-xs text-slate-400 mt-1 text-center max-w-xs">{description}</p>
            )}
            {action}
        </div>
    );
}
